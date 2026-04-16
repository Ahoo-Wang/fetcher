/*
 * Wow CQRS/DDD User Aggregate Implementation
 *
 * This module provides a complete user aggregate implementation with:
 * - WowAggregate type composition
 * - CreateUserCommand, UpdateUserCommand, DeleteUserCommand handling
 * - State management with proper transitions
 * - CommandResult return types
 */

import type {
  AggregateId,
  AggregateNameCapable,
  CommandId,
  CommandResult,
  CommandStage,
  ErrorInfo,
  FunctionInfo,
  NamedBoundedContext,
  SignalTimeCapable,
  TenantId,
} from '@ahoo-wang/fetcher-wow';
import { CommandStage } from '@ahoo-wang/fetcher-wow';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * User role enumeration
 */
export type UserRole = 'admin' | 'user' | 'moderator';

/**
 * User state interface representing the aggregate state
 */
export interface UserState {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: number;
  updatedAt: number;
  deleted: boolean;
}

/**
 * Base command interface with common properties
 */
interface BaseCommand {
  commandId: string;
  aggregateId: string;
  tenantId: string;
  operator: string;
}

/**
 * CreateUser command - creates a new user aggregate
 */
export interface CreateUserCommand extends BaseCommand {
  commandType: 'CreateUser';
  name: string;
  email: string;
  role: UserRole;
  displayName?: string;
}

/**
 * UpdateUserCommand - updates an existing user aggregate
 */
export interface UpdateUserCommand extends BaseCommand {
  commandType: 'UpdateUser';
  name?: string;
  email?: string;
  role?: UserRole;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
}

/**
 * DeleteUserCommand - soft deletes a user aggregate
 */
export interface DeleteUserCommand extends BaseCommand {
  commandType: 'DeleteUser';
}

/**
 * Union type of all user commands
 */
export type UserCommand = CreateUserCommand | UpdateUserCommand | DeleteUserCommand;

/**
 * WowAggregate type - composes the necessary interfaces for an aggregate
 *
 * This type represents the complete shape of an aggregate in the Wow framework,
 * combining identity, state management, versioning, and audit fields.
 */
export interface WowAggregate<S = any>
  extends AggregateId,
    AggregateNameCapable,
    TenantId,
    WowAggregateVersioning,
    WowAggregateTiming,
    WowAggregateOperators,
    WowAggregateState<S> {}

/**
 * Aggregate versioning capabilities
 */
export interface WowAggregateVersioning {
  version: number;
  aggregateVersion?: number;
}

/**
 * Aggregate timing capabilities
 */
export interface WowAggregateTiming {
  createTime: number;
  eventTime: number;
  firstEventTime: number;
  snapshotTime: number;
}

/**
 * Aggregate operator tracking
 */
export interface WowAggregateOperators {
  operator: string;
  firstOperator: string;
}

/**
 * Aggregate state capability
 */
export interface WowAggregateState<S = any> {
  state: S;
}

// ============================================================================
// User Aggregate Implementation
// ============================================================================

/**
 * UserAggregate - Aggregate root for user entities
 *
 * Handles CreateUser, UpdateUser, and DeleteUser commands
 * and maintains the UserState through command processing.
 */
export class UserAggregate implements WowAggregate<UserState> {
  // AggregateId properties
  tenantId: string;
  contextName: string;
  aggregateName: string;
  aggregateId: string;

  // State
  state: UserState;

  // Versioning
  version: number = 0;
  aggregateVersion?: number;

  // Timing
  createTime: number;
  eventTime: number;
  firstEventTime: number;
  snapshotTime: number;

  // Operators
  operator: string;
  firstOperator: string;

  constructor(params: {
    tenantId: string;
    contextName?: string;
    aggregateName?: string;
    aggregateId?: string;
    operator?: string;
  }) {
    this.tenantId = params.tenantId;
    this.contextName = params.contextName ?? 'user-context';
    this.aggregateName = params.aggregateName ?? 'User';
    this.aggregateId = params.aggregateId ?? crypto.randomUUID();
    this.operator = params.operator ?? 'system';
    this.firstOperator = this.operator;

    const now = Date.now();
    this.createTime = now;
    this.eventTime = now;
    this.firstEventTime = now;
    this.snapshotTime = now;

    // Initialize empty state
    this.state = this.createEmptyState();
  }

