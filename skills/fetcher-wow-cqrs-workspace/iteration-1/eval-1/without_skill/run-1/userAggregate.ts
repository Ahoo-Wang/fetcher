/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type {
  AggregateId,
  AggregateIdCapable,
  AggregateNameCapable,
  CommandResult,
  ErrorInfo,
  FunctionInfo,
  FunctionInfoCapable,
  Identifier,
  NamedBoundedContext,
  StateCapable,
  TenantId,
  Version,
} from '@ahoo-wang/fetcher-wow';
import {
  CommandStage,
  ErrorCodes,
} from '@ahoo-wang/fetcher-wow';

/**
 * User aggregate state interface
 */
export interface UserState extends Version, TenantId {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: number;
  updatedAt: number;
  deleted: boolean;
}

/**
 * CreateUserCommand - Command to create a new user
 */
export interface CreateUserCommand extends TenantId {
  username: string;
  email: string;
  password: string;
}

/**
 * UpdateUserCommand - Command to update an existing user
 */
export interface UpdateUserCommand extends AggregateId {
  username?: string;
  email?: string;
  password?: string;
}

/**
 * DeleteUserCommand - Command to delete a user
 */
export interface DeleteUserCommand extends AggregateId {}

/**
 * User aggregate result interface
 */
export interface UserResult {
  userId?: string;
  username?: string;
  email?: string;
  createdAt?: number;
}

/**
 * WowCommandResult factory function
 */
function createCommandResult(
  id: string,
  boundedContext: string,
  aggregateName: string,
  aggregateId: AggregateId & TenantId,
  commandId: string,
  requestId: string,
  stage: CommandStage,
  result: Record<string, any>,
  aggregateVersion?: number,
  errorInfo: ErrorInfo = { errorCode: ErrorCodes.SUCCEEDED, errorMsg: ErrorCodes.SUCCEEDED_MESSAGE },
  functionInfo?: FunctionInfo
): CommandResult {
  return {
    id,
    boundedContext,
    aggregateName,
    aggregateId: aggregateId.aggregateId,
    aggregateVersion,
    commandId,
    requestId,
    stage,
    result,
    tenantId: aggregateId.tenantId,
    errorCode: errorInfo.errorCode,
    errorMsg: errorInfo.errorMsg,
    bindingErrors: errorInfo.bindingErrors,
    function: functionInfo,
  } as CommandResult;
}

/**
 * User aggregate class implementing WowAggregate pattern
 */
