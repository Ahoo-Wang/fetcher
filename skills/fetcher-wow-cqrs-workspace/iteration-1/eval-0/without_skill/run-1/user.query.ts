/**
 * WowQuery for User Management
 *
 * This module defines the GetUserById query using the @ahoo-wang/fetcher-wow package.
 */

import {
  LoadStateAggregateClient,
  SnapshotQueryClient,
} from '@ahoo-wang/fetcher-wow';
import type { ApiMetadata } from '@ahoo-wang/fetcher-decorator';

/**
 * User aggregate state interface
 */
export interface UserState {
  /**
   * User's unique identifier
   */
  id: string;
  /**
   * User's full name
   */
  name: string;
  /**
   * User's email address
   */
  email: string;
  /**
   * User creation timestamp
   */
  createdAt: number;
  /**
   * User last update timestamp
   */
  updatedAt: number;
}

/**
 * UserQuery endpoint paths
 */
const UserQueryEndpointPaths = {
  /**
   * Query endpoint path for loading user state by ID
   */
  LOAD_STATE: '{id}/state',
} as const;

/**
 * WowQuery client for fetching User aggregates by ID
 *
 * This class provides query operations for the User aggregate using the Wow CQRS pattern.
 *
 * @example
 * ```typescript
 * // Using LoadStateAggregateClient
 * const userQuery = new UserQuery({
 *   fetcher: 'wow',
 *   basePath: 'owner/{ownerId}/user'
 * });
 *
 * // Fetch user by ID
 * const user = await userQuery.getUserById('user-123');
 * console.log('User:', user);
 *
 * // Fetch user at specific version
 * const userAtVersion = await userQuery.getUserVersion('user-123', 5);
 * ```
 */
export class UserQuery extends LoadStateAggregateClient<UserState> {
  /**
   * Get user by ID
   *
   * @param id - User's unique identifier
   * @param attributes - Optional shared attributes for interceptors
   * @param abortController - Optional AbortController for cancellation
   * @returns Promise resolving to the user state
   */
  async getUserById(
    id: string,
    attributes?: Record<string, any>,
    abortController?: AbortController,
  ): Promise<UserState> {
    return this.load(id, attributes, abortController);
  }

  /**
   * Get user at a specific version (optimistic concurrency)
   *
   * @param id - User's unique identifier
   * @param version - Specific version to fetch
   * @param attributes - Optional shared attributes for interceptors
   * @param abortController - Optional AbortController for cancellation
   * @returns Promise resolving to the user state at specified version
   */
  async getUserVersion(
    id: string,
    version: number,
    attributes?: Record<string, any>,
    abortController?: AbortController,
  ): Promise<UserState> {
    return this.loadVersioned(id, version, attributes, abortController);
  }

  /**
   * Get user state at a specific point in time (time-travel query)
   *
   * @param id - User's unique identifier
   * @param createTime - Timestamp to query the state at
   * @param attributes - Optional shared attributes for interceptors
   * @param abortController - Optional AbortController for cancellation
   * @returns Promise resolving to the user state at the specified time
   */
  async getUserAtTime(
    id: string,
    createTime: number,
    attributes?: Record<string, any>,
    abortController?: AbortController,
  ): Promise<UserState> {
    return this.loadTimeBased(id, createTime, attributes, abortController);
  }
}

/**
 * Alternative WowQuery using SnapshotQueryClient for more complex queries
 *
 * @example
 * ```typescript
 * // Using SnapshotQueryClient for richer query capabilities
 * const userSnapshotQuery = new UserSnapshotQuery({
 *   fetcher: 'wow',
 *   basePath: 'owner/{ownerId}/user'
 * });
 *
 * // Get user state by ID via snapshot query
 * const user = await userSnapshotQuery.getStateById('user-123');
 * console.log('User from snapshot:', user);
 * ```
 */
export class UserSnapshotQuery extends SnapshotQueryClient<UserState> {
  /**
   * Get user state by ID using snapshot query
   *
   * @param id - User's unique identifier
   * @param attributes - Optional shared attributes for interceptors
   * @param abortController - Optional AbortController for cancellation
   * @returns Promise resolving to the user state
   */
  async getStateById(
    id: string,
    attributes?: Record<string, any>,
    abortController?: AbortController,
  ): Promise<UserState> {
    return this.getStateById(id, attributes, abortController);
  }
}

/**
 * Factory function to create a UserQuery client instance
 *
 * @param options - API metadata options
 * @returns A new UserQuery instance
 *
 * @example
 * ```typescript
 * const userQuery = createUserQuery({
 *   fetcher: 'wow',
 *   basePath: 'owner/{ownerId}/user'
 * });
 *
 * const user = await userQuery.getUserById('user-123');
 * ```
 */
export function createUserQuery(options: ApiMetadata): UserQuery {
  return new UserQuery(options);
}

/**
 * Factory function to create a UserSnapshotQuery client instance
 *
 * @param options - API metadata options
 * @returns A new UserSnapshotQuery instance
 *
 * @example
 * ```typescript
 * const userSnapshotQuery = createUserSnapshotQuery({
 *   fetcher: 'wow',
 *   basePath: 'owner/{ownerId}/user'
 * });
 *
 * const user = await userSnapshotQuery.getStateById('user-123');
 * ```
 */
export function createUserSnapshotQuery(
  options: ApiMetadata,
): UserSnapshotQuery {
  return new UserSnapshotQuery(options);
}
