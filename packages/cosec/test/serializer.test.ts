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
import { JsonSerializer, IdentitySerializer, jsonSerializer, identitySerializer } from '../src/serializer';

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
});