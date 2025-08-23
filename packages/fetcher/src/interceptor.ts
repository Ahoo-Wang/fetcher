import { FetcherRequest } from './fetcher';

/**
 * 拦截器接口，定义了拦截器的基本结构
 * @template T - 拦截器处理的数据类型
 */
export interface Interceptor<T> {
  /**
   * 拦截并处理数据
   * @param data - 需要处理的数据
   * @returns 处理后的数据，可以是同步或异步返回
   */
  intercept(data: T): T | Promise<T>;
}

/**
 * 请求拦截器接口，专门用于处理请求数据
 */
export interface RequestInterceptor extends Interceptor<FetcherRequest> {}

/**
 * 响应拦截器接口，专门用于处理响应数据
 */
export interface ResponseInterceptor extends Interceptor<Response> {}

/**
 * 错误拦截器接口，专门用于处理错误数据
 */
export interface ErrorInterceptor extends Interceptor<any> {}

/**
 * 拦截器管理器类，用于管理同一类型的多个拦截器
 * @template R - 拦截器处理的数据类型
 * @template T - 拦截器类型
 */
export class InterceptorManager<R, T extends Interceptor<R>>
  implements Interceptor<R>
{
  private interceptors: Array<T | null> = [];

  /**
   * 添加拦截器到管理器中
   * @param interceptor - 要添加的拦截器
   * @returns 拦截器在管理器中的索引位置
   */
  use(interceptor: T): number {
    const index = this.interceptors.length;
    this.interceptors.push(interceptor);
    return index;
  }

  /**
   * 根据索引移除拦截器
   * @param index - 要移除的拦截器索引
   */
  eject(index: number): void {
    if (this.interceptors[index]) {
      this.interceptors[index] = null;
    }
  }

  /**
   * 清空所有拦截器
   */
  clear(): void {
    this.interceptors = [];
  }

  /**
   * 依次执行所有拦截器对数据的处理
   * @param data - 需要处理的数据
   * @returns 经过所有拦截器处理后的数据
   */
  async intercept(data: R): Promise<R> {
    let processedData = data;
    for (let interceptor of this.interceptors) {
      if (interceptor) {
        // 每个拦截器处理前一个拦截器的输出结果
        processedData = await interceptor.intercept(processedData);
      }
    }
    return processedData;
  }
}

/**
 * 请求拦截器管理器类型定义
 */
export type RequestInterceptorManager = InterceptorManager<
  FetcherRequest,
  RequestInterceptor
>;

/**
 * 响应拦截器管理器类型定义
 */
export type ResponseInterceptorManager = InterceptorManager<
  Response,
  ResponseInterceptor
>;

/**
 * 错误拦截器管理器类型定义
 */
export type ErrorInterceptorManager = InterceptorManager<any, ErrorInterceptor>;

/**
 * Fetcher拦截器集合类，包含请求、响应和错误拦截器管理器
 */
export class FetcherInterceptors {
  /**
   * 请求拦截器管理器
   */
  request: RequestInterceptorManager = new InterceptorManager<
    FetcherRequest,
    RequestInterceptor
  >();

  /**
   * 响应拦截器管理器
   */
  response: ResponseInterceptorManager = new InterceptorManager<
    Response,
    ResponseInterceptor
  >();

  /**
   * 错误拦截器管理器
   */
  error: ErrorInterceptorManager = new InterceptorManager<
    any,
    ErrorInterceptor
  >();
}
