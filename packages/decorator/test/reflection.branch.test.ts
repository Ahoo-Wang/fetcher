import { describe, it, expect } from 'vitest';
import { getParameterNames, getParameterName } from '../src/reflection';

describe('reflection - branch coverage', () => {
  it('should handle non-function input to getParameterNames', () => {
    expect(() => getParameterNames('not a function' as any)).toThrow(TypeError);
    expect(() => getParameterNames(null as any)).toThrow(TypeError);
    expect(() => getParameterNames(undefined as any)).toThrow(TypeError);
    expect(() => getParameterNames(123 as any)).toThrow(TypeError);
  });

  it('should handle function with no parameters', () => {
    function noParams() {
      // No parameters
    }

    expect(getParameterNames(noParams)).toEqual([]);

    const arrowNoParams = () => {
      // No parameters
    };
    expect(getParameterNames(arrowNoParams)).toEqual([]);
  });

  it('should handle function with complex parameters', () => {
    function complex(a: string, b: number = 10, ...rest: any[]) {
      // Complex parameters
      return { a, b, rest };
    }

    expect(getParameterNames(complex)).toEqual(['a', 'b', '...rest']);
  });

  it('should handle arrow function with single parameter', () => {
    const singleParam = (a: string) => {
      return a;
    };
    expect(getParameterNames(singleParam)).toEqual(['a']);
  });

  it('should handle getParameterName with various scenarios', () => {
    class TestClass {
      method(a: string, b: number) {
        return a + b;
      }
    }

    // Test with provided name
    expect(
      getParameterName(TestClass.prototype, 'method', 0, 'customName'),
    ).toBe('customName');

    // Test with valid method and parameter index
    expect(getParameterName(TestClass.prototype, 'method', 0)).toBe('a');
    expect(getParameterName(TestClass.prototype, 'method', 1)).toBe('b');

    // Test with invalid parameter index
    expect(getParameterName(TestClass.prototype, 'method', 5)).toBeUndefined();

    // Test with non-existent method
    expect(
      getParameterName(TestClass.prototype, 'nonExistent', 0),
    ).toBeUndefined();

    // Test with null target
    expect(getParameterName(null as any, 'method', 0)).toBeUndefined();
  });

  it('should handle edge cases in parameter extraction', () => {
    // Function with parentheses in default values
    function withParentheses(a: string = 'default(value)', b: number) {
      // Parameters with parentheses
      return { a, b };
    }

    expect(getParameterNames(withParentheses)).toEqual(['a', 'b']);

    // Function with nested parentheses in type annotations
    function withNestedTypes(a: Record<string, number>, b: Array<string>) {
      // Parameters with nested types
      return { a, b };
    }

    expect(getParameterNames(withNestedTypes)).toEqual(['a', 'b']);

    // Arrow function with complex parameters
    const complexArrow = (a: string = 'default', ...rest: any[]) => {
      // Complex arrow parameters
      return { a, rest };
    };
    expect(getParameterNames(complexArrow)).toEqual(['a', '...rest']);
  });

  it('should handle malformed function strings gracefully', () => {
    // Create a function that would cause parsing errors
    const malformedFunc = function () {};
    // Override toString to return malformed string
    malformedFunc.toString = () => 'function test(';

    // Should return empty array instead of throwing
    expect(getParameterNames(malformedFunc)).toEqual([]);
  });

  it('should handle function with unmatched parentheses', () => {
    // Create a function that would cause unmatched parentheses
    const unmatchedFunc = function () {};
    // Override toString to return string with unmatched parentheses
    unmatchedFunc.toString = () => 'function test(a: string, b: number';

    // Should return empty array instead of throwing
    expect(getParameterNames(unmatchedFunc)).toEqual([]);
  });

  it('should handle function with malformed string representation', () => {
    // Create a function with malformed string representation
    const malformedFunc = function () {};
    // Override toString to return malformed string that causes parsing errors
    malformedFunc.toString = () => 'function test(a: string, b: number'; // Missing closing parenthesis

    // Should return empty array instead of throwing
    expect(getParameterNames(malformedFunc)).toEqual([]);
  });

  it('should handle function with toString that throws', () => {
    // Create a function whose toString method throws an error
    const errorFunc = function () {};
    // Override toString to throw an error
    errorFunc.toString = () => {
      throw new Error('toString error');
    };

    // Should return empty array instead of throwing
    expect(getParameterNames(errorFunc)).toEqual([]);
  });

  it('should handle arrow function with unmatched parentheses', () => {
    // Create an arrow function with unmatched parentheses
    const unmatchedArrowFunc = function() {
    };
    // Override toString to return arrow function with unmatched parentheses
    unmatchedArrowFunc.toString = () => '(a: string, b: number'; // Arrow function starting with ( but no closing )

    // Should return empty array instead of throwing
    expect(getParameterNames(unmatchedArrowFunc)).toEqual([]);
  });

  it('should handle function with no opening parenthesis', () => {
    // Create a function with no opening parenthesis
    const noParenFunc = function() {
    };
    // Override toString to return function with no opening parenthesis
    noParenFunc.toString = () => 'function test'; // No parentheses

    // Should return empty array instead of throwing
    expect(getParameterNames(noParenFunc)).toEqual([]);
  });
});
