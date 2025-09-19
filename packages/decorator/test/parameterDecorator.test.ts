import { describe, it, expect } from 'vitest';
import 'reflect-metadata';
import {
  ParameterType,
  parameter,
  path,
  query,
  header,
  body,
  request,
  attribute,
  attributes,
  PARAMETER_METADATA_KEY,
  type ParameterMetadata,
} from '../src';

// Mock class for testing decorators
class TestClass {
  testMethod(
    pathParam: string,
    queryParam: number,
    headerParam: string,
    bodyParam: any,
    requestParam: any,
    attrParam: string,
    attrsParam: Record<string, any>,
  ) {
    return {
      pathParam,
      queryParam,
      headerParam,
      bodyParam,
      requestParam,
      attrParam,
      attrsParam,
    };
  }
}

describe('parameterDecorator', () => {
  describe('ParameterType', () => {
    it('should define all parameter types', () => {
      expect(ParameterType.PATH).toBe('path');
      expect(ParameterType.QUERY).toBe('query');
      expect(ParameterType.HEADER).toBe('header');
      expect(ParameterType.BODY).toBe('body');
      expect(ParameterType.REQUEST).toBe('request');
      expect(ParameterType.ATTRIBUTE).toBe('attribute');
      expect(ParameterType.ATTRIBUTES).toBe('attributes');
    });
  });

  describe('parameter', () => {
    it('should create parameter metadata with explicit name', () => {
      const decorator = parameter(ParameterType.PATH, 'userId');
      const target = new TestClass();

      // Apply decorator
      decorator(target, 'testMethod', 0);

      // Check metadata
      const metadata: Map<number, ParameterMetadata> = Reflect.getMetadata(
        PARAMETER_METADATA_KEY,
        target,
        'testMethod',
      );

      expect(metadata).toBeDefined();
      expect(metadata.size).toBe(1);
      expect(metadata.has(0)).toBe(true);

      const paramMetadata = metadata.get(0)!;
      expect(paramMetadata.type).toBe(ParameterType.PATH);
      expect(paramMetadata.name).toBe('userId');
      expect(paramMetadata.index).toBe(0);
    });

    it('should create parameter metadata with auto-extracted name', () => {
      const decorator = parameter(ParameterType.QUERY);
      const target = new TestClass();

      // Apply decorator
      decorator(target, 'testMethod', 1);

      // Check metadata
      const metadata: Map<number, ParameterMetadata> = Reflect.getMetadata(
        PARAMETER_METADATA_KEY,
        target,
        'testMethod',
      );

      expect(metadata).toBeDefined();
      expect(metadata.size).toBe(1);
      expect(metadata.has(1)).toBe(true);

      const paramMetadata = metadata.get(1)!;
      expect(paramMetadata.type).toBe(ParameterType.QUERY);
      expect(paramMetadata.name).toBe('queryParam'); // Auto-extracted name
      expect(paramMetadata.index).toBe(1);
    });

    it('should handle multiple parameters on the same method', () => {
      const pathDecorator = parameter(ParameterType.PATH, 'id');
      const queryDecorator = parameter(ParameterType.QUERY, 'limit');
      const target = new TestClass();

      // Apply decorators
      pathDecorator(target, 'testMethod', 0);
      queryDecorator(target, 'testMethod', 1);

      // Check metadata
      const metadata: Map<number, ParameterMetadata> = Reflect.getMetadata(
        PARAMETER_METADATA_KEY,
        target,
        'testMethod',
      );

      expect(metadata).toBeDefined();
      expect(metadata.size).toBe(2);
      expect(metadata.has(0)).toBe(true);
      expect(metadata.has(1)).toBe(true);

      const pathMetadata = metadata.get(0)!;
      expect(pathMetadata.type).toBe(ParameterType.PATH);
      expect(pathMetadata.name).toBe('id');
      expect(pathMetadata.index).toBe(0);

      const queryMetadata = metadata.get(1)!;
      expect(queryMetadata.type).toBe(ParameterType.QUERY);
      expect(queryMetadata.name).toBe('limit');
      expect(queryMetadata.index).toBe(1);
    });
  });

  describe('path', () => {
    it('should create path parameter decorator with explicit name', () => {
      const decorator = path('userId');
      const target = new TestClass();

      decorator(target, 'testMethod', 0);

      const metadata: Map<number, ParameterMetadata> = Reflect.getMetadata(
        PARAMETER_METADATA_KEY,
        target,
        'testMethod',
      );

      expect(metadata).toBeDefined();
      const paramMetadata = metadata.get(0)!;
      expect(paramMetadata.type).toBe(ParameterType.PATH);
      expect(paramMetadata.name).toBe('userId');
    });

    it('should create path parameter decorator with auto-extracted name', () => {
      const decorator = path();
      const target = new TestClass();

      decorator(target, 'testMethod', 0);

      const metadata: Map<number, ParameterMetadata> = Reflect.getMetadata(
        PARAMETER_METADATA_KEY,
        target,
        'testMethod',
      );

      expect(metadata).toBeDefined();
      const paramMetadata = metadata.get(0)!;
      expect(paramMetadata.type).toBe(ParameterType.PATH);
      expect(paramMetadata.name).toBe('pathParam');
    });
  });

  describe('query', () => {
    it('should create query parameter decorator with explicit name', () => {
      const decorator = query('limit');
      const target = new TestClass();

      decorator(target, 'testMethod', 1);

      const metadata: Map<number, ParameterMetadata> = Reflect.getMetadata(
        PARAMETER_METADATA_KEY,
        target,
        'testMethod',
      );

      expect(metadata).toBeDefined();
      const paramMetadata = metadata.get(1)!;
      expect(paramMetadata.type).toBe(ParameterType.QUERY);
      expect(paramMetadata.name).toBe('limit');
    });

    it('should create query parameter decorator with auto-extracted name', () => {
      const decorator = query();
      const target = new TestClass();

      decorator(target, 'testMethod', 1);

      const metadata: Map<number, ParameterMetadata> = Reflect.getMetadata(
        PARAMETER_METADATA_KEY,
        target,
        'testMethod',
      );

      expect(metadata).toBeDefined();
      const paramMetadata = metadata.get(1)!;
      expect(paramMetadata.type).toBe(ParameterType.QUERY);
      expect(paramMetadata.name).toBe('queryParam');
    });
  });

  describe('header', () => {
    it('should create header parameter decorator with explicit name', () => {
      const decorator = header('Authorization');
      const target = new TestClass();

      decorator(target, 'testMethod', 2);

      const metadata: Map<number, ParameterMetadata> = Reflect.getMetadata(
        PARAMETER_METADATA_KEY,
        target,
        'testMethod',
      );

      expect(metadata).toBeDefined();
      const paramMetadata = metadata.get(2)!;
      expect(paramMetadata.type).toBe(ParameterType.HEADER);
      expect(paramMetadata.name).toBe('Authorization');
    });

    it('should create header parameter decorator with auto-extracted name', () => {
      const decorator = header();
      const target = new TestClass();

      decorator(target, 'testMethod', 2);

      const metadata: Map<number, ParameterMetadata> = Reflect.getMetadata(
        PARAMETER_METADATA_KEY,
        target,
        'testMethod',
      );

      expect(metadata).toBeDefined();
      const paramMetadata = metadata.get(2)!;
      expect(paramMetadata.type).toBe(ParameterType.HEADER);
      expect(paramMetadata.name).toBe('headerParam');
    });
  });

  describe('body', () => {
    it('should create body parameter decorator', () => {
      const decorator = body();
      const target = new TestClass();

      decorator(target, 'testMethod', 3);

      const metadata: Map<number, ParameterMetadata> = Reflect.getMetadata(
        PARAMETER_METADATA_KEY,
        target,
        'testMethod',
      );

      expect(metadata).toBeDefined();
      const paramMetadata = metadata.get(3)!;
      expect(paramMetadata.type).toBe(ParameterType.BODY);
      expect(paramMetadata.name).toBe('bodyParam');
    });
  });

  describe('request', () => {
    it('should create request parameter decorator', () => {
      const decorator = request();
      const target = new TestClass();

      decorator(target, 'testMethod', 4);

      const metadata: Map<number, ParameterMetadata> = Reflect.getMetadata(
        PARAMETER_METADATA_KEY,
        target,
        'testMethod',
      );

      expect(metadata).toBeDefined();
      const paramMetadata = metadata.get(4)!;
      expect(paramMetadata.type).toBe(ParameterType.REQUEST);
      expect(paramMetadata.name).toBe('requestParam');
    });
  });

  describe('attribute', () => {
    it('should create attribute parameter decorator with explicit name', () => {
      const decorator = attribute('userId');
      const target = new TestClass();

      decorator(target, 'testMethod', 5);

      const metadata: Map<number, ParameterMetadata> = Reflect.getMetadata(
        PARAMETER_METADATA_KEY,
        target,
        'testMethod',
      );

      expect(metadata).toBeDefined();
      const paramMetadata = metadata.get(5)!;
      expect(paramMetadata.type).toBe(ParameterType.ATTRIBUTE);
      expect(paramMetadata.name).toBe('userId');
    });

    it('should create attribute parameter decorator with auto-extracted name', () => {
      const decorator = attribute();
      const target = new TestClass();

      decorator(target, 'testMethod', 5);

      const metadata: Map<number, ParameterMetadata> = Reflect.getMetadata(
        PARAMETER_METADATA_KEY,
        target,
        'testMethod',
      );

      expect(metadata).toBeDefined();
      const paramMetadata = metadata.get(5)!;
      expect(paramMetadata.type).toBe(ParameterType.ATTRIBUTE);
      expect(paramMetadata.name).toBe('attrParam');
    });
  });

  describe('attributes', () => {
    it('should create attributes parameter decorator', () => {
      const decorator = attributes();
      const target = new TestClass();

      decorator(target, 'testMethod', 6);

      const metadata: Map<number, ParameterMetadata> = Reflect.getMetadata(
        PARAMETER_METADATA_KEY,
        target,
        'testMethod',
      );

      expect(metadata).toBeDefined();
      const paramMetadata = metadata.get(6)!;
      expect(paramMetadata.type).toBe(ParameterType.ATTRIBUTES);
      expect(paramMetadata.name).toBe('attrsParam');
    });
  });
});
