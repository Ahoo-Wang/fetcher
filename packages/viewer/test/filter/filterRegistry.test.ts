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
import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  FilterRegistry,
  filterRegistry,
} from '../../src';
import { FilterComponent } from '../../src';

describe('FilterRegistry', () => {
  let registry: FilterRegistry;
  let mockFilter: FilterComponent;

  beforeEach(() => {
    registry = new FilterRegistry();
    mockFilter = vi.fn() as FilterComponent;
  });

  describe('register', () => {
    it('should register a filter successfully', () => {
      registry.register('test-type', mockFilter);
      expect(registry.types.has('test-type')).toBe(true);
      const retrieved = registry.get('test-type');
      expect(retrieved).toBe(mockFilter);
    });

    it('should allow registering multiple filters', () => {
      const mockFilter2 = vi.fn() as FilterComponent;

      registry.register('type1', mockFilter);
      registry.register('type2', mockFilter2);

      expect(registry.get('type1')).toBe(mockFilter);
      expect(registry.get('type2')).toBe(mockFilter2);
    });

    it('should allow overwriting existing filter', () => {
      const mockFilter2 = vi.fn() as FilterComponent;

      registry.register('test-type', mockFilter);
      registry.register('test-type', mockFilter2);

      expect(registry.get('test-type')).toBe(mockFilter2);
    });
  });

  describe('unregister', () => {
    it('should unregister a filter successfully', () => {
      registry.register('test-type', mockFilter);

      const result = registry.unregister('test-type');

      expect(result).toBe(true);
      expect(registry.get('test-type')).toBeUndefined();
    });

    it('should return false when unregistering non-existent filter', () => {
      const result = registry.unregister('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('get', () => {
    it('should return registered filter', () => {
      registry.register('test-type', mockFilter);

      const result = registry.get('test-type');

      expect(result).toBe(mockFilter);
    });

    it('should return undefined for non-existent filter', () => {
      const result = registry.get('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('global registry instance', () => {
    it('should be a singleton instance', () => {
      expect(filterRegistry).toBeInstanceOf(FilterRegistry);
    });

    it('should allow registering and retrieving filters', () => {
      const testFilter = vi.fn() as FilterComponent;

      filterRegistry.register('global-test', testFilter);
      expect(filterRegistry.get('global-test')).toBe(testFilter);

      // Clean up
      filterRegistry.unregister('global-test');
    });
  });
});
