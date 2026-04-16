/*
 * WowQuery for User Management
 * Fetches user by ID
 */

import { Fetcher } from '@ahoo-wang/fetcher';
import {
  SnapshotQueryClient,
  QueryClientFactory,
  ResourceAttributionPathSpec,
} from '@ahoo-wang/fetcher-wow';
import { aggregateId } from '@ahoo-wang/fetcher-wow';
import { singleQuery, type SingleQuery } from '@ahoo-wang/fetcher-wow';

/**
 * User state interface representing the aggregate state
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
   * Timestamp when the user was created
   */
  createdAt: number;
  /**
   * Timestamp when the user was last updated
   */
  updatedAt: number;
}

/**
 * User fields for query projection
 */
export const UserFields = {
  ID: 'id',
  NAME: 'name',
  EMAIL: 'email',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
} as const;

export type UserField = (typeof UserFields)[keyof typeof UserFields];

/**
 * User Query Client
 *
 * Queries user aggregate snapshots.
 *
 * @example
 * ```typescript
 * import { Fetcher } from '@ahoo-wang/fetcher';
 * import { UserQueryClient, aggregateId } from './userQuery';
 *
 * const fetcher = new Fetcher({ baseURL: 'http://localhost:8080/' });
 * const userQueryClient = new UserQueryClient({
 *   fetcher,
 *   basePath: 'owner/{ownerId}/user',
 * });
 *
 * // Get user by ID
 * const user = await userQueryClient.getStateById('user-123');
 * console.log('User:', user.name, user.email);
 * ```
 */
export class UserQueryClient extends SnapshotQueryClient<UserState> {
  constructor(options?: { fetcher: Fetcher; basePath?: string }) {
    super(options ? { fetcher: options.fetcher, basePath: options.basePath } : undefined);
  }

  /**
   * Get user by ID
   *
   * @param id - The user's unique identifier
   * @param attributes - Optional shared attributes for interceptors
   * @returns Promise resolving to user state
   */
  async getById(
    id: string,
    attributes?: Record<string, any>,
  ): Promise<UserState> {
    return super.getStateById(id, attributes);
  }
}

/**
 * Factory for creating user query clients with shared configuration
 *
 * @example
 * ```typescript
 * import { Fetcher } from '@ahoo-wang/fetcher';
 * import { UserQueryClientFactory } from './userQuery';
 *
 * const fetcher = new Fetcher({ baseURL: 'http://localhost:8080/' });
 * const factory = new UserQueryClientFactory({
 *   fetcher,
 *   contextAlias: 'example',
 *   aggregateName: 'user',
 *   resourceAttribution: ResourceAttributionPathSpec.OWNER,
 * });
 *
 * const userQueryClient = factory.createSnapshotQueryClient();
 * const user = await userQueryClient.getStateById('user-123');
 * ```
 */
export class UserQueryClientFactory extends QueryClientFactory<UserState> {
  constructor(options: {
    fetcher: Fetcher;
    contextAlias?: string;
    aggregateName?: string;
    resourceAttribution?: ResourceAttributionPathSpec;
  }) {
    super({
      fetcher: options.fetcher,
      contextAlias: options.contextAlias,
      aggregateName: options.aggregateName ?? 'user',
      resourceAttribution: options.resourceAttribution,
    });
  }
}

/**
 * Query options for fetching user by ID
 */
export interface GetUserByIdQuery {
  /**
   * The user's unique identifier
   */
  id: string;
  /**
   * Optional fields to include in the response
   */
  fields?: UserField[];
}

/**
 * Create a single query for fetching user by ID
 *
 * @param options - Query options
 * @returns SingleQuery for fetching user
 *
 * @example
 * ```typescript
 * import { UserQueryClient, getUserByIdQuery } from './userQuery';
 *
 * const query = getUserByIdQuery({ id: 'user-123', fields: ['name', 'email'] });
 * const user = await userQueryClient.singleState(query);
 * ```
 */
export function getUserByIdQuery(options: GetUserByIdQuery): SingleQuery<UserField> {
  return singleQuery<UserField>({
    condition: aggregateId(options.id),
    fields: options.fields as UserField[],
  });
}
