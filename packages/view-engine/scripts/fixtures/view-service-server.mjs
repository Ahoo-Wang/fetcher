/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */
import { createServer } from 'node:http';
import { setTimeout as delay } from 'node:timers/promises';

const WRITE_STATUS = observation =>
  observation.outcome === 'committed'
    ? 200
    : observation.outcome === 'rejected'
      ? undefined
      : 202;

/** Test-only HTTP boundary. Identities are resolved by server-owned bearer sessions, never request bodies. */
export async function startViewService({
  Host,
  ServiceError,
  statuses,
  definition,
  instances,
  defaultInstanceId = null,
  source,
  port = 0,
  allowedOrigin = 'http://127.0.0.1:6006',
}) {
  const values = new Map();
  const accounts = new Map([
    [
      'alice-token',
      {
        user: 'alice',
        service: 'tenant',
        writer: true,
        order: true,
        revision: 1,
      },
    ],
    [
      'bob-token',
      {
        user: 'bob',
        service: 'tenant',
        writer: false,
        order: true,
        revision: 1,
      },
    ],
    [
      'outsider-token',
      {
        user: 'alice',
        service: 'other-tenant',
        writer: true,
        order: true,
        revision: 1,
      },
    ],
  ]);
  const control = {
    delayNextRead: 0,
    delayNextPermissionResponse: 0,
    delayedPermissionResponses: 0,
    delayNextCreateResponse: 0,
    delayedCreateResponses: 0,
    dropNextCreateResponse: false,
    abortedReads: 0,
    delayedReads: 0,
    mutations: 0,
  };
  const hostFor = account =>
    new Host({
      definition,
      instances,
      defaultInstanceId,
      definitionPermissions: () => ({
        createPersonal: true,
        createShared: account.writer,
      }),
      store: values,
      serviceKey: account.service,
      scopeKey: account.user,
      resolveSource: () => source,
      instancePermissions: instance => ({
        save: account.writer || instance.scope.type === 'personal',
        rename: account.writer || instance.scope.type === 'personal',
        delete: account.writer || instance.scope.type === 'personal',
        saveAsPersonal: true,
        saveAsShared: account.writer,
      }),
      canReorder: () => account.order,
      canSetDefault: () => true,
    });
  /** The service's own projection of this account's grants over every visible instance. */
  const permissionSnapshot = async (host, account, signal) => {
    const instancesById = {};
    let cursor = null;
    do {
      const page = await host.instance.list(definition.id, {
        cursor,
        limit: 200,
        signal,
      });
      for (const item of page.items)
        instancesById[item.id] = host.permission.getInstance(item);
      cursor = page.nextCursor;
    } while (cursor);
    return {
      revision: account.revision,
      instances: instancesById,
      ...host.permission.getDefinition(),
    };
  };
  const server = createServer(async (request, response) => {
    response.setHeader('Vary', 'Origin');
    if (request.headers.origin && request.headers.origin !== allowedOrigin) {
      response.writeHead(403).end();
      return;
    }
    response.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    response.setHeader(
      'Access-Control-Allow-Headers',
      'authorization, content-type, idempotency-key, if-match, x-definition-revision',
    );
    response.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    );
    if (request.method === 'OPTIONS') {
      response.writeHead(204).end();
      return;
    }
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Cache-Control', 'no-store');
    const controller = new AbortController();
    request.on('aborted', () => controller.abort());
    response.on('close', () => {
      if (!response.writableEnded) controller.abort();
    });
    let host;
    let account;
    const send = async (status, data, error) => {
      let permissions;
      if (host) {
        try {
          permissions = await permissionSnapshot(
            host,
            account,
            controller.signal,
          );
        } catch (permissionError) {
          if (status < 400) throw permissionError;
        }
      }
      if (
        request.url.endsWith('/permissions') &&
        control.delayNextPermissionResponse
      ) {
        const ms = control.delayNextPermissionResponse;
        control.delayNextPermissionResponse = 0;
        control.delayedPermissionResponses++;
        await delay(ms, undefined, { signal: controller.signal });
      }
      if (!response.destroyed)
        response.writeHead(status).end(
          JSON.stringify({
            data: data ?? null,
            permissions,
            ...(error ? { error } : {}),
          }),
        );
    };
    try {
      const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
      account = accounts.get(token);
      if (!account) throw new ServiceError('UNAUTHENTICATED', '服务端会话无效');
      host = hostFor(account);
      const url = new URL(request.url, 'http://localhost');
      const path = url.pathname
        .split('/')
        .filter(Boolean)
        .map(decodeURIComponent);
      if (
        path[0] !== 'view-service' ||
        path[1] !== 'definitions' ||
        path[2] !== definition.id
      )
        throw new ServiceError('NOT_FOUND', '视图定义不存在');
      if (request.method === 'GET' && control.delayNextRead) {
        control.delayedReads++;
        const ms = control.delayNextRead;
        control.delayNextRead = 0;
        try {
          await delay(ms, undefined, { signal: controller.signal });
        } catch (error) {
          if (controller.signal.aborted) control.abortedReads++;
          throw error;
        }
      }
      let text = '';
      for await (const chunk of request) {
        text += chunk;
        if (text.length > 1024 * 1024)
          throw new ServiceError('INVALID_ARGUMENT', '请求体过大');
      }
      let body;
      try {
        body = text ? JSON.parse(text) : undefined;
      } catch {
        throw new ServiceError('INVALID_ARGUMENT', 'JSON 无效');
      }
      const revision = () => {
        try {
          const header = request.headers['if-match'] ?? '';
          const match = /^"(.*)"$/.exec(header);
          const value = match ? decodeURIComponent(match[1]) : '';
          if (!value) throw new Error();
          return value;
        } catch {
          throw new ServiceError(
            'PRECONDITION_REQUIRED',
            '写入必须提供 If-Match revision',
          );
        }
      };
      const context = () => {
        const encoded = request.headers['idempotency-key'];
        let requestId;
        try {
          requestId =
            typeof encoded === 'string' ? decodeURIComponent(encoded) : encoded;
        } catch {
          requestId = undefined;
        }
        if (typeof requestId !== 'string' || !requestId.trim())
          throw new ServiceError(
            'INVALID_ARGUMENT',
            '写入必须提供 Idempotency-Key',
          );
        const encodedDefinition = request.headers['x-definition-revision'];
        const definitionRevision =
          typeof encodedDefinition === 'string' && encodedDefinition
            ? decodeURIComponent(encodedDefinition)
            : undefined;
        return {
          requestId,
          signal: controller.signal,
          ...(definitionRevision ? { definitionRevision } : {}),
        };
      };
      const readOptions = () => ({
        signal: controller.signal,
        ...(url.searchParams.get('readFence')
          ? { readFence: url.searchParams.get('readFence') }
          : {}),
      });
      const write = async (observation, created = false) => {
        control.mutations++;
        const status =
          WRITE_STATUS(observation) ??
          statuses[observation.issue.code] ??
          statuses.UNAVAILABLE;
        await send(
          status === 200 && created ? 201 : status,
          observation,
          observation.outcome === 'rejected' ? observation.issue : undefined,
        );
      };
      if (request.method === 'GET' && path.length === 3)
        await send(
          200,
          await host.definition.load(definition.id, readOptions()),
        );
      else if (
        request.method === 'GET' &&
        path[3] === 'permissions' &&
        path.length === 4
      )
        await send(
          200,
          await permissionSnapshot(host, account, controller.signal),
        );
      else if (
        request.method === 'GET' &&
        path[3] === 'instances' &&
        path.length === 4
      ) {
        const limit = url.searchParams.get('limit');
        await send(
          200,
          await host.instance.list(definition.id, {
            ...readOptions(),
            query: url.searchParams.get('query') ?? undefined,
            cursor: url.searchParams.get('cursor') ?? undefined,
            ...(limit === null ? {} : { limit: Number(limit) }),
          }),
        );
      } else if (
        request.method === 'GET' &&
        path[3] === 'instances' &&
        path.length === 5
      )
        await send(200, await host.instance.load(path[4], readOptions()));
      else if (
        request.method === 'POST' &&
        path[3] === 'instances' &&
        path.length === 4
      ) {
        const observation = await host.instance.create(body, context());
        if (control.delayNextCreateResponse) {
          const ms = control.delayNextCreateResponse;
          control.delayNextCreateResponse = 0;
          control.delayedCreateResponses++;
          await delay(ms, undefined, { signal: controller.signal });
        }
        if (control.dropNextCreateResponse) {
          control.dropNextCreateResponse = false;
          control.mutations++;
          response.destroy();
          return;
        }
        await write(observation, true);
      } else if (
        request.method === 'PUT' &&
        path[3] === 'instances' &&
        path.length === 5
      ) {
        if (!body || body.id !== path[4] || body.revision !== revision())
          throw new ServiceError('INVALID_ARGUMENT', '路径、正文和版本不一致');
        await write(await host.instance.save(body, context()));
      } else if (
        request.method === 'PATCH' &&
        path[3] === 'instances' &&
        path[5] === 'name' &&
        path.length === 6
      )
        await write(
          await host.instance.rename(
            path[4],
            body?.title,
            revision(),
            context(),
          ),
        );
      else if (
        request.method === 'DELETE' &&
        path[3] === 'instances' &&
        path.length === 5
      )
        await write(await host.instance.delete(path[4], revision(), context()));
      else if (
        request.method === 'GET' &&
        path[3] === 'preferences' &&
        path.length === 4
      )
        await send(
          200,
          await host.preference.load(definition.id, readOptions()),
        );
      else if (
        request.method === 'PUT' &&
        path[3] === 'preferences' &&
        path[4] === 'order' &&
        path.length === 5
      )
        await write(
          await host.preference.saveOrder(
            definition.id,
            body?.change,
            body?.precondition,
            context(),
          ),
        );
      else if (
        request.method === 'PUT' &&
        path[3] === 'preferences' &&
        path[4] === 'default' &&
        path.length === 5
      )
        await write(
          await host.preference.saveDefault(
            definition.id,
            body?.instanceId,
            body?.precondition,
            context(),
          ),
        );
      else if (
        request.method === 'GET' &&
        path[3] === 'operations' &&
        path.length === 6
      )
        await send(
          200,
          await host.operation.reconcile(
            {
              resource: path[4],
              definitionId: definition.id,
              requestId: path[5],
              ...(url.searchParams.get('targetId')
                ? { targetId: url.searchParams.get('targetId') }
                : {}),
            },
            readOptions(),
          ),
        );
      else throw new ServiceError('NOT_FOUND', '接口不存在');
    } catch (error) {
      if (controller.signal.aborted) return;
      const code = error instanceof ServiceError ? error.code : 'UNAVAILABLE';
      if (code === 'UNAUTHENTICATED')
        response.setHeader('WWW-Authenticate', 'Bearer');
      try {
        await send(statuses[code], null, { code, message: error.message });
      } catch {
        if (!response.destroyed)
          response.writeHead(503).end(
            JSON.stringify({
              error: { code: 'UNAVAILABLE', message: '服务存储不可用' },
            }),
          );
      }
    }
  });
  await new Promise(resolve => server.listen(port, '127.0.0.1', resolve));
  return {
    baseUrl: `http://127.0.0.1:${server.address().port}/view-service/`,
    control,
    hostFor: token => hostFor(accounts.get(token)),
    setWriter(token, writer) {
      const account = accounts.get(token);
      account.writer = writer;
      account.revision++;
    },
    async close() {
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    },
  };
}
