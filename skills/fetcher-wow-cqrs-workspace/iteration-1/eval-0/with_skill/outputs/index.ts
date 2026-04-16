/*
 * User Management - WowCommand & WowQuery
 *
 * This module provides command and query clients for user management
 * using the Wow CQRS/DDD framework.
 */

// Command exports
export {
  UserCommandClient,
  UserCommandEndpoints,
  createUserCommand,
  type CreateUser,
  type CreateUserCommand,
} from './userCommand';

// Query exports
export {
  UserQueryClient,
  UserQueryClientFactory,
  UserFields,
  getUserByIdQuery,
  type UserState,
  type UserField,
  type GetUserByIdQuery,
} from './userQuery';
