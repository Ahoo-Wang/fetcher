import { Fetcher } from '@ahoo-wang/fetcher';
import { updateOutput, showLoading } from './basicGetExample';

// Create a Fetcher instance
const fetcher = new Fetcher({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 5000,
});

// Query Parameters Example
export function initQueryParamExample(): void {
  const queryParamBtn = document.getElementById('queryParamBtn');
  const queryParamClearBtn = document.getElementById('queryParamClearBtn');
  const queryUserIdInput = document.getElementById(
    'queryUserIdInput',
  ) as HTMLInputElement | null;

  if (queryParamBtn && queryUserIdInput) {
    queryParamBtn.addEventListener('click', async () => {
      const outputId = 'queryParamOutput';
      const userId = queryUserIdInput.value;
      showLoading(outputId);

      try {
        const response: Response = await fetcher.get('/posts', {
          queryParams: { userId: userId },
        });
        const data = await response.json();
        updateOutput(
          outputId,
          `Found ${data.length} posts for user ${userId}\n\n${JSON.stringify(data.slice(0, 3), null, 2)}${data.length > 3 ? '\n\n...' : ''}`,
          'success',
        );
      } catch (error: any) {
        updateOutput(outputId, `Error: ${error.message}`, 'error');
      }
    });
  }

  if (queryParamClearBtn) {
    queryParamClearBtn.addEventListener('click', () => {
      updateOutput(
        'queryParamOutput',
        'Click "Filter Posts" to run the example',
      );
    });
  }
}
