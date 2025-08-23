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

/**
 * 检查给定的 URL 是否为绝对 URL
 *
 * @param url - 需要检查的 URL 字符串
 * @returns boolean - 如果是绝对 URL 返回 true，否则返回 false
 */
export function isAbsoluteURL(url: string) {
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
}

/**
 * 将基础 URL 和相对 URL 组合成完整的 URL
 *
 * @param baseURL - 基础 URL
 * @param relativeURL - 相对 URL
 * @returns string - 组合后的完整 URL
 */
export function combineURLs(baseURL: string, relativeURL: string) {
  if (isAbsoluteURL(relativeURL)) {
    return relativeURL;
  }
  // 如果相对 URL 存在，则组合基础 URL 和相对 URL，否则返回基础 URL
  return relativeURL
    ? baseURL.replace(/\/?\/$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL;
}
