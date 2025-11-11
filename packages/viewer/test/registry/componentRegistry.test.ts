import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import {
  TypedComponentRegistry,
  TypeCapable,
} from '../../src/registry/componentRegistry';

// Test components with consistent props
const TextComponent = ({ value }: { value: string }) =>
  React.createElement('span', null, value);
const AnotherTextComponent = ({ value }: { value: string }) =>
  React.createElement('div', null, value);
const ThirdTextComponent = ({ value }: { value: string }) =>
  React.createElement('em', null, value);

describe('TypedComponentRegistry', () => {
  let registry: TypedComponentRegistry<string, { value: string }>;

  beforeEach(() => {
    registry = new TypedComponentRegistry<string, { value: string }>();
  });

  describe('Basic Functionality', () => {
    it('should register and retrieve a component', () => {
      registry.register('text', TextComponent);
      expect(registry.get('text')).toBe(TextComponent);
    });

    it('should return undefined for unregistered type', () => {
      expect(registry.get('nonexistent')).toBeUndefined();
    });

    it('should check if type is registered', () => {
      expect(registry.has('text')).toBe(false);
      registry.register('text', TextComponent);
      expect(registry.has('text')).toBe(true);
    });
  });

  describe('Registration and Unregistration', () => {
    it('should throw error when registering duplicate type', () => {
      registry.register('text', TextComponent);
      expect(() => registry.register('text', AnotherTextComponent)).toThrow(
        'Component for type text already registered.',
      );
    });

    it('should throw error with correct message for different types', () => {
      registry.register('number', TextComponent);
      const error = new Error('Component for type number already registered.');
      expect(() => registry.register('number', AnotherTextComponent)).toThrow(
        error.message,
      );
    });

    it('should unregister a component', () => {
      registry.register('text', TextComponent);
      registry.unregister('text');
      expect(registry.get('text')).toBeUndefined();
      expect(registry.has('text')).toBe(false);
    });

    it('should handle unregistering non-existent type gracefully', () => {
      expect(() => registry.unregister('nonexistent')).not.toThrow();
      expect(registry.size).toBe(0);
    });

    it('should allow re-registration after unregistration', () => {
      registry.register('text', TextComponent);
      registry.unregister('text');
      registry.register('text', AnotherTextComponent);
      expect(registry.get('text')).toBe(AnotherTextComponent);
    });
  });

  describe('Bulk Operations', () => {
    it('should clear all registrations', () => {
      registry.register('text', TextComponent);
      registry.register('number', AnotherTextComponent);
      registry.register('boolean', ThirdTextComponent);
      expect(registry.size).toBe(3);

      registry.clear();
      expect(registry.size).toBe(0);
      expect(registry.has('text')).toBe(false);
      expect(registry.has('number')).toBe(false);
      expect(registry.has('boolean')).toBe(false);
    });

    it('should get all types', () => {
      registry.register('text', TextComponent);
      registry.register('number', AnotherTextComponent);
      registry.register('boolean', ThirdTextComponent);
      const types = registry.types;
      expect(types).toHaveLength(3);
      expect(types).toContain('text');
      expect(types).toContain('number');
      expect(types).toContain('boolean');
    });

    it('should get all entries', () => {
      registry.register('text', TextComponent);
      registry.register('number', AnotherTextComponent);
      const entries = registry.entries;
      expect(entries).toHaveLength(2);
      expect(entries).toContainEqual(['text', TextComponent]);
      expect(entries).toContainEqual(['number', AnotherTextComponent]);
    });

    it('should maintain order of registration in types and entries', () => {
      registry.register('first', TextComponent);
      registry.register('second', AnotherTextComponent);
      registry.register('third', ThirdTextComponent);

      expect(registry.types).toEqual(['first', 'second', 'third']);
      expect(registry.entries).toEqual([
        ['first', TextComponent],
        ['second', AnotherTextComponent],
        ['third', ThirdTextComponent],
      ]);
    });
  });

  describe('Size Management', () => {
    it('should start with size 0', () => {
      expect(registry.size).toBe(0);
    });

    it('should increment size on registration', () => {
      registry.register('text', TextComponent);
      expect(registry.size).toBe(1);
      registry.register('number', AnotherTextComponent);
      expect(registry.size).toBe(2);
    });

    it('should decrement size on unregistration', () => {
      registry.register('text', TextComponent);
      registry.register('number', AnotherTextComponent);
      expect(registry.size).toBe(2);

      registry.unregister('text');
      expect(registry.size).toBe(1);

      registry.unregister('number');
      expect(registry.size).toBe(0);
    });

    it('should not change size on duplicate registration attempt', () => {
      registry.register('text', TextComponent);
      expect(registry.size).toBe(1);
      expect(() => registry.register('text', AnotherTextComponent)).toThrow();
      expect(registry.size).toBe(1);
    });

    it('should not change size on unregistering non-existent type', () => {
      registry.register('text', TextComponent);
      expect(registry.size).toBe(1);
      registry.unregister('nonexistent');
      expect(registry.size).toBe(1);
    });
  });

  describe('Static Factory Method', () => {
    it('should create registry with initial components', () => {
      const registry = TypedComponentRegistry.create([
        ['text', TextComponent],
        ['number', AnotherTextComponent],
      ]);

      expect(registry.size).toBe(2);
      expect(registry.get('text')).toBe(TextComponent);
      expect(registry.get('number')).toBe(AnotherTextComponent);
    });

    it('should create empty registry when no components provided', () => {
      const registry = TypedComponentRegistry.create();
      expect(registry.size).toBe(0);
    });

    it('should create empty registry when empty array provided', () => {
      const registry = TypedComponentRegistry.create([]);
      expect(registry.size).toBe(0);
    });

    it('should throw error when initial components have duplicate types', () => {
      expect(() =>
        TypedComponentRegistry.create([
          ['text', TextComponent],
          ['text', AnotherTextComponent],
        ]),
      ).toThrow('Component for type text already registered.');
    });

    it('should handle large number of initial components', () => {
      const components: [string, React.FunctionComponent<{ value: string }>][] =
        [];
      for (let i = 0; i < 100; i++) {
        components.push([`type${i}`, TextComponent]);
      }
      const registry = TypedComponentRegistry.create(components);
      expect(registry.size).toBe(100);
      expect(registry.get('type50')).toBe(TextComponent);
    });
  });

  describe('Type Safety and Generics', () => {
    it('should work with different key types', () => {
      const numberKeyRegistry = new TypedComponentRegistry<
        number,
        { value: string }
      >();
      numberKeyRegistry.register(1, TextComponent);
      numberKeyRegistry.register(2, AnotherTextComponent);
      expect(numberKeyRegistry.get(1)).toBe(TextComponent);
      expect(numberKeyRegistry.get(2)).toBe(AnotherTextComponent);
    });

    it('should work with symbol keys', () => {
      const symbolKeyRegistry = new TypedComponentRegistry<
        symbol,
        { value: string }
      >();
      const textSymbol = Symbol('text');
      const numberSymbol = Symbol('number');
      symbolKeyRegistry.register(textSymbol, TextComponent);
      symbolKeyRegistry.register(numberSymbol, AnotherTextComponent);
      expect(symbolKeyRegistry.get(textSymbol)).toBe(TextComponent);
      expect(symbolKeyRegistry.get(numberSymbol)).toBe(AnotherTextComponent);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty string as type', () => {
      registry.register('', TextComponent);
      expect(registry.get('')).toBe(TextComponent);
      expect(registry.has('')).toBe(true);
    });

    it('should handle special characters in type names', () => {
      const specialTypes = [
        'type-with-dash',
        'type_with_underscore',
        'type.with.dots',
        'type with spaces',
      ];
      specialTypes.forEach(type => {
        registry.register(type, TextComponent);
      });
      expect(registry.size).toBe(specialTypes.length);
      specialTypes.forEach(type => {
        expect(registry.get(type)).toBe(TextComponent);
      });
    });

    it('should handle unicode characters in type names', () => {
      const unicodeTypes = ['类型', 'тип', 'نوع', 'tipo'];
      unicodeTypes.forEach(type => {
        registry.register(type, TextComponent);
      });
      expect(registry.size).toBe(unicodeTypes.length);
      unicodeTypes.forEach(type => {
        expect(registry.get(type)).toBe(TextComponent);
      });
    });

    it('should handle very long type names', () => {
      const longType = 'a'.repeat(1000);
      registry.register(longType, TextComponent);
      expect(registry.get(longType)).toBe(TextComponent);
    });

    it('should handle components with optional props', () => {
      const flexibleRegistry = new TypedComponentRegistry<
        string,
        { value?: string }
      >();
      const FlexibleComponent = ({ value }: { value?: string }) =>
        React.createElement('span', null, value || 'default');
      flexibleRegistry.register('flexible', FlexibleComponent);
      expect(flexibleRegistry.get('flexible')).toBe(FlexibleComponent);
    });

    it('should handle components with no props', () => {
      const noPropsRegistry = new TypedComponentRegistry<string, {}>();
      const NoPropsComponent = () =>
        React.createElement('div', null, 'no props');
      noPropsRegistry.register('noProps', NoPropsComponent);
      expect(noPropsRegistry.get('noProps')).toBe(NoPropsComponent);
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large number of registrations efficiently', () => {
      const components: [string, React.FunctionComponent<{ value: string }>][] =
        [];

      // Create 1000 components
      for (let i = 0; i < 1000; i++) {
        const Component = ({ value }: { value: string }) =>
          React.createElement('span', { key: i }, value);
        components.push([`type${i}`, Component]);
      }

      // Register all at once
      const registry = TypedComponentRegistry.create(components);
      expect(registry.size).toBe(1000);

      // Verify random access
      expect(registry.get('type0')).toBeDefined();
      expect(registry.get('type500')).toBeDefined();
      expect(registry.get('type999')).toBeDefined();
    });

    it('should not leak memory on clear', () => {
      const initialSize = registry.size;
      registry.register('text', TextComponent);
      registry.register('number', AnotherTextComponent);
      expect(registry.size).toBe(2);

      registry.clear();
      expect(registry.size).toBe(initialSize);
      expect(registry.types).toEqual([]);
      expect(registry.entries).toEqual([]);
    });
  });

  describe('Integration with TypeCapable Interface', () => {
    it('should work with objects implementing TypeCapable', () => {
      interface TypedData extends TypeCapable<string> {
        data: string;
      }

      const dataRegistry = new TypedComponentRegistry<string, TypedData>();
      const DataComponent = ({ type, data }: TypedData) =>
        React.createElement('div', null, `${type}: ${data}`);

      dataRegistry.register('user', DataComponent);
      expect(dataRegistry.get('user')).toBe(DataComponent);
    });

    it('should handle TypeCapable with different type parameters', () => {
      interface NumberTyped extends TypeCapable<number> {
        value: number;
      }

      const numberTypeRegistry = new TypedComponentRegistry<
        number,
        NumberTyped
      >();
      const NumberTypedComponent = ({ type, value }: NumberTyped) =>
        React.createElement('span', null, `Type ${type}: ${value}`);

      numberTypeRegistry.register(42, NumberTypedComponent);
      expect(numberTypeRegistry.get(42)).toBe(NumberTypedComponent);
    });
  });
});
