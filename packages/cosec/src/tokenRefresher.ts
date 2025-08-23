/**
 * Access token interface
 */
export interface AccessToken {
    accessToken: string;
}

/**
 * Refresh token interface
 */
export interface RefreshToken {
    refreshToken: string;
}

/**
 * Composite token interface that contains both access and refresh tokens
 * accessToken and refreshToken always appear in pairs, no need to split them
 */
export interface CompositeToken extends AccessToken, RefreshToken {
}

/**
 * Token refresher interface
 * Provides a method to refresh tokens
 */
export interface TokenRefresher {
    /**
     * Refresh the given token and return a new CompositeToken
     * @param token The token to refresh
     * @returns A Promise that resolves to a new CompositeToken
     */
    refresh(token: CompositeToken): Promise<CompositeToken>;
}