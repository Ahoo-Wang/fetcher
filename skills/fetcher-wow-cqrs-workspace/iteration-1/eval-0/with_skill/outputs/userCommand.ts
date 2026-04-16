/*
 * WowCommand for User Management
 * Creates a new user with name and email
 */

import { Fetcher } from '@ahoo-wang/fetcher';
import {
  CommandClient,
  CommandRequest,
  CommandResult,
  HttpMethod,
  CommandHttpHeaders,
  CommandStage,
} from '@ahoo-wang/fetcher-wow';

/**
 * Command body for creating a new user
 */
export interface CreateUser {
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
 * Command endpoints for user management
 */
export const UserCommandEndpoints = {
  /**
   * Endpoint for creating a new user
   */
  createUser: 'create_user',
} as const;

/**
 * Type alias for CreateUser command request
 */
export type CreateUserCommand = CommandRequest<CreateUser>;

/**
 * Factory function to create a CreateUserCommand
 */
export function createUserCommand(
  name: string,
  email: string,
  options?: {
    ownerId?: string;
    aggregateId?: string;
    aggregateVersion?: number;
    waitStage?: CommandStage;
  },
): CreateUserCommand {
  const headers: Record<string, string> = {
    [CommandHttpHeaders.WAIT_STAGE]: options?.waitStage ?? CommandStage.PROCESSED,
  };

  if (options?.ownerId) {
    headers[CommandHttpHeaders.OWNER_ID] = options.ownerId;
  }

  if (options?.aggregateId) {
    headers[CommandHttpHeaders.AGGREGATE_ID] = options.aggregateId;
  }

  if (options?.aggregateVersion !== undefined) {
    headers[CommandHttpHeaders.AGGREGATE_VERSION] = String(options.aggregateVersion);
  }

  return {
    path: UserCommandEndpoints.createUser,
    method: HttpMethod.POST,
    headers,
    body: {
      name,
      email,
    },
  };
}

/**
 * User Command Client
 *
 * Sends commands to modify user aggregate state.
 *
 * @example
 * ```typescript
 * import { Fetcher } from '@ahoo-wang/fetcher';
 * import { UserCommandClient, createUserCommand } from './userCommand';
 *
 * const fetcher = new Fetcher({ baseURL: 'http://localhost:8080/' });
 * const userCommandClient = new UserCommandClient({
 *   fetcher,
 *   basePath: 'owner/{ownerId}/user',
 * });
 *
 * // Create a new user
 * const command = createUserCommand('John Doe', 'john@example.com');
 * const result = await userCommandClient.send(command);
 * console.log('User created:', result.aggregateId);
 * ```
 */
export class UserCommandClient extends CommandClient<CreateUser> {
  constructor(options?: { fetcher: Fetcher; basePath?: string }) {
    super(options ? { fetcher: options.fetcher, basePath: options.basePath } : undefined);
  }

  /**
   * Send a create user command
   *
   * @param command - The create user command request
   * @param attributes - Optional shared attributes for interceptors
   * @returns Promise resolving to command result
   */
  async createUser(
    command: CreateUserCommand,
    attributes?: Record<string, any>,
  ): Promise<CommandResult> {
    return this.send(command, attributes);
  }
}
