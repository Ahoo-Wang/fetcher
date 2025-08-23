import {DeviceIdStorage} from "./deviceIdStorage";
import {TokenStorage} from "./tokenStorage";
import {TokenRefresher} from "./tokenRefresher";

/**
 * CoSec HTTP headers enumeration
 */
export enum CoSecHeaders {
    DEVICE_ID = 'CoSec-Device-Id',
    APP_ID = 'CoSec-App-Id',
    AUTHORIZATION = 'Authorization',
    REQUEST_ID = 'CoSec-Request-Id',
}

export enum ResponseCodes {
    UNAUTHORIZED = 401,
}

/**
 * CoSec options interface
 */
export interface CoSecOptions {
    /**
     * Application ID to be sent in the CoSec-App-Id header
     */
    appId: string;

    /**
     * Device ID storage instance
     */
    deviceIdStorage: DeviceIdStorage;

    /**
     * Token storage instance
     */
    tokenStorage: TokenStorage;

    /**
     * Token refresher function
     * Takes a CompositeToken and returns a Promise that resolves to a new CompositeToken
     */
    tokenRefresher: TokenRefresher;
}

/**
 * Authorization result interface
 */
export interface AuthorizeResult {
    authorized: boolean;
    reason: string;
}

/**
 * Authorization result implementation
 */
export class AuthorizeResultData implements AuthorizeResult {
    constructor(
        public readonly authorized: boolean,
        public readonly reason: string,
    ) {
    }
}

/**
 * Authorization result constants
 */
export const AuthorizeResults = {
    ALLOW: new AuthorizeResultData(true, 'Allow'),
    EXPLICIT_DENY: new AuthorizeResultData(false, 'Explicit Deny'),
    IMPLICIT_DENY: new AuthorizeResultData(false, 'Implicit Deny'),
    TOKEN_EXPIRED: new AuthorizeResultData(false, 'Token Expired'),
    TOO_MANY_REQUESTS: new AuthorizeResultData(false, 'Too Many Requests'),

    allow(reason: string): AuthorizeResult {
        return new AuthorizeResultData(true, reason);
    },

    deny(reason: string): AuthorizeResult {
        return new AuthorizeResultData(false, reason);
    },
};


