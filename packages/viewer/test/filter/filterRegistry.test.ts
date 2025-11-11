import { describe, it, expect } from 'vitest';
import { filterRegistry } from '../../src';

describe('filterRegistry', () => {
  it('should contain all standard filter types', () => {
    const expectedTypes = [
      'id',
      'text',
      'number',
      'select',
      'bool',
      'datetime',
    ];
    expect(filterRegistry.types).toEqual(expectedTypes);
  });

  it('should have correct size', () => {
    expect(filterRegistry.size).toBe(6);
  });

  it('should provide access to all filter components', () => {
    expect(filterRegistry.get('id')).toBeDefined();
    expect(filterRegistry.get('text')).toBeDefined();
    expect(filterRegistry.get('number')).toBeDefined();
    expect(filterRegistry.get('select')).toBeDefined();
    expect(filterRegistry.get('bool')).toBeDefined();
    expect(filterRegistry.get('datetime')).toBeDefined();
  });

  it('should return undefined for unknown filter type', () => {
    expect(filterRegistry.get('unknown')).toBeUndefined();
  });

});