  /**
   * Creates an empty initial state
   */
  private createEmptyState(): UserState {
    return {
      id: this.aggregateId,
      name: '',
      email: '',
      role: 'user',
      displayName: undefined,
      bio: undefined,
      avatarUrl: undefined,
      createdAt: this.createTime,
      updatedAt: this.createTime,
      deleted: false,
    };
  }

  /**
   * Handle CreateUserCommand - initializes a new user
   */
  handleCreateUser(command: CreateUserCommand): CommandResult {
    // Validation
    if (!command.name || command.name.length < 2) {
      return this.createErrorResult(command, 'VALIDATION_ERROR', 'Name must be at least 2 characters');
    }
    if (!command.email || !this.isValidEmail(command.email)) {
      return this.createErrorResult(command, 'VALIDATION_ERROR', 'Valid email is required');
    }
    if (!['admin', 'user', 'moderator'].includes(command.role)) {
      return this.createErrorResult(command, 'VALIDATION_ERROR', 'Invalid role');
    }

    // Apply state changes
    this.state = {
      ...this.state,
      id: this.aggregateId,
      name: command.name,
      email: command.email,
      role: command.role,
      displayName: command.displayName,
      createdAt: this.eventTime,
      updatedAt: this.eventTime,
      deleted: false,
    };

    this.operator = command.operator;
    this.version++;
    this.eventTime = Date.now();

    return this.createSuccessResult(command, CommandStage.PROCESSED, {
      id: this.state.id,
      name: this.state.name,
      email: this.state.email,
      role: this.state.role,
    });
  }

  /**
   * Handle UpdateUserCommand - updates existing user state
   */
  handleUpdateUser(command: UpdateUserCommand): CommandResult {
    // Cannot update a deleted user
    if (this.state.deleted) {
      return this.createErrorResult(command, 'INVALID_STATE', 'Cannot update a deleted user');
    }

    // Validate email if provided
    if (command.email && !this.isValidEmail(command.email)) {
      return this.createErrorResult(command, 'VALIDATION_ERROR', 'Invalid email format');
    }

    // Validate name if provided
    if (command.name && command.name.length < 2) {
      return this.createErrorResult(command, 'VALIDATION_ERROR', 'Name must be at least 2 characters');
    }

    // Validate role if provided
    if (command.role && !['admin', 'user', 'moderator'].includes(command.role)) {
      return this.createErrorResult(command, 'VALIDATION_ERROR', 'Invalid role');
    }

    // Apply state changes
    this.state = {
      ...this.state,
      name: command.name ?? this.state.name,
      email: command.email ?? this.state.email,
      role: command.role ?? this.state.role,
      displayName: command.displayName ?? this.state.displayName,
      bio: command.bio ?? this.state.bio,
      avatarUrl: command.avatarUrl ?? this.state.avatarUrl,
      updatedAt: Date.now(),
    };

    this.operator = command.operator;
    this.version++;
    this.eventTime = Date.now();

    return this.createSuccessResult(command, CommandStage.PROCESSED, {
      id: this.state.id,
      name: this.state.name,
      email: this.state.email,
      role: this.state.role,
      updatedAt: this.state.updatedAt,
    });
  }

  /**
   * Handle DeleteUserCommand - soft deletes the user
   */
  handleDeleteUser(command: DeleteUserCommand): CommandResult {
    // Cannot delete an already deleted user
    if (this.state.deleted) {
      return this.createErrorResult(command, 'INVALID_STATE', 'User is already deleted');
    }

    // Apply soft delete
    this.state = {
      ...this.state,
      deleted: true,
      updatedAt: Date.now(),
    };

    this.operator = command.operator;
    this.version++;
    this.eventTime = Date.now();

    return this.createSuccessResult(command, CommandStage.PROCESSED, {
      id: this.state.id,
      deleted: true,
    });
  }

  /**
   * Dispatch command to appropriate handler based on command type
   */
  dispatch(command: UserCommand): CommandResult {
    switch (command.commandType) {
      case 'CreateUser':
        return this.handleCreateUser(command);
      case 'UpdateUser':
        return this.handleUpdateUser(command);
      case 'DeleteUser':
        return this.handleDeleteUser(command);
      default:
        return this.createErrorResult(
          command as CreateUserCommand,
          'UNKNOWN_COMMAND',
          `Unknown command type: ${(command as any).commandType}`
        );
    }
  }

