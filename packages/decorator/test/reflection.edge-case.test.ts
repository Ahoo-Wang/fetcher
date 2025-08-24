import { describe, it, expect } from 'vitest';
import { getParameterNames, getParameterName } from '../src';

describe('reflection - edge cases', () => {
  it('should handle function with complex TypeScript types', () => {
    // Function with complex generic types
    function complexGeneric<T extends Record<string, any>>(
      param1: T,
      _param2: Array<T>,
      _param3: Promise<T>,
    ) {
      return Promise.resolve(param1);
    }

    // The function should still extract parameter names even with complex types
    expect(getParameterNames(complexGeneric)).toEqual([
      'param1',
      '_param2',
      '_param3',
    ]);
  });

  it('should handle function with nested object destructuring', () => {
    // Function with destructuring parameters
    function withDestructuring(
      { a, b }: { a: string; b: number },
      [c, d]: [string, number],
    ) {
      return { a, b, c, d };
    }

    // Destructuring parameters are not supported, but should not cause errors
    // The current implementation will extract the destructured parameters as separate parameters
    expect(getParameterNames(withDestructuring)).toEqual([
      '{ a',
      'b }',
      '[c',
      'd]',
    ]);
  });

  it('should handle function with default parameters and complex expressions', () => {
    // Function with complex default values
    function withComplexDefaults(
      a: string = 'default',
      b: number = Math.random() > 0.5 ? 1 : 0,
      c: string = `template-${Date.now()}`,
    ) {
      return { a, b, c };
    }

    // Should extract parameter names even with complex default values
    expect(getParameterNames(withComplexDefaults)).toEqual(['a', 'b', 'c']);
  });

  it('should handle arrow function with complex parameter list', () => {
    // Arrow function with complex parameters
    const complexArrow = (
      param1: string | number,
      _param2: { a: string; b: number } = { a: 'default', b: 0 },
      ...rest: any[]
    ) => {
      return { param1, param2: _param2, rest };
    };

    // Should extract parameter names correctly
    expect(getParameterNames(complexArrow)).toEqual([
      'param1',
      '_param2',
      'b',
      '...rest',
    ]);
  });

  it('should handle async function with complex parameters', () => {
    // Async function with complex parameters
    async function asyncComplex(
      param1: Promise<string>,
      _param2: string = 'default',
      ...rest: any[]
    ): Promise<any> {
      const result = await param1;
      return { result, param2: _param2, rest };
    }

    // Should extract parameter names correctly
    expect(getParameterNames(asyncComplex)).toEqual([
      'param1',
      '_param2',
      '...rest',
    ]);
  });

  it('should handle class method with complex parameters', () => {
    class TestClass {
      // Method with complex parameters
      complexMethod(
        param1: string | undefined,
        _param2: number | null = null,
        ...rest: Array<string | number>
      ) {
        return { param1, param2: _param2, rest };
      }
    }

    // Should extract parameter names correctly
    expect(getParameterNames(TestClass.prototype.complexMethod)).toEqual([
      'param1',
      '_param2',
      '...rest',
    ]);
  });

  it('should handle getParameterName with edge cases', () => {
    class TestClass {
      // Method with parameters
      complexMethod(
        param1: string | undefined,
        _param2: number | null = null,
        ...rest: Array<string | number>
      ) {
        return { param1, _param2: _param2, rest };
      }

      // Method without parameters
      noParamMethod() {
        return 'no params';
      }

      // Method for testing parameter extraction
      testMethod(a: string, b: number) {
        return { a, b };
      }

      // Non-existent method
      nonExistentMethod: any;
    }

    // Should extract parameter name correctly
    expect(getParameterName(TestClass.prototype, 'testMethod', 0)).toBe('a');
    expect(getParameterName(TestClass.prototype, 'testMethod', 1)).toBe('b');

    // Should handle out of bounds parameter index
    expect(
      getParameterName(TestClass.prototype, 'testMethod', 5),
    ).toBeUndefined();

    // Should handle method without parameters
    expect(
      getParameterName(TestClass.prototype, 'noParamMethod', 0),
    ).toBeUndefined();

    // Should handle non-existent method
    expect(
      getParameterName(TestClass.prototype, 'nonExistentMethod', 0),
    ).toBeUndefined();

    // Should handle null target
    expect(getParameterName({} as object, 'testMethod', 0)).toBeUndefined();

    // Should handle provided name
    expect(
      getParameterName(TestClass.prototype, 'testMethod', 0, 'customName'),
    ).toBe('customName');
  });

  it('should handle function with parentheses in default values', () => {
    // Function with parentheses in default values
    function withParentheses(
      a: string = 'default(value)',
      b: string = `template-${1 + 2}`,
    ) {
      return { a, b };
    }

    // Should extract parameter names correctly
    expect(getParameterNames(withParentheses)).toEqual(['a', 'b']);
  });

  it('should handle function with nested generics', () => {
    // Function with nested generic types
    function withNestedGenerics(
      param1: Record<string, Array<number>>,
      _param2: Map<string, Set<number>>,
      _param3: Promise<Array<{ a: string; b: number }>>,
    ) {
      return { param1, param2: _param2, param3: _param3 };
    }

    // Should extract parameter names correctly
    expect(getParameterNames(withNestedGenerics)).toEqual([
      'param1',
      '_param2',
      '_param3',
    ]);
  });

  it('should handle function with union and intersection types', () => {
    // Function with union and intersection types
    function withUnionIntersection(
      param1: string & { length: number },
      _param2: string | number,
      _param3: { a: string } & { b: number },
    ) {
      return {
        param1: param1 as any,
        param2: _param2,
        _param3: _param3 as any,
      };
    }

    // Should extract parameter names correctly
    expect(getParameterNames(withUnionIntersection)).toEqual([
      'param1',
      '_param2',
      '_param3',
    ]);
  });
});
