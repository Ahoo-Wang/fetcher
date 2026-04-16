/**
 * - key: Pet
 * - schema: 
 * ```json
 * {
 *   "type": "object",
 *   "properties": {
 *     "id": {
 *       "type": "string"
 *     },
 *     "name": {
 *       "type": "string"
 *     },
 *     "species": {
 *       "type": "string"
 *     },
 *     "age": {
 *       "type": "integer"
 *     }
 *   }
 * }
 * ```
 */
export interface Pet {
    id: string;
    name: string;
    species: string;
    age: number;
}

/**
 * - key: PetInput
 * - schema: 
 * ```json
 * {
 *   "type": "object",
 *   "required": [
 *     "name",
 *     "species"
 *   ],
 *   "properties": {
 *     "name": {
 *       "type": "string"
 *     },
 *     "species": {
 *       "type": "string"
 *     },
 *     "age": {
 *       "type": "integer"
 *     }
 *   }
 * }
 * ```
 */
export interface PetInput {
    name: string;
    species: string;
    age: number;
}
