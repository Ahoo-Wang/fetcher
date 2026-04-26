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

export const tableLocale = {
  'zh-CN': {
    visibleFields: '已显示字段',
    hiddenFields: '未显示字段',
    fixedTip: '请将需要锁定的字段拖至上方（最多支持3列）',
  },
  'en-US': {
    visibleFields: 'Visible Fields',
    hiddenFields: 'Hidden Fields',
    fixedTip: 'Drag fields here to pin them (max 3 columns)',
  },
} as const;

type LocaleKey = keyof typeof tableLocale['en-US'];

export function t(key: LocaleKey, locale = 'zh-CN'): string {
  return (
    (tableLocale as any)[locale]?.[key] ??
    tableLocale['zh-CN'][key] ??
    key
  );
}
