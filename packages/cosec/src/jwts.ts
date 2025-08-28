/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Interface representing a JWT payload as defined in RFC 7519.
 * Contains standard JWT claims as well as custom properties.
 */
export interface JwtPayload {
  /**
   * Issuer - identifies the principal that issued the JWT.
   */
  iss?: string;
  /**
   * Subject - identifies the principal that is the subject of the JWT.
   */
  sub?: string;
  /**
   * Audience - identifies the recipients that the JWT is intended for.
   * Can be a single string or an array of strings.
   */
  aud?: string | string[];
  /**
   * Expiration Time - identifies the expiration time on or after which the JWT MUST NOT be accepted for processing.
   * Represented as NumericDate (seconds since Unix epoch).
   */
  exp?: number;
  /**
   * Not Before - identifies the time before which the JWT MUST NOT be accepted for processing.
   * Represented as NumericDate (seconds since Unix epoch).
   */
  nbf?: number;
  /**
   * Issued At - identifies the time at which the JWT was issued.
   * Represented as NumericDate (seconds since Unix epoch).
   */
  iat?: number;
  /**
   * JWT ID - provides a unique identifier for the JWT.
   */
  jti?: string;

  /**
   * Allows additional custom properties to be included in the payload.
   */
  [key: string]: any;
}

/**
 * Parses a JWT token and extracts its payload.
 *
 * This function decodes the payload part of a JWT token, handling Base64URL decoding
 * and JSON parsing. It validates the token structure and returns null for invalid tokens.
 *
 * @param token - The JWT token string to parse
 * @returns The parsed JWT payload or null if parsing fails
 */
export function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

    // Add padding if needed
    const paddedBase64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');

    const jsonPayload = decodeURIComponent(
      atob(paddedBase64)
        .split('')
        .map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(''),
    );
    return JSON.parse(jsonPayload) as JwtPayload;
  } catch (error) {
    // Avoid exposing sensitive information in error logs
    console.error('Failed to parse JWT token', error);
    return null;
  }
}

/**
 * Checks if a JWT token is expired based on its expiration time (exp claim).
 *
 * This function determines if a JWT token has expired by comparing its exp claim
 * with the current time. If the token is a string, it will be parsed first.
 * Tokens without an exp claim are considered not expired.
 *
 * @param token - The JWT token to check, either as a string or as a JwtPayload object
 * @returns true if the token is expired or cannot be parsed, false otherwise
 */
export function isTokenExpired(token: string | JwtPayload): boolean {
  const payload = typeof token === 'string' ? parseJwtPayload(token) : token;
  if (!payload) {
    return true;
  }

  const exp = payload.exp;
  if (!exp) {
    return false;
  }

  const now = Date.now() / 1000;
  return now > exp;
}