export class UserAggregate implements
  AggregateNameCapable,
  AggregateIdCapable,
  StateCapable<UserState>,
  FunctionInfoCapable {

  readonly aggregateName: string = 'User';
  readonly boundedContext: string = 'user-service';
  state!: UserState;
  function!: FunctionInfo;

  private version: number = 0;

  constructor(
    private readonly aggregateId: AggregateId & TenantId,
    initialState?: UserState
  ) {
    if (initialState) {
      this.state = initialState;
      this.version = initialState.version ?? 0;
    } else {
      this.state = this.createInitialState();
    }
  }

  private createInitialState(): UserState {
    return {
      id: this.aggregateId.aggregateId.id,
      version: 0,
      tenantId: this.aggregateId.tenantId,
      username: '',
      email: '',
      passwordHash: '',
      createdAt: 0,
      updatedAt: 0,
      deleted: false,
    };
  }

  /**
   * Handle CreateUserCommand
   */
  handleCreateUserCommand(
    command: CreateUserCommand,
    commandId: string,
    requestId: string
  ): CommandResult {
    const now = Date.now();

    // Validate command
    const validationError = this.validateCreateCommand(command);
    if (validationError) {
      return createCommandResult(
        this.aggregateId.aggregateId.id,
        this.boundedContext,
        this.aggregateName,
        this.aggregateId,
        commandId,
        requestId,
        CommandStage.PROCESSED,
        {},
        this.version,
        validationError,
        this.function
      );
    }

    // Check if user already exists (non-deleted)
    if (this.state.username || this.state.email) {
      return createCommandResult(
        this.aggregateId.aggregateId.id,
        this.boundedContext,
        this.aggregateName,
        this.aggregateId,
        commandId,
        requestId,
        CommandStage.PROCESSED,
        {},
        this.version,
        {
          errorCode: ErrorCodes.ILLEGAL_STATE,
          errorMsg: 'User already exists',
        },
        this.function
      );
    }

    // Apply state changes
    this.state = {
      ...this.state,
      username: command.username,
      email: command.email,
      passwordHash: this.hashPassword(command.password),
      createdAt: now,
      updatedAt: now,
      deleted: false,
    };
    this.version++;

    const result: UserResult = {
      userId: this.state.id,
      username: this.state.username,
      email: this.state.email,
      createdAt: this.state.createdAt,
    };

    return createCommandResult(
      this.aggregateId.aggregateId.id,
      this.boundedContext,
      this.aggregateName,
      this.aggregateId,
      commandId,
      requestId,
      CommandStage.PROCESSED,
      result,
      this.version,
      undefined,
      this.function
    );
  }

  /**
   * Handle UpdateUserCommand
   */
  handleUpdateUserCommand(
    command: UpdateUserCommand,
    commandId: string,
    requestId: string
  ): CommandResult {
    // Validate aggregate is not deleted
    if (this.state.deleted) {
      return createCommandResult(
        this.aggregateId.aggregateId.id,
        this.boundedContext,
        this.aggregateName,
        this.aggregateId,
        commandId,
        requestId,
        CommandStage.PROCESSED,
        {},
        this.version,
        {
          errorCode: ErrorCodes.ILLEGAL_ACCESS_DELETED_AGGREGATE,
          errorMsg: 'Cannot update deleted user',
        },
        this.function
      );
    }

    // Validate command
    const validationError = this.validateUpdateCommand(command);
    if (validationError) {
      return createCommandResult(
        this.aggregateId.aggregateId.id,
        this.boundedContext,
        this.aggregateName,
        this.aggregateId,
        commandId,
        requestId,
        CommandStage.PROCESSED,
        {},
        this.version,
        validationError,
        this.function
      );
    }

    // Apply state changes
    const now = Date.now();
    if (command.username !== undefined) {
      this.state.username = command.username;
    }
    if (command.email !== undefined) {
      this.state.email = command.email;
    }
    if (command.password !== undefined) {
      this.state.passwordHash = this.hashPassword(command.password);
    }
    this.state.updatedAt = now;
    this.version++;

    const result: UserResult = {
      userId: this.state.id,
      username: this.state.username,
      email: this.state.email,
    };

    return createCommandResult(
      this.aggregateId.aggregateId.id,
      this.boundedContext,
      this.aggregateName,
      this.aggregateId,
      commandId,
      requestId,
      CommandStage.PROCESSED,
      result,
      this.version,
      undefined,
      this.function
    );
  }

  /**
   * Handle DeleteUserCommand
   */
  handleDeleteUserCommand(
    command: DeleteUserCommand,
    commandId: string,
    requestId: string
  ): CommandResult {
    // Validate aggregate is not already deleted
    if (this.state.deleted) {
      return createCommandResult(
        this.aggregateId.aggregateId.id,
        this.boundedContext,
        this.aggregateName,
        this.aggregateId,
        commandId,
        requestId,
        CommandStage.PROCESSED,
        {},
        this.version,
        {
          errorCode: ErrorCodes.ILLEGAL_STATE,
          errorMsg: 'User already deleted',
        },
        this.function
      );
    }

    // Soft delete
    this.state.deleted = true;
    this.state.updatedAt = Date.now();
    this.version++;

    return createCommandResult(
      this.aggregateId.aggregateId.id,
      this.boundedContext,
      this.aggregateName,
      this.aggregateId,
      commandId,
      requestId,
      CommandStage.PROCESSED,
      { userId: this.state.id, deleted: true },
      this.version,
      undefined,
      this.function
    );
  }

  /**
   * Dispatch command to appropriate handler
   */
  dispatch(command: CreateUserCommand | UpdateUserCommand | DeleteUserCommand, commandId: string, requestId: string): CommandResult {
    if (this.isCreateUserCommand(command)) {
      return this.handleCreateUserCommand(command, commandId, requestId);
    }
    if (this.isUpdateUserCommand(command)) {
      return this.handleUpdateUserCommand(command, commandId, requestId);
    }
    if (this.isDeleteUserCommand(command)) {
      return this.handleDeleteUserCommand(command, commandId, requestId);
    }
    return createCommandResult(
      this.aggregateId.aggregateId.id,
      this.boundedContext,
      this.aggregateName,
      this.aggregateId,
      commandId,
      requestId,
      CommandStage.PROCESSED,
      {},
      this.version,
      {
        errorCode: ErrorCodes.BAD_REQUEST,
        errorMsg: 'Unknown command type',
      },
      this.function
    );
  }

  private isCreateUserCommand(command: CreateUserCommand | UpdateUserCommand | DeleteUserCommand): command is CreateUserCommand {
    return 'username' in command && 'email' in command && 'password' in command && !('aggregateId' in command);
  }

  private isUpdateUserCommand(command: CreateUserCommand | UpdateUserCommand | DeleteUserCommand): command is UpdateUserCommand {
    return 'aggregateId' in command && !('deleted' in command);
  }

  private isDeleteUserCommand(command: CreateUserCommand | UpdateUserCommand | DeleteUserCommand): command is DeleteUserCommand {
    return 'aggregateId' in command && 'deleted' in command;
  }

  private validateCreateCommand(command: CreateUserCommand): ErrorInfo | undefined {
    if (!command.username || command.username.trim().length === 0) {
      return {
        errorCode: ErrorCodes.COMMAND_VALIDATION,
        errorMsg: 'Username is required',
      };
    }
    if (command.username.length < 3 || command.username.length > 50) {
      return {
        errorCode: ErrorCodes.COMMAND_VALIDATION,
        errorMsg: 'Username must be between 3 and 50 characters',
      };
    }
    if (!command.email || command.email.trim().length === 0) {
      return {
        errorCode: ErrorCodes.COMMAND_VALIDATION,
        errorMsg: 'Email is required',
      };
    }
    if (!this.isValidEmail(command.email)) {
      return {
        errorCode: ErrorCodes.COMMAND_VALIDATION,
        errorMsg: 'Invalid email format',
      };
    }
    if (!command.password || command.password.length < 8) {
      return {
        errorCode: ErrorCodes.COMMAND_VALIDATION,
        errorMsg: 'Password must be at least 8 characters',
      };
    }
    return undefined;
  }

  private validateUpdateCommand(command: UpdateUserCommand): ErrorInfo | undefined {
    if (command.username !== undefined) {
      if (command.username.trim().length === 0) {
        return {
          errorCode: ErrorCodes.COMMAND_VALIDATION,
          errorMsg: 'Username cannot be empty',
        };
      }
      if (command.username.length < 3 || command.username.length > 50) {
        return {
          errorCode: ErrorCodes.COMMAND_VALIDATION,
          errorMsg: 'Username must be between 3 and 50 characters',
        };
      }
    }
    if (command.email !== undefined) {
      if (!this.isValidEmail(command.email)) {
        return {
          errorCode: ErrorCodes.COMMAND_VALIDATION,
          errorMsg: 'Invalid email format',
        };
      }
    }
    if (command.password !== undefined && command.password.length < 8) {
      return {
        errorCode: ErrorCodes.COMMAND_VALIDATION,
        errorMsg: 'Password must be at least 8 characters',
      };
    }
    return undefined;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private hashPassword(password: string): string {
    // In production, use a proper hashing algorithm like bcrypt
    // This is a placeholder implementation
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `hash_${Math.abs(hash).toString(16)}`;
  }

  get aggregateIdValue(): AggregateId {
    return this.aggregateId.aggregateId;
  }

  get versionValue(): number {
    return this.version;
  }
}

/**
 * User aggregate factory for creating new user aggregates
 */
export function createUserAggregate(tenantId: string, userId?: string): UserAggregate {
  const id = userId || crypto.randomUUID();
  return new UserAggregate({
    tenantId,
    aggregateId: {
      id,
      aggregateName: 'User',
      boundedContext: 'user-service',
    },
  });
}

/**
 * Restore user aggregate from state
 */
export function restoreUserAggregate(state: UserState): UserAggregate {
  const aggregate = new UserAggregate({
    tenantId: state.tenantId,
    aggregateId: {
      id: state.id,
      aggregateName: 'User',
      boundedContext: 'user-service',
    },
  }, state);
  return aggregate;
}
