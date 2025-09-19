import { describe, it, expect, vi } from 'vitest';
import {
  ExchangeResultExtractor,
  JsonResultExtractor,
  ResponseResultExtractor,
  TextResultExtractor,
} from '@ahoo-wang/fetcher';
import {
  EventStreamResultExtractor,
  JsonEventStreamResultExtractor,
} from '@ahoo-wang/fetcher-eventstream';
import { ResultExtractors } from '../src';

describe('ResultExtractors', () => {
  it('should contain all expected result extractors', () => {
    expect(ResultExtractors.Exchange).toBe(ExchangeResultExtractor);
    expect(ResultExtractors.Response).toBe(ResponseResultExtractor);
    expect(ResultExtractors.Json).toBe(JsonResultExtractor);
    expect(ResultExtractors.Text).toBe(TextResultExtractor);
    expect(ResultExtractors.EventStream).toBe(EventStreamResultExtractor);
    expect(ResultExtractors.JsonEventStream).toBe(
      JsonEventStreamResultExtractor,
    );
    expect(ResultExtractors.DEFAULT).toBe(JsonResultExtractor);
  });
});
