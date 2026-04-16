import type { Operation, Parameter, RequestBody, Response } from '@ahoo-wang/fetcher-openapi';

const createUserOperation: Operation = {
  operationId: 'createUser',
  summary: 'Create a new user',
  tags: ['users'],
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: { type: 'object' },
      },
    },
  },
  responses: {
    '201': { description: 'User created' },
  },
};
