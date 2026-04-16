/**
 * - key: CartState
 * - schema: 
 * ```json
 * {
 *   "type": "object",
 *   "properties": {
 *     "ownerId": {
 *       "type": "string"
 *     },
 *     "items": {
 *       "type": "array",
 *       "items": {
 *         "$ref": "#/components/schemas/CartItem"
 *       }
 *     },
 *     "total": {
 *       "type": "number"
 *     }
 *   }
 * }
 * ```
 */
export interface CartState {
    ownerId: string;
    items: CartItem[];
    total: number;
}

/**
 * - key: CartItem
 * - schema: 
 * ```json
 * {
 *   "type": "object",
 *   "properties": {
 *     "productId": {
 *       "type": "string"
 *     },
 *     "quantity": {
 *       "type": "integer"
 *     },
 *     "price": {
 *       "type": "number"
 *     }
 *   }
 * }
 * ```
 */
export interface CartItem {
    productId: string;
    quantity: number;
    price: number;
}

/**
 * - key: AddCartItemCommand
 * - schema: 
 * ```json
 * {
 *   "type": "object",
 *   "required": [
 *     "productId",
 *     "quantity"
 *   ],
 *   "properties": {
 *     "productId": {
 *       "type": "string"
 *     },
 *     "quantity": {
 *       "type": "integer"
 *     }
 *   }
 * }
 * ```
 */
export interface AddCartItemCommand {
    productId: string;
    quantity: number;
}

/**
 * - key: CommandResult
 * - schema: 
 * ```json
 * {
 *   "type": "object",
 *   "properties": {
 *     "success": {
 *       "type": "boolean"
 *     },
 *     "aggregateId": {
 *       "type": "string"
 *     }
 *   }
 * }
 * ```
 */
export interface CommandResult {
    success: boolean;
    aggregateId: string;
}
