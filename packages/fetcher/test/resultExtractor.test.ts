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

import { describe, it, expect, vi } from 'vitest';
import { FetchExchange } from '../src';
import { ResultExtractor, ResultExtractors } from '../src/resultExtractor';
import { Fetcher } from '../src';
import { FetchRequest } from '../src';

describe('ResultExtractor', () => {
  const mockFetcher = {} as Fetcher;
  const mockRequest = {} as FetchRequest;
  const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

  it('should define ResultExtractor interface', () => {
    // This test just verifies the interface is properly defined
    const extractor: ResultExtractor<any> = (exchange: FetchExchange) => exchange;
    expect(typeof extractor).toBe('function');
  });
});

describe('ResultExtractors', () => {
  const mockFetcher = {} as Fetcher;
  const mockRequest = {} as FetchRequest;
  const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
  const exchange = new FetchExchange(mockFetcher, mockRequest, mockResponse);

  it('should export Exchange result extractor', () => {
    expect(ResultExtractors).toHaveProperty('Exchange');
  });

  it('should export Response result extractor', () => {
    expect(ResultExtractors).toHaveProperty('Response');
  });

  it('should export Json result extractor', () => {
    expect(ResultExtractors).toHaveProperty('Json');
  });

  it('should export Text result extractor', () => {
    expect(ResultExtractors).toHaveProperty('Text');
  });

  it('Exchange extractor should return the original exchange', () => {
    const result = ResultExtractors.Exchange(exchange);
    expect(result).toBe(exchange);
  });

  it('Response extractor should return the response from exchange', () => {
    const result = ResultExtractors.Response(exchange);
    expect(result).toBe(mockResponse);
  });

  it('Json extractor should return a promise that resolves to parsed JSON', async () => {
    const jsonSpy = vi.spyOn(mockResponse, 'json').mockResolvedValue({ data: 'test' });
    const resultPromise = ResultExtractors.Json(exchange);
    expect(resultPromise).toBeInstanceOf(Promise);

    const result = await resultPromise;
    expect(result).toEqual({ data: 'test' });
    expect(jsonSpy).toHaveBeenCalled();
  });

  it('Text extractor should return a promise that resolves to response text', async () => {
    const textSpy = vi.spyOn(mockResponse, 'text').mockResolvedValue('test text');
    const resultPromise = ResultExtractors.Text(exchange);
    expect(resultPromise).toBeInstanceOf(Promise);

    const result = await resultPromise;
    expect(result).toBe('test text');
    expect(textSpy).toHaveBeenCalled();
  });
});