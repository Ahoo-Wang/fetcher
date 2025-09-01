import { describe, it, expect } from 'vitest';
import {
  expressUrlTemplateResolver,
  getUrlTemplateResolver,
  uriTemplateResolver,
  UrlTemplatePathStyle,
} from '../src';

describe('getUrlTemplateResolver', () => {
  it('should return uriTemplateResolver when no style is provided', () => {
    const resolver = getUrlTemplateResolver();
    expect(resolver).toBe(uriTemplateResolver);
  });

  it('should return uriTemplateResolver when UriTemplate style is provided', () => {
    const resolver = getUrlTemplateResolver(UrlTemplatePathStyle.UriTemplate);
    expect(resolver).toBe(uriTemplateResolver);
  });

  it('should return expressUrlTemplateResolver when Express style is provided', () => {
    const resolver = getUrlTemplateResolver(UrlTemplatePathStyle.Express);
    expect(resolver).toBe(expressUrlTemplateResolver);
  });
});

describe('UrlTemplatePathStyle', () => {
  it('should define UriTemplate enum value', () => {
    expect(UrlTemplatePathStyle.UriTemplate).toBe(0);
  });

  it('should define Express enum value', () => {
    expect(UrlTemplatePathStyle.Express).toBe(1);
  });

  it('should have correct enum length', () => {
    expect(Object.keys(UrlTemplatePathStyle).length).toBe(4); // 2 values + 2 reverse mappings
  });
});

describe('UriTemplateResolver', () => {

  describe('extractPathParams', () => {
    it('should extract single path parameter from URL template', () => {
      const result = uriTemplateResolver.extractPathParams('/users/{id}');
      expect(result).toEqual(['id']);
    });

    it('should extract multiple path parameters from URL template', () => {
      const result = uriTemplateResolver.extractPathParams('/users/{id}/posts/{postId}');
      expect(result).toEqual(['id', 'postId']);
    });

    it('should return empty array when no path parameters exist', () => {
      const result = uriTemplateResolver.extractPathParams('/users/profile');
      expect(result).toEqual([]);
    });

    it('should extract path parameters with special characters', () => {
      const result = uriTemplateResolver.extractPathParams('/{category-name}/{sub_category}');
      expect(result).toEqual(['category-name', 'sub_category']);
    });

    it('should extract path parameters from full URLs', () => {
      const result = uriTemplateResolver.extractPathParams('https://api.example.com/{resource}/{id}');
      expect(result).toEqual(['resource', 'id']);
    });
  });

  describe('resolve', () => {
    it('should replace path parameters with values', () => {
      const result = uriTemplateResolver.resolve('/users/{id}/posts/{postId}', { id: 123, postId: 456 });
      expect(result).toBe('/users/123/posts/456');
    });

    it('should handle string parameter values', () => {
      const result = uriTemplateResolver.resolve('/users/{username}', { username: 'john_doe' });
      expect(result).toBe('/users/john_doe');
    });

    it('should URL encode parameter values', () => {
      const result = uriTemplateResolver.resolve('/search/{query}', { query: 'hello world' });
      expect(result).toBe('/search/hello%20world');
    });

    it('should return original URL when pathParams is null', () => {
      const result = uriTemplateResolver.resolve('/users/{id}', null);
      expect(result).toBe('/users/{id}');
    });

    it('should return original URL when pathParams is undefined', () => {
      const result = uriTemplateResolver.resolve('/users/{id}', undefined);
      expect(result).toBe('/users/{id}');
    });

    it('should throw error when required path parameter is missing', () => {
      expect(() => {
        uriTemplateResolver.resolve('/users/{id}', { name: 'john' });
      }).toThrow('Missing required path parameter: id');
    });

    it('should handle parameter value of 0', () => {
      const result = uriTemplateResolver.resolve('/users/{id}', { id: 0 });
      expect(result).toBe('/users/0');
    });

    it('should handle parameter value of empty string', () => {
      const result = uriTemplateResolver.resolve('/users/{id}', { id: '' });
      expect(result).toBe('/users/');
    });

    it('should throw error when pathParams is empty object but URL has parameters', () => {
      expect(() => {
        uriTemplateResolver.resolve('/users/{id}', {});
      }).toThrow('Missing required path parameter: id');
    });
  });
});

describe('ExpressUrlTemplateResolver', () => {

  describe('extractPathParams', () => {
    it('should extract single path parameter from Express-style URL template', () => {
      const result = expressUrlTemplateResolver.extractPathParams('/users/:id');
      expect(result).toEqual(['id']);
    });

    it('should extract multiple path parameters from Express-style URL template', () => {
      const result = expressUrlTemplateResolver.extractPathParams('/users/:id/posts/:postId');
      expect(result).toEqual(['id', 'postId']);
    });

    it('should return empty array when no path parameters exist', () => {
      const result = expressUrlTemplateResolver.extractPathParams('/users/profile');
      expect(result).toEqual([]);
    });
  });

  describe('resolve', () => {
    it('should replace path parameters with values in Express-style templates', () => {
      const result = expressUrlTemplateResolver.resolve('/users/:id/posts/:postId', { id: 123, postId: 456 });
      expect(result).toBe('/users/123/posts/456');
    });

    it('should throw error when required path parameter is missing in Express-style template', () => {
      expect(() => {
        expressUrlTemplateResolver.resolve('/users/:id', { name: 'john' });
      }).toThrow('Missing required path parameter: id');
    });
  });
});