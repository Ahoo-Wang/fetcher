/**
 * - key: UserState
 * - schema: 
 * ```json
 * {
 *   "type": "object",
 *   "properties": {
 *     "id": {
 *       "type": "string"
 *     },
 *     "tenantId": {
 *       "type": "string"
 *     },
 *     "email": {
 *       "type": "string"
 *     },
 *     "name": {
 *       "type": "string"
 *     },
 *     "status": {
 *       "type": "string",
 *       "enum": [
 *         "active",
 *         "inactive",
 *         "suspended"
 *       ]
 *     }
 *   }
 * }
 * ```
 */
export interface UserState {
    id: string;
    tenantId: string;
    email: string;
    name: string;
    status: `active` | `inactive` | `suspended`;
}

/**
 * - key: CreateUserCommand
 * - schema: 
 * ```json
 * {
 *   "type": "object",
 *   "required": [
 *     "email",
 *     "name"
 *   ],
 *   "properties": {
 *     "email": {
 *       "type": "string"
 *     },
 *     "name": {
 *       "type": "string"
 *     }
 *   }
 * }
 * ```
 */
export interface CreateUserCommand {
    email: string;
    name: string;
}

/**
 * - key: UpdateUserCommand
 * - schema: 
 * ```json
 * {
 *   "type": "object",
 *   "properties": {
 *     "email": {
 *       "type": "string"
 *     },
 *     "name": {
 *       "type": "string"
 *     },
 *     "status": {
 *       "type": "string"
 *     }
 *   }
 * }
 * ```
 */
export interface UpdateUserCommand {
    email: string;
    name: string;
    status: string;
}