  /**
   * Check if the aggregate is in a valid state for the given command
   */
  canHandle(command: UserCommand): boolean {
    if (this.tenantId !== command.tenantId) {
      return false;
    }
    return true;
  }

  /**
   * Create a success result
   */
  private createSuccessResult(
    command: BaseCommand,
    stage: CommandStage,
    result: Record<string, any>
  ): CommandResult {
    const functionInfo: FunctionInfo = {
      contextName: this.contextName,
      name: command.commandType,
      functionKind: 'COMMAND',
      processorName: 'UserAggregate',
    };

    return {
      id: crypto.randomUUID(),
      waitCommandId: command.commandId,
      commandId: command.commandId,
      requestId: crypto.randomUUID(),
      aggregateId: this.aggregateId,
      tenantId: this.tenantId,
      contextName: this.contextName,
      aggregateName: this.aggregateName,
      stage,
      errorCode: 'Ok',
      errorMsg: '',
      function: functionInfo,
      signalTime: Date.now(),
      aggregateVersion: this.version,
      result,
    };
  }

  /**
   * Create an error result
   */
  private createErrorResult(
    command: BaseCommand,
    errorCode: string,
    errorMsg: string
  ): CommandResult {
    const functionInfo: FunctionInfo = {
      contextName: this.contextName,
      name: command.commandType,
      functionKind: 'COMMAND',
      processorName: 'UserAggregate',
    };

    return {
      id: crypto.randomUUID(),
      waitCommandId: command.commandId,
      commandId: command.commandId,
      requestId: crypto.randomUUID(),
      aggregateId: this.aggregateId,
      tenantId: this.tenantId,
      contextName: this.contextName,
      aggregateName: this.aggregateName,
      stage: CommandStage.SENT,
      errorCode,
      errorMsg,
      function: functionInfo,
      signalTime: Date.now(),
      aggregateVersion: this.version,
      result: {},
    };
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// ============================================================================
// Command Builder
// ============================================================================

/**
 * UserCommandBuilder - Factory for creating typed user commands
 */
export class UserCommandBuilder {
  private tenantId: string;
  private operator: string;

  constructor(tenantId: string, operator: string = 'system') {
    this.tenantId = tenantId;
    this.operator = operator;
  }

  /**
   * Build a CreateUserCommand
   */
  buildCreateUserCommand(params: {
    aggregateId?: string;
    name: string;
    email: string;
    role: UserRole;
    displayName?: string;
  }): CreateUserCommand {
    return {
      commandType: 'CreateUser',
      commandId: crypto.randomUUID(),
      aggregateId: params.aggregateId ?? crypto.randomUUID(),
      tenantId: this.tenantId,
      operator: this.operator,
      name: params.name,
      email: params.email,
      role: params.role,
      displayName: params.displayName,
    };
  }

  /**
   * Build an UpdateUserCommand
   */
  buildUpdateUserCommand(params: {
    aggregateId: string;
    name?: string;
    email?: string;
    role?: UserRole;
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
  }): UpdateUserCommand {
    return {
      commandType: 'UpdateUser',
      commandId: crypto.randomUUID(),
      aggregateId: params.aggregateId,
      tenantId: this.tenantId,
      operator: this.operator,
      name: params.name,
      email: params.email,
      role: params.role,
      displayName: params.displayName,
      bio: params.bio,
      avatarUrl: params.avatarUrl,
    };
  }

  /**
   * Build a DeleteUserCommand
   */
  buildDeleteUserCommand(aggregateId: string): DeleteUserCommand {
    return {
      commandType: 'DeleteUser',
      commandId: crypto.randomUUID(),
      aggregateId,
      tenantId: this.tenantId,
      operator: this.operator,
    };
  }
}

// ============================================================================
// Exports
// ============================================================================

export {
  type UserState,
  type CreateUserCommand,
  type UpdateUserCommand,
  type DeleteUserCommand,
  type UserCommand,
  type WowAggregate,
  UserAggregate,
  UserCommandBuilder,
};
