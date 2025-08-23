import {nanoid} from 'nanoid';

export interface IdGenerator {
    generateId(): string;
}

/**
 * Nano ID implementation of IdGenerator
 * Generates unique request IDs using Nano ID
 */
export class NanoIdGenerator implements IdGenerator {
    /**
     * Generate a unique request ID
     */
    generateId(): string {
        return nanoid();
    }
}

export const idGenerator = new NanoIdGenerator();