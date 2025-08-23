import { CoSecOptions, ResponseCodes } from './types';
import { FetchExchange, Interceptor } from '@ahoo-wang/fetcher';

/**
 * CoSec Response Interceptor
 *
 * Handles automatic token refresh based on response codes
 */
export class CoSecResponseInterceptor implements Interceptor {
  private options: CoSecOptions;

  constructor(options: CoSecOptions) {
    this.options = options;
  }

  async intercept(exchange: FetchExchange): Promise<FetchExchange> {
    const response = exchange.response;
    if (!response) {
      return exchange;
    }
    if (response.status !== ResponseCodes.UNAUTHORIZED) {
      return exchange;
    }
    const currentToken = this.options.tokenStorage.get();
    if (!currentToken) {
      return exchange;
    }
    try {
      const newToken = await this.options.tokenRefresher.refresh(currentToken);
      this.options.tokenStorage.set(newToken);
      return exchange.fetcher.request(exchange.url, exchange.request);
    } catch (error) {
      // If token refresh fails, clear stored tokens and re-throw the error
      this.options.tokenStorage.clear();
      throw error;
    }
  }
}
