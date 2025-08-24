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

import { combineURLs } from './urls';
import { BaseURLCapable } from './types';

/**
 * URL构建器类，用于构建带有路径参数和查询参数的完整URL
 *
 * @example
 * const urlBuilder = new UrlBuilder('https://api.example.com');
 * const url = urlBuilder.build('/users/{id}', { id: 123 }, { filter: 'active' });
 * // 结果: https://api.example.com/users/123?filter=active
 */
export class UrlBuilder implements BaseURLCapable {
  baseURL: string;

  /**
   * 创建UrlBuilder实例
   *
   * @param baseURL - 基础URL，所有构建的URL都将基于此URL
   */
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * 构建完整的URL，包括路径参数替换和查询参数添加
   *
   * @param url - 需要构建的URL路径
   * @param pathParams - 路径参数对象，用于替换URL中的占位符（如{id}）
   * @param queryParams - 查询参数对象，将被添加到URL查询字符串中
   * @returns 完整的URL字符串
   * @throws 当路径参数中缺少必需的占位符时抛出错误
   */
  build(
    url: string,
    pathParams?: Record<string, any>,
    queryParams?: Record<string, any>,
  ): string {
    const combinedURL = combineURLs(this.baseURL, url);
    let finalUrl = this.interpolateUrl(combinedURL, pathParams);
    if (queryParams) {
      const queryString = new URLSearchParams(queryParams).toString();
      if (queryString) {
        finalUrl += '?' + queryString;
      }
    }
    return finalUrl;
  }

  /**
   * 替换url中的占位符参数
   *
   * @param url - 包含占位符的路径字符串，如 "http://localhost/users/{id}/posts/{postId}"
   * @param pathParams - 路径参数对象，用于替换路径中的占位符
   * @returns 替换占位符后的路径字符串
   * @throws 当路径参数中缺少必需的占位符时抛出错误
   */
  interpolateUrl(url: string, pathParams?: Record<string, any>): string {
    if (!pathParams) return url;
    return url.replace(/{([^}]+)}/g, (_, key) => {
      const value = pathParams[key];
      // 如果路径参数未定义，抛出错误而不是保留原占位符
      if (value === undefined) {
        throw new Error(`Missing required path parameter: ${key}`);
      }
      return String(value);
    });
  }
}
