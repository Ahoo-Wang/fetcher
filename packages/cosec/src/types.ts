import { DeviceIdStorage } from './deviceIdStorage';
import { TokenStorage } from './tokenStorage';
import { TokenRefresher } from './tokenRefresher';

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
 * Authorization result constants
 */
export const AuthorizeResults = {
  ALLOW: { authorized: true, reason: 'Allow' },
  EXPLICIT_DENY: { authorized: false, reason: 'Explicit Deny' },
  IMPLICIT_DENY: { authorized: false, reason: 'Implicit Deny' },
  TOKEN_EXPIRED: { authorized: false, reason: 'Token Expired' },
  TOO_MANY_REQUESTS: { authorized: false, reason: 'Too Many Requests' },
};
