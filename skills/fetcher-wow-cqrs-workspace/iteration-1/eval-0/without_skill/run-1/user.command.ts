/**
 * WowCommand for User Management
 *
 * This module defines the CreateUser command using the @ahoo-wang/fetcher-wow package.
 */

import { CommandClient, CommandRequest, CommandResult } from '@ahoo-wang/fetcher-wow';
import { HttpMethod } from '@ahoo-wang/fetcher';

/**
 * Command body for creating a new user
 */
export interface CreateUserCommandBody {
  /**
   * User's full name
   */
  name: string;
  /**
   * User's email address
   */
  email: string;
}

/**
 * CreateUser command endpoint paths
 */
const CreateUserEndpointPaths = {
  /**
   * Command endpoint for creating a user
   */
  CREATE_USER: 'user/commands/create',
} as const;

/**
 * WowCommand client for User management operations
 *
 * This class provides command operations for the User aggregate using the Wow CQRS pattern.
 *
 * @example
 * ```typescript
 * // Create a command client for user management
 * const userCommandClient = new UserCommand({
 *   fetcher: 'wow',
 *   basePath: 'owner/{ownerId}/user'
 * });
 *
 * // Create a new user
 * const createUserRequest: CommandRequest<CreateUserCommandBody> = {
 *   method: HttpMethod.POST,
 *   body: {
 *     name: 'John Doe',
 *     email: 'john@example.com'
 *   }
 * };
 *
 * const result = await userCommandClient.createUser(createUserRequest);
 * console.log('User created:', result);
 * ```
 */
export class UserCommand extends CommandClient<CreateUserCommandBody> {
  /**
   * Creates a new user
   *
   * @param commandRequest - The command request containing user creation data
   * @param attributes - Optional shared attributes for interceptors
   * @returns Promise resolving to the command result
   */
  async createUser(
    commandRequest: CommandRequest<CreateUserCommandBody>,
    attributes?: Record<string, any>,
  ): Promise<CommandResult> {
    return this.send(
      {
        ...commandRequest,
        method: HttpMethod.POST,
      },
      attributes,
    );
  }
}

/**
 * Factory function to create a UserCommand client instance
 *
 * @param basePath - Base path for the API endpoints
 * @param fetcherName - Optional fetcher name to use
 * @returns A new UserCommand instance
 *
 * @example
 * ```typescript
 * const userCommand = createUserCommand(
 *   'owner/{ownerId}/user',
 *   'wow'
 * );
 *
 * const result = await userCommand.createUser({
 *   method: HttpMethod.POST,
 *   body: {
 *     name: 'John Doe',
 *     email: 'john@example.com'
 *   }
 * });
 * ```
 */
export function createUserCommand(
  basePath: string,
  fetcherName?: string,
): UserCommand {
  return new UserCommand({
    basePath,
    fetcher: fetcherName,
  });
}
