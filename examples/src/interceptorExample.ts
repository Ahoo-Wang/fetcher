import { Fetcher, FetchExchange, Interceptor } from '@ahoo-wang/fetcher';
import { showLoading, updateOutput } from './basicGetExample';

// Create a Fetcher instance
const fetcher = new Fetcher({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 5000,
});

// Interceptor Example
export function initInterceptorExample(): void {
  const interceptorBtn = document.getElementById('interceptorBtn');
  const interceptorClearBtn = document.getElementById('interceptorClearBtn');

  if (interceptorBtn) {
    interceptorBtn.addEventListener('click', async () => {
      const outputId = 'interceptorOutput';
      showLoading(outputId);

      // Add request interceptor
      const requestInterceptorId = fetcher.interceptors.request.use({
        intercept(exchange: FetchExchange) {
          exchange.request = {
            ...exchange.request,
            headers: {
              ...exchange.request.headers,
              'X-Custom-Header': 'Added by interceptor',
            },
          };
          return exchange;
        },
      } as Interceptor);

      try {
        const response: Response = await fetcher.get('/posts/1');
        const data = await response.json();
        updateOutput(
          outputId,
          `Request completed with custom header\n\n${JSON.stringify(data, null, 2)}`,
          'success',
        );
      } catch (error: any) {
        updateOutput(outputId, `Error: ${error.message}`, 'error');
      } finally {
        // Remove interceptor
        fetcher.interceptors.request.eject(requestInterceptorId);
      }
    });
  }

  if (interceptorClearBtn) {
    interceptorClearBtn.addEventListener('click', () => {
      updateOutput(
        'interceptorOutput',
        'Click "Fetch with Interceptor" to run the example',
      );
    });
  }
}
