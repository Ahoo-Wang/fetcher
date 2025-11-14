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

import { describe, it, expect } from 'vitest';
import {
  JsonSerializer,
  IdentitySerializer,
  jsonSerializer,
  identitySerializer,
  typedIdentitySerializer,
} from '../src/serializer';

describe('serializer', () => {
  describe('JsonSerializer', () => {
    it('should serialize object to JSON string', () => {
      const serializer = new JsonSerializer();
      const data = { name: 'test', value: 123 };
      const serialized = serializer.serialize(data);

      expect(serialized).toBe(JSON.stringify(data));
    });

    it('should deserialize JSON string to object', () => {
      const serializer = new JsonSerializer();
      const data = '{"name":"test","value":123}';
      const deserialized = serializer.deserialize(data);

      expect(deserialized).toEqual(JSON.parse(data));
    });

    it('should handle primitive types', () => {
      const serializer = new JsonSerializer();
      const numberData = 42;
      const stringData = 'hello';
      const booleanData = true;

      const serializedNumber = serializer.serialize(numberData);
      const serializedString = serializer.serialize(stringData);
      const serializedBoolean = serializer.serialize(booleanData);

      expect(serializer.deserialize(serializedNumber)).toBe(numberData);
      expect(serializer.deserialize(serializedString)).toBe(stringData);
      expect(serializer.deserialize(serializedBoolean)).toBe(booleanData);
    });

    it('should handle arrays', () => {
      const serializer = new JsonSerializer();
      const data = [1, 2, 3, 'test'];
      const serialized = serializer.serialize(data);
      const deserialized = serializer.deserialize(serialized);

      expect(deserialized).toEqual(data);
    });
  });

  describe('IdentitySerializer', () => {
    it('should pass through values without modification during serialization', () => {
      const serializer = new IdentitySerializer<string>();
      const data = 'test-value';
      const serialized = serializer.serialize(data);

      expect(serialized).toBe(data);
    });

    it('should pass through values without modification during deserialization', () => {
      const serializer = new IdentitySerializer<number>();
      const data = 42;
      const deserialized = serializer.deserialize(data);

      expect(deserialized).toBe(data);
    });

    it('should work with objects', () => {
      const serializer = new IdentitySerializer<object>();
      const data = { name: 'test', value: 123 };
      const serialized = serializer.serialize(data);
      const deserialized = serializer.deserialize(data);

      expect(serialized).toBe(data);
      expect(deserialized).toBe(data);
    });
  });

  describe('jsonSerializer instance', () => {
    it('should be an instance of JsonSerializer', () => {
      expect(jsonSerializer).toBeInstanceOf(JsonSerializer);
    });

    it('should serialize and deserialize correctly', () => {
      const data = { name: 'test', value: 123 };
      const serialized = jsonSerializer.serialize(data);
      const deserialized = jsonSerializer.deserialize(serialized);

      expect(deserialized).toEqual(data);
    });
  });

  describe('identitySerializer instance', () => {
    it('should be an instance of IdentitySerializer', () => {
      expect(identitySerializer).toBeInstanceOf(IdentitySerializer);
    });

    it('should pass through values without modification', () => {
      const data = 'test-value';
      const serialized = identitySerializer.serialize(data);
      const deserialized = identitySerializer.deserialize(data);

      expect(serialized).toBe(data);
      expect(deserialized).toBe(data);
    });
  });

  describe('typedIdentitySerializer function', () => {
    it('should return an IdentitySerializer instance', () => {
      const serializer = typedIdentitySerializer<string>();
      expect(serializer).toBeInstanceOf(IdentitySerializer);
    });

    it('should return the same instance for different type parameters', () => {
      const stringSerializer = typedIdentitySerializer<string>();
      const numberSerializer = typedIdentitySerializer<number>();
      const objectSerializer = typedIdentitySerializer<object>();

      expect(stringSerializer).toBe(numberSerializer);
      expect(numberSerializer).toBe(objectSerializer);
      expect(stringSerializer).toBe(identitySerializer);
    });

    it('should work with different types', () => {
      const stringSerializer = typedIdentitySerializer<string>();
      const numberSerializer = typedIdentitySerializer<number>();
      const objectSerializer = typedIdentitySerializer<object>();

      const strData = 'hello';
      const numData = 42;
      const objData = { key: 'value' };

      expect(stringSerializer.serialize(strData)).toBe(strData);
      expect(stringSerializer.deserialize(strData)).toBe(strData);

      expect(numberSerializer.serialize(numData)).toBe(numData);
      expect(numberSerializer.deserialize(numData)).toBe(numData);

      expect(objectSerializer.serialize(objData)).toBe(objData);
      expect(objectSerializer.deserialize(objData)).toBe(objData);
    });
  });

  describe('JsonSerializer edge cases', () => {
    it('should handle null values', () => {
      const serializer = new JsonSerializer();
      const data = null;
      const serialized = serializer.serialize(data);
      const deserialized = serializer.deserialize(serialized);

      expect(deserialized).toBeNull();
    });

    it('should handle undefined values', () => {
      const serializer = new JsonSerializer();
      const data = undefined;
      const serialized = serializer.serialize(data);

      // JSON.stringify(undefined) returns undefined, not a string
      expect(serialized).toBeUndefined();
      // Since serialize returns undefined, we can't deserialize it
      // This is expected behavior for JSON serialization
    });

    it('should handle special number values', () => {
      const serializer = new JsonSerializer();

      // JSON.stringify converts special numbers to null
      expect(serializer.deserialize(serializer.serialize(NaN))).toBeNull();
      expect(serializer.deserialize(serializer.serialize(Infinity))).toBeNull();
      expect(
        serializer.deserialize(serializer.serialize(-Infinity)),
      ).toBeNull();
    });

    it('should handle Date objects', () => {
      const serializer = new JsonSerializer();
      const date = new Date('2023-01-01T00:00:00.000Z');
      const serialized = serializer.serialize(date);
      const deserialized = serializer.deserialize(serialized);

      expect(deserialized).toBe(date.toISOString());
    });

    it('should handle nested objects', () => {
      const serializer = new JsonSerializer();
      const data = {
        user: {
          name: 'John',
          age: 30,
          settings: {
            theme: 'dark',
            notifications: true,
          },
        },
        items: [1, 2, { nested: 'value' }],
      };

      const serialized = serializer.serialize(data);
      const deserialized = serializer.deserialize(serialized);

      expect(deserialized).toEqual(data);
    });

    it('should handle empty objects and arrays', () => {
      const serializer = new JsonSerializer();

      const emptyObj = {};
      const emptyArr: any[] = [];

      expect(serializer.deserialize(serializer.serialize(emptyObj))).toEqual(
        emptyObj,
      );
      expect(serializer.deserialize(serializer.serialize(emptyArr))).toEqual(
        emptyArr,
      );
    });

    it('should throw error for circular references', () => {
      const serializer = new JsonSerializer();
      const circular: any = { self: null };
      circular.self = circular;

      expect(() => serializer.serialize(circular)).toThrow();
    });

    it('should throw error for invalid JSON during deserialization', () => {
      const serializer = new JsonSerializer();
      const invalidJson = '{"invalid": json}';

      expect(() => serializer.deserialize(invalidJson)).toThrow();
    });
  });

  describe('IdentitySerializer edge cases', () => {
    it('should handle null values', () => {
      const serializer = new IdentitySerializer<null>();
      const data = null;

      expect(serializer.serialize(data)).toBeNull();
      expect(serializer.deserialize(data)).toBeNull();
    });

    it('should handle undefined values', () => {
      const serializer = new IdentitySerializer<undefined>();
      const data = undefined;

      expect(serializer.serialize(data)).toBeUndefined();
      expect(serializer.deserialize(data)).toBeUndefined();
    });

    it('should handle complex types', () => {
      interface ComplexType {
        id: number;
        data: string[];
        metadata: { created: Date; tags: string[] };
      }

      const serializer = new IdentitySerializer<ComplexType>();
      const data: ComplexType = {
        id: 1,
        data: ['a', 'b', 'c'],
        metadata: {
          created: new Date(),
          tags: ['tag1', 'tag2'],
        },
      };

      expect(serializer.serialize(data)).toBe(data);
      expect(serializer.deserialize(data)).toBe(data);
    });

    it('should handle function references', () => {
      const serializer = new IdentitySerializer<() => string>();
      const func = () => 'test';

      expect(serializer.serialize(func)).toBe(func);
      expect(serializer.deserialize(func)).toBe(func);
      expect(serializer.deserialize(func)()).toBe('test');
    });

    it('should handle symbol values', () => {
      const serializer = new IdentitySerializer<symbol>();
      const sym = Symbol('test');

      expect(serializer.serialize(sym)).toBe(sym);
      expect(serializer.deserialize(sym)).toBe(sym);
    });

    it('should handle Map and Set instances', () => {
      const mapSerializer = new IdentitySerializer<Map<string, number>>();
      const setSerializer = new IdentitySerializer<Set<number>>();

      const map = new Map([
        ['a', 1],
        ['b', 2],
      ]);
      const set = new Set([1, 2, 3]);

      expect(mapSerializer.serialize(map)).toBe(map);
      expect(mapSerializer.deserialize(map)).toBe(map);

      expect(setSerializer.serialize(set)).toBe(set);
      expect(setSerializer.deserialize(set)).toBe(set);
    });
  });

  describe('global instances', () => {
    it('should export working global instances', () => {
      // Test jsonSerializer
      const data = { test: 'value' };
      const serialized = jsonSerializer.serialize(data);
      const deserialized = jsonSerializer.deserialize(serialized);
      expect(deserialized).toEqual(data);

      // Test identitySerializer
      const identityData = 'test';
      expect(identitySerializer.serialize(identityData)).toBe(identityData);
      expect(identitySerializer.deserialize(identityData)).toBe(identityData);
    });

    it('should maintain singleton behavior', () => {
      expect(jsonSerializer).toBeInstanceOf(JsonSerializer);
      expect(identitySerializer).toBeInstanceOf(IdentitySerializer);

      // typedIdentitySerializer should return the same instance
      expect(typedIdentitySerializer()).toBe(identitySerializer);
    });
  });
});
