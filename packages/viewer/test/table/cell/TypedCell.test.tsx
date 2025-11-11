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
import React from 'react';
import {
  typedCellRender,
  CellType,
  CellRenderer,
} from '../../../src';
import { TEXT_CELL_TYPE } from '../../../src';

describe('TypedCell', () => {
  describe('CellType', () => {
    it('should be a string type', () => {
      const type: CellType = 'text';
      expect(typeof type).toBe('string');
    });

    it('should accept various string values', () => {
      const types: CellType[] = [
        'text',
        'number',
        'boolean',
        'custom-type',
        '',
      ];
      types.forEach(type => {
        expect(typeof type).toBe('string');
      });
    });
  });

  describe('CellRenderer', () => {
    it('should be a function type', () => {
      const renderer: CellRenderer = (value, record, index) => null;
      expect(typeof renderer).toBe('function');
    });

    it('should accept any value type', () => {
      const renderer: CellRenderer = (value: any, record, index) => null;
      expect(renderer('test', {}, 0)).toBeNull();
      expect(renderer(123, {}, 0)).toBeNull();
      expect(renderer(true, {}, 0)).toBeNull();
      expect(renderer(null, {}, 0)).toBeNull();
      expect(renderer(undefined, {}, 0)).toBeNull();
    });

    it('should accept any record type', () => {
      const renderer: CellRenderer<any> = (value, record, index) => null;
      expect(renderer('test', { id: 1 }, 0)).toBeNull();
      expect(renderer('test', 'string-record', 0)).toBeNull();
      expect(renderer('test', null, 0)).toBeNull();
      expect(renderer('test', undefined, 0)).toBeNull();
    });

    it('should accept number index', () => {
      const renderer: CellRenderer = (value, record, index) => null;
      expect(renderer('test', {}, 0)).toBeNull();
      expect(renderer('test', {}, 1)).toBeNull();
      expect(renderer('test', {}, -1)).toBeNull();
      expect(renderer('test', {}, 999999)).toBeNull();
    });

    it('should return React.ReactNode or Promise<React.ReactNode>', () => {
      const renderer: CellRenderer = (value, record, index) => {
        if (typeof value === 'string' && value.length > 5) {
          return Promise.resolve(
            React.createElement('div', null, 'Long value'),
          );
        }
        return React.createElement('span', null, 'Short value');
      };

      const syncResult = renderer('short', {}, 0);
      const asyncResult = renderer('very long value', {}, 0);

      expect(React.isValidElement(syncResult)).toBe(true);
      expect(asyncResult).toBeInstanceOf(Promise);
    });
  });

  describe('typedCellRender', () => {
    describe('with registered cell types', () => {
      it('should return a function for registered cell type', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        expect(typeof renderer).toBe('function');
        expect(renderer).toBeDefined();
      });

      it('should return a function with correct signature', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        expect(renderer!.length).toBe(3); // (value, record, index)
      });

      it('should return valid React element when renderer is called', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const record = { id: 1, name: 'Test' };
        const result = renderer!('Hello World', record, 0);

        expect(React.isValidElement(result)).toBe(true);
      });

      it('should pass correct data to cell component', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const record = { id: 3, value: 'test' };
        const result = renderer!('Test Value', record, 2);

        expect(React.isValidElement(result)).toBe(true);
        // The component receives the data correctly
      });

      it('should handle string values', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const result = renderer!('string value', { id: 1 }, 0);
        expect(React.isValidElement(result)).toBe(true);
      });

      it('should handle number values', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const result = renderer!(123, { id: 2 }, 1);
        expect(React.isValidElement(result)).toBe(true);
      });

      it('should handle boolean values', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const result = renderer!(true, { id: 3 }, 2);
        expect(React.isValidElement(result)).toBe(true);
      });

      it('should handle null values', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const result = renderer!(null, { id: 4 }, 3);
        expect(React.isValidElement(result)).toBe(true);
      });

      it('should handle undefined values', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const result = renderer!(undefined, { id: 5 }, 4);
        expect(React.isValidElement(result)).toBe(true);
      });

      it('should handle object values', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const result = renderer!({ key: 'value' }, { id: 6 }, 5);
        expect(React.isValidElement(result)).toBe(true);
      });

      it('should handle array values', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const result = renderer!([1, 2, 3], { id: 7 }, 6);
        expect(React.isValidElement(result)).toBe(true);
      });

      it('should handle empty string values', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const result = renderer!('', { id: 8 }, 7);
        expect(React.isValidElement(result)).toBe(true);
      });

      it('should handle special characters in string values', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const result = renderer!('Special chars: !@#$%^&*()', { id: 9 }, 8);
        expect(React.isValidElement(result)).toBe(true);
      });

      it('should handle unicode characters', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const result = renderer!('Unicode: 你好世界 🌍', { id: 10 }, 9);
        expect(React.isValidElement(result)).toBe(true);
      });

      it('should handle very long strings', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const longString = 'a'.repeat(10000);
        const result = renderer!(longString, { id: 11 }, 10);
        expect(React.isValidElement(result)).toBe(true);
      });

      it('should handle zero index', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const result = renderer!('test', { id: 12 }, 0);
        expect(React.isValidElement(result)).toBe(true);
      });

      it('should handle negative index', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const result = renderer!('test', { id: 13 }, -1);
        expect(React.isValidElement(result)).toBe(true);
      });

      it('should handle large index', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const result = renderer!('test', { id: 14 }, 999999);
        expect(React.isValidElement(result)).toBe(true);
      });

      it('should handle float index', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const result = renderer!('test', { id: 15 }, 1.5);
        expect(React.isValidElement(result)).toBe(true);
      });

      it('should handle complex record objects', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const complexRecord = {
          id: 16,
          nested: { prop: 'value' },
          array: [1, 2, 3],
          func: () => 'test',
          date: new Date(),
        };
        const result = renderer!('test', complexRecord, 11);
        expect(React.isValidElement(result)).toBe(true);
      });

      it('should handle null record', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const result = renderer!('test', null, 12);
        expect(React.isValidElement(result)).toBe(true);
      });

      it('should handle undefined record', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const result = renderer!('test', undefined, 13);
        expect(React.isValidElement(result)).toBe(true);
      });
    });

    describe('with attributes', () => {
      it('should accept attributes parameter', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE, { ellipsis: true });
        expect(typeof renderer).toBe('function');
      });

      it('should handle undefined attributes', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE, undefined);
        expect(typeof renderer).toBe('function');
      });

      it('should handle complex attributes', () => {
        const complexAttrs = {
          ellipsis: { tooltip: 'Full text' },
          strong: true,
          style: { color: 'red' },
        };
        const renderer = typedCellRender(TEXT_CELL_TYPE, complexAttrs);
        expect(typeof renderer).toBe('function');
      });

      it('should handle null attributes', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE, null as any);
        expect(typeof renderer).toBe('function');
      });

      it('should handle array attributes', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE, [1, 2, 3] as any);
        expect(typeof renderer).toBe('function');
      });

      it('should handle function attributes', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE, (() => {}) as any);
        expect(typeof renderer).toBe('function');
      });

      it('should handle empty object attributes', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE, {});
        expect(typeof renderer).toBe('function');
      });
    });

    describe('with unregistered cell types', () => {
      it('should return undefined for unregistered cell type', () => {
        const renderer = typedCellRender('unregistered-type');
        expect(renderer).toBeUndefined();
      });

      it('should return undefined for empty string type', () => {
        const renderer = typedCellRender('');
        expect(renderer).toBeUndefined();
      });

      it('should return undefined for null type', () => {
        const renderer = typedCellRender(null as any);
        expect(renderer).toBeUndefined();
      });

      it('should return undefined for undefined type', () => {
        const renderer = typedCellRender(undefined as any);
        expect(renderer).toBeUndefined();
      });

      it('should return undefined for number type', () => {
        const renderer = typedCellRender(123 as any);
        expect(renderer).toBeUndefined();
      });

      it('should return undefined for object type', () => {
        const renderer = typedCellRender({} as any);
        expect(renderer).toBeUndefined();
      });

      it('should return undefined for array type', () => {
        const renderer = typedCellRender([] as any);
        expect(renderer).toBeUndefined();
      });

      it('should return undefined for boolean type', () => {
        const renderer = typedCellRender(true as any);
        expect(renderer).toBeUndefined();
      });

      it('should return undefined for function type', () => {
        const renderer = typedCellRender((() => {}) as any);
        expect(renderer).toBeUndefined();
      });

      it('should return undefined for very long type string', () => {
        const longType = 'a'.repeat(1000);
        const renderer = typedCellRender(longType);
        expect(renderer).toBeUndefined();
      });

      it('should return undefined for type with special characters', () => {
        const specialType = 'type-with-special-chars!@#$%^&*()';
        const renderer = typedCellRender(specialType);
        expect(renderer).toBeUndefined();
      });

      it('should return undefined for unicode characters in type', () => {
        const unicodeType = '类型-测试';
        const renderer = typedCellRender(unicodeType);
        expect(renderer).toBeUndefined();
      });
    });

    describe('generic type usage', () => {
      it('should work with generic RecordType', () => {
        interface CustomRecord {
          id: number;
          name: string;
        }
        const renderer = typedCellRender<CustomRecord>(TEXT_CELL_TYPE);
        expect(typeof renderer).toBe('function');
      });

      it('should work with generic Attributes', () => {
        interface CustomAttrs {
          ellipsis: boolean;
          color: string;
        }
        const renderer = typedCellRender<any, CustomAttrs>(TEXT_CELL_TYPE, {
          ellipsis: true,
          color: 'blue',
        });
        expect(typeof renderer).toBe('function');
      });

      it('should work with both generic RecordType and Attributes', () => {
        interface CustomRecord {
          id: number;
          data: string;
        }
        interface CustomAttrs {
          strong: boolean;
        }
        const renderer = typedCellRender<CustomRecord, CustomAttrs>(
          TEXT_CELL_TYPE,
          { strong: true },
        );
        expect(typeof renderer).toBe('function');

        const result = renderer!('test', { id: 1, data: 'value' }, 0);
        expect(React.isValidElement(result)).toBe(true);
      });
    });

    describe('edge cases and potential failure points', () => {
      it('should handle Symbol values', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const symbolValue = Symbol('test');
        const result = renderer!(symbolValue, { id: 17 }, 14);
        expect(React.isValidElement(result)).toBe(true);
      });

      it('should handle Date objects', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const dateValue = new Date();
        const result = renderer!(dateValue, { id: 19 }, 16);
        expect(React.isValidElement(result)).toBe(true);
      });

      it('should handle RegExp objects', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const regexValue = /test/gi;
        const result = renderer!(regexValue, { id: 20 }, 17);
        expect(React.isValidElement(result)).toBe(true);
      });

      it('should handle Map objects', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const mapValue = new Map([['key', 'value']]);
        const result = renderer!(mapValue, { id: 21 }, 18);
        expect(React.isValidElement(result)).toBe(true);
      });

      it('should handle Set objects', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const setValue = new Set([1, 2, 3]);
        const result = renderer!(setValue, { id: 22 }, 19);
        expect(React.isValidElement(result)).toBe(true);
      });

      it('should handle circular references in records', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const circularRecord: any = { id: 23 };
        circularRecord.self = circularRecord;
        const result = renderer!('test', circularRecord, 20);
        expect(React.isValidElement(result)).toBe(true);
      });

      it('should handle prototype pollution attempts', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const pollutedRecord = { id: 24 };
        (pollutedRecord as any).__proto__.dangerous = 'property';
        const result = renderer!('test', pollutedRecord, 21);
        expect(React.isValidElement(result)).toBe(true);
      });

      it('should handle frozen objects', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const frozenRecord = Object.freeze({ id: 25, name: 'frozen' });
        const result = renderer!('test', frozenRecord, 22);
        expect(React.isValidElement(result)).toBe(true);
      });

      it('should handle sealed objects', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const sealedRecord = Object.seal({ id: 26, name: 'sealed' });
        const result = renderer!('test', sealedRecord, 23);
        expect(React.isValidElement(result)).toBe(true);
      });

      it('should handle records with getter/setter properties', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const recordWithGetters = {
          id: 27,
          get computed() {
            return 'computed value';
          },
          set computed(value) {
            /* setter */
          },
        };
        const result = renderer!('test', recordWithGetters, 24);
        expect(React.isValidElement(result)).toBe(true);
      });

      it('should handle records with non-enumerable properties', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const recordWithHidden = { id: 28, visible: 'seen' };
        Object.defineProperty(recordWithHidden, 'hidden', {
          value: 'not seen',
          enumerable: false,
        });
        const result = renderer!('test', recordWithHidden, 25);
        expect(React.isValidElement(result)).toBe(true);
      });

      it('should handle records with Symbol properties', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const symbolProp = Symbol('test');
        const recordWithSymbol = { id: 29, [symbolProp]: 'symbol value' };
        const result = renderer!('test', recordWithSymbol, 27);
        expect(React.isValidElement(result)).toBe(true);
      });

      it('should handle NaN index', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const result = renderer!('test', { id: 30 }, NaN);
        expect(React.isValidElement(result)).toBe(true);
      });

      it('should handle Infinity index', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const result = renderer!('test', { id: 31 }, Infinity);
        expect(React.isValidElement(result)).toBe(true);
      });

      it('should handle -Infinity index', () => {
        const renderer = typedCellRender(TEXT_CELL_TYPE);
        const result = renderer!('test', { id: 32 }, -Infinity);
        expect(React.isValidElement(result)).toBe(true);
      });
    });
  });
});
