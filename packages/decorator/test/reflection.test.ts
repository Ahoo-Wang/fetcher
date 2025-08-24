import { describe, it, expect } from 'vitest';
import { getParameterNames } from '../src';

describe('reflection', () => {
  it('should extract parameter names from regular function', () => {
    function testFunc(a: string, b: number, c: boolean) {
      return a + b + (c ? 1 : 0);
    }

    const paramNames = getParameterNames(testFunc);
    expect(paramNames).toEqual(['a', 'b', 'c']);
  });

  it('should extract parameter names from arrow function', () => {
    const testFunc = (x: string, y: number) => x.length + y;

    const paramNames = getParameterNames(testFunc);
    expect(paramNames).toEqual(['x', 'y']);
  });

  it('should extract parameter names from function with default values', () => {
    function testFunc(param1: string, param2: number = 10) {
      return param1.length + param2;
    }

    const paramNames = getParameterNames(testFunc);
    expect(paramNames).toEqual(['param1', 'param2']);
  });

  it('should extract parameter names from function with rest parameters', () => {
    function testFunc(param1: string, ...rest: any[]) {
      return param1.length + rest.length;
    }

    const paramNames = getParameterNames(testFunc);
    expect(paramNames).toEqual(['param1', '...rest']);
  });

  it('should handle function with no parameters', () => {
    function testFunc() {
      return 'no params';
    }

    const paramNames = getParameterNames(testFunc);
    expect(paramNames).toEqual([]);
  });

  it('should handle arrow function with no parameters', () => {
    const testFunc = () => 'no params';

    const paramNames = getParameterNames(testFunc);
    expect(paramNames).toEqual([]);
  });

  it('should handle async function', () => {
    async function testFunc(a: string, b: number) {
      return a.length + b;
    }

    const paramNames = getParameterNames(testFunc);
    expect(paramNames).toEqual(['a', 'b']);
  });

  it('should handle class method', () => {
    class TestClass {
      method(a: string, b: number) {
        return a.length + b;
      }
    }

    const paramNames = getParameterNames(TestClass.prototype.method);
    expect(paramNames).toEqual(['a', 'b']);
  });

  it('should return empty array for non-function input', () => {
    expect(() => getParameterNames('not a function' as any)).toThrow(TypeError);
  });

  it('should handle complex TypeScript parameter declarations', () => {
    function complexFunc(
      param1: string,
      param2: number = 10,
      param3?: boolean,
      ...rest: any[]
    ) {
      return param1.length + param2 + (param3 ? 1 : 0) + rest.length;
    }

    const paramNames = getParameterNames(complexFunc);
    expect(paramNames).toEqual(['param1', 'param2', 'param3', '...rest']);
  });
});
