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
 * Interface for serializing and deserializing values
 * @template Serialized The type of the serialized value
 */
/**
 * Interface for serializing and deserializing values
 * @template Serialized The type of the serialized value
 * @template Deserialized The type of the deserialized value
 */
export interface Serializer<Serialized, Deserialized> {
  /**
   * Serializes a value to the specified format
   * @param value The value to serialize
   * @returns The serialized value
   */
  serialize(value: any): Serialized;

  /**
   * Deserializes a value from the specified format
   * @template Deserialized The type of the deserialized value
   * @param value The value to deserialize
   * @returns The deserialized value
   */
  /**
   * Deserializes a value from the specified format
   * @param value The value to deserialize
   * @returns The deserialized value
   */
  deserialize(value: Serialized): Deserialized;
}

/**
 * Implementation of Serializer that uses JSON for serialization
 */
export class JsonSerializer implements Serializer<string, any> {
  /**
   * Serializes a value to a JSON string
   * @param value The value to serialize
   * @returns The JSON string representation of the value
   */
  /**
   * Serializes a value to a JSON string
   * @param value The value to serialize
   * @returns The JSON string representation of the value
   */
  serialize(value: any): string {
    return JSON.stringify(value);
  }

  /**
   * Deserializes a JSON string to a value
   * @template V The type of the deserialized value
   * @param value The JSON string to deserialize
   * @returns The deserialized value
   */
  /**
   * Deserializes a JSON string to a value
   * @param value The JSON string to deserialize
   * @returns The deserialized value
   */
  deserialize<V>(value: string): V {
    return JSON.parse(value);
  }
}

/**
 * Implementation of Serializer that performs no actual serialization
 * @template T The type of the value to pass through
 */
export class IdentitySerializer<T> implements Serializer<T, T> {
  /**
   * Returns the value as-is without serialization
   * @param value The value to pass through
   * @returns The same value that was passed in
   */
  /**
   * Returns the value as-is without serialization
   * @param value The value to pass through
   * @returns The same value that was passed in
   */
  serialize(value: T): T {
    return value;
  }

  /**
   * Returns the value as-is without deserialization
   * @template Deserialized The type of the deserialized value
   * @param value The value to pass through
   * @returns The same value that was passed in, cast to the target type
   */
  /**
   * Returns the value as-is without deserialization
   * @param value The value to pass through
   * @returns The same value that was passed in
   */
  deserialize(value: T): T {
    return value;
  }
}

/**
 * Global instance of JsonSerializer
 */
export const jsonSerializer = new JsonSerializer();
/**
 * Global instance of IdentitySerializer
 */
export const identitySerializer = new IdentitySerializer<any>();

export function typedIdentitySerializer<T>(): IdentitySerializer<T> {
  return identitySerializer as IdentitySerializer<T>;
}