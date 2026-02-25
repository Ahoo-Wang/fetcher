import { Locale } from './Locale';
import zh_CN from './zh_CN';
import { useCallback, useState } from 'react';

const DEFAULT_LOCALE: Locale = zh_CN;

export interface UseLocaleReturn {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export function useLocale(): UseLocaleReturn {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  const setLocaleFn = useCallback(
    (localeValue: Locale) => {
      setLocale(mergeWithAssign(DEFAULT_LOCALE, localeValue));
    },
    [setLocale],
  );

  return {
    locale,
    setLocale: setLocaleFn,
  };
}

/**
 * 基于Object.assign()实现合并：后者非undefined属性替换前者，否则保留前者
 * @param target 原始对象
 * @param source 覆盖对象
 * @returns 合并后的新对象（不修改原对象）
 */
function mergeWithAssign<
  T extends Record<string, any>,
  U extends Record<string, any>,
>(target: T, source: U): T & U {
  // 关键步骤：过滤source中值为undefined的属性
  const filteredSource = Object.fromEntries(
    // Object.entries把对象转成[key, value]数组，再过滤掉value=undefined的项
    Object.entries(source).filter(([, value]) => value !== undefined),
  );

  // 先用Object.assign复制target的副本，再合并过滤后的source（避免修改原对象）
  return Object.assign({}, target, filteredSource) as T & U;
}
