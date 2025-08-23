import {getStorage} from "./inMemoryStorage";
import {CompositeToken} from "./tokenRefresher";

const defaultCoSecTokenKey = 'cosec-token';

/**
 * Token storage class for managing access and refresh tokens
 */
export class TokenStorage {
    private readonly tokenKey: string;
    private storage: Storage;

    constructor(
        tokenKey: string = defaultCoSecTokenKey,
        storage: Storage = getStorage(),
    ) {
        this.tokenKey = tokenKey;
        this.storage = storage;
    }

    /**
     * Get the current access token
     */
    get(): CompositeToken | null {
        const tokenStr = this.storage.getItem(this.tokenKey);
        return tokenStr ? JSON.parse(tokenStr) : null;
    }

    /**
     * Store a composite token
     */
    set(token: CompositeToken): void {
        const tokenStr = JSON.stringify(token);
        this.storage.setItem(this.tokenKey, tokenStr);
    }

    /**
     * Clear all tokens
     */
    clear(): void {
        this.storage.removeItem(this.tokenKey);
    }

}
