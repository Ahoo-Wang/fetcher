import { describe, it, expect } from 'vitest';
import { UrlBuilder } from '../src';

describe('UrlBuilder', () => {
  it('should build URL with base URL only', () => {
    const urlBuilder = new UrlBuilder('https://api.example.com');
    const url = urlBuilder.build('');
    expect(url).toBe('https://api.example.com');
  });

  it('should build URL with path', () => {
    const urlBuilder = new UrlBuilder('https://api.example.com');
    const url = urlBuilder.build('/users');
    expect(url).toBe('https://api.example.com/users');
  });

  it('should build URL with path parameters', () => {
    const urlBuilder = new UrlBuilder('https://api.example.com');
    const url = urlBuilder.build('/users/{id}', { id: 123 });
    expect(url).toBe('https://api.example.com/users/123');
  });

  it('should build URL with query parameters', () => {
    const urlBuilder = new UrlBuilder('https://api.example.com');
    const url = urlBuilder.build('/users', undefined, {
      filter: 'active',
      page: '1',
    });
    expect(url).toBe('https://api.example.com/users?filter=active&page=1');
  });

  it('should build URL with path parameters and query parameters', () => {
    const urlBuilder = new UrlBuilder('https://api.example.com');
    const url = urlBuilder.build(
      '/users/{id}',
      { id: 123 },
      { filter: 'active' },
    );
    expect(url).toBe('https://api.example.com/users/123?filter=active');
  });

  it('should throw error when missing required path parameter', () => {
    const urlBuilder = new UrlBuilder('https://api.example.com');
    expect(() => urlBuilder.build('/users/{id}', {})).toThrow(
      'Missing required path parameter: id',
    );
  });

  it('should handle absolute URLs correctly', () => {
    const urlBuilder = new UrlBuilder('https://api.example.com');
    const url = urlBuilder.build('http://other.com/users');
    expect(url).toBe('http://other.com/users');
  });
});
