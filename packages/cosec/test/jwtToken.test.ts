import { describe, it, expect } from 'vitest';
import { JwtToken, JwtCompositeToken, jwtCompositeTokenSerializer } from '../src';
import { CoSecJwtPayload, JwtPayload } from '../src';

// Example JWT tokens for testing
// Payload: {"sub":"1234567890","name":"John Doe","iat":1516239022}
const VALID_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
// Expired token with exp: 1516239022 (Saturday, January 27, 2018 1:30:22 PM GMT)
const EXPIRED_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4AdcjLYL060o32whA5hXbhqz1PLHes74IvyN8hIgFyM';
// Payload: {"sub":"9876543210","name":"Jane Smith","iat":1516239022}
const REFRESH_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ODc2NTQzMjEwIiwibmFtZSI6IkphbmUgU21pdGgiLCJpYXQiOjE1MTYyMzkwMjJ9.s3hOJN5F3zU8j39Jl2uomXRwGNfYLaqLv0J77hUQ0ko';

describe('jwtToken', () => {
  describe('JwtToken', () => {
    it('should create a JwtToken with valid token', () => {
      const jwtToken = new JwtToken<JwtPayload>(VALID_JWT);
      expect(jwtToken.token).toBe(VALID_JWT);
      expect(jwtToken.payload).toBeDefined();
      expect(jwtToken.payload.sub).toBe('1234567890');
      expect(jwtToken.payload.name).toBe('John Doe');
    });

    it('should correctly identify expired tokens', () => {
      const expiredToken = new JwtToken<JwtPayload>(EXPIRED_JWT);
      expect(expiredToken.isExpired()).toBe(true);

      const validToken = new JwtToken<JwtPayload>(VALID_JWT);
      expect(validToken.isExpired()).toBe(false);
    });
  });

  describe('JwtCompositeToken', () => {
    it('should create a composite token with access and refresh tokens', () => {
      const accessToken = new JwtToken<CoSecJwtPayload>(VALID_JWT);
      const refreshToken = new JwtToken<JwtPayload>(REFRESH_JWT);
      const compositeToken = new JwtCompositeToken(accessToken, refreshToken);

      expect(compositeToken.access).toBe(accessToken);
      expect(compositeToken.refresh).toBe(refreshToken);
    });
  });

  describe('jwtCompositeTokenSerializer', () => {
    it('should serialize a composite token to JSON string', () => {
      const accessToken = new JwtToken<CoSecJwtPayload>(VALID_JWT);
      const refreshToken = new JwtToken<JwtPayload>(REFRESH_JWT);
      const compositeToken = new JwtCompositeToken(accessToken, refreshToken);

      const serialized = jwtCompositeTokenSerializer.serialize(compositeToken);
      const parsed = JSON.parse(serialized);

      expect(parsed.accessToken).toBe(VALID_JWT);
      expect(parsed.refreshToken).toBe(REFRESH_JWT);
    });

    it('should deserialize a JSON string to composite token', () => {
      const jsonString = JSON.stringify({
        accessToken: VALID_JWT,
        refreshToken: REFRESH_JWT,
      });

      const compositeToken = jwtCompositeTokenSerializer.deserialize(jsonString);

      expect(compositeToken.access.token).toBe(VALID_JWT);
      expect(compositeToken.refresh.token).toBe(REFRESH_JWT);
      expect(compositeToken.access.payload.sub).toBe('1234567890');
      expect(compositeToken.refresh.payload.sub).toBe('9876543210');
    });
  });
});