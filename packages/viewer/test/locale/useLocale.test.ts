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

import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocale } from '../../src/locale/useLocale';
import zh_CN from '../../src/locale/zh_CN';
import { Locale } from '../../src/locale/Locale';

describe('useLocale', () => {
  describe('initialization', () => {
    it('should initialize with default locale (zh_CN)', () => {
      const { result } = renderHook(() => useLocale());

      expect(result.current.locale).toBe(zh_CN);
    });

    it('should have setLocale function', () => {
      const { result } = renderHook(() => useLocale());

      expect(result.current.setLocale).toBeDefined();
      expect(typeof result.current.setLocale).toBe('function');
    });
  });

  describe('setLocale', () => {
    it('should update locale when setLocale is called with new locale', () => {
      const { result } = renderHook(() => useLocale());

      const newLocale: Locale = {
        personalView: 'Personal View',
        sharedView: 'Shared View',
      };

      act(() => {
        result.current.setLocale(newLocale);
      });

      expect(result.current.locale.personalView).toBe('Personal View');
      expect(result.current.locale.sharedView).toBe('Shared View');
    });

    it('should merge partial locale with default values', () => {
      const { result } = renderHook(() => useLocale());

      const partialLocale: Locale = {
        selectedCountLabel: 'Selected',
      };

      act(() => {
        result.current.setLocale(partialLocale);
      });

      expect(result.current.locale.selectedCountLabel).toBe('Selected');
      expect(result.current.locale.personalView).toBe(zh_CN.personalView);
    });

    it('should preserve default values when undefined is provided', () => {
      const { result } = renderHook(() => useLocale());

      const localeWithUndefined: Locale = {
        personalView: undefined,
      };

      act(() => {
        result.current.setLocale(localeWithUndefined);
      });

      expect(result.current.locale.personalView).toBe(zh_CN.personalView);
    });
  });

  describe('mergeWithAssign', () => {
    it('should filter out undefined values from source', () => {
      const { result } = renderHook(() => useLocale());

      const localeWithUndefined: Locale = {
        personalView: 'Custom',
        sharedView: undefined,
      };

      act(() => {
        result.current.setLocale(localeWithUndefined);
      });

      expect(result.current.locale.personalView).toBe('Custom');
      expect(result.current.locale.sharedView).toBe(zh_CN.sharedView);
    });

    it('should not modify original default locale', () => {
      const { result } = renderHook(() => useLocale());

      const newLocale: Locale = {
        selectedCountLabel: 'Test',
      };

      const originalPersonalView = zh_CN.personalView;

      act(() => {
        result.current.setLocale(newLocale);
      });

      expect(zh_CN.personalView).toBe(originalPersonalView);
    });

    it('should return new object each time', () => {
      const { result } = renderHook(() => useLocale());

      const locale1: Locale = { personalView: 'View 1' };
      const locale2: Locale = { personalView: 'View 2' };

      act(() => {
        result.current.setLocale(locale1);
      });

      const firstResult = result.current.locale;

      act(() => {
        result.current.setLocale(locale2);
      });

      const secondResult = result.current.locale;

      expect(firstResult).not.toBe(secondResult);
    });
  });
});
