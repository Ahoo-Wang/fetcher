import { Fetcher } from '@ahoo-wang/fetcher';

// Create a Fetcher instance
const fetcher = new Fetcher({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 5000,
});

// Helper function to update output
export function updateOutput(
  elementId: string,
  content: string,
  className: string = '',
): void {
  const outputElement = document.getElementById(elementId);
  if (outputElement) {
    outputElement.textContent = content;
    outputElement.className = `output ${className}`;
  }
}

// Helper function to show loading state
export function showLoading(elementId: string): void {
  updateOutput(elementId, 'Loading...', 'loading');
}

// Basic GET Request Example
export function initBasicGetExample(): void {
  const basicGetBtn = document.getElementById('basicGetBtn');
  const basicGetClearBtn = document.getElementById('basicGetClearBtn');

  if (basicGetBtn) {
    basicGetBtn.addEventListener('click', async () => {
      const outputId = 'basicGetOutput';
      showLoading(outputId);

      try {
        const response: Response = await fetcher.get('/posts/1');
        const data = await response.json();
        updateOutput(outputId, JSON.stringify(data, null, 2), 'success');
      } catch (error: any) {
        updateOutput(outputId, `Error: ${error.message}`, 'error');
      }
    });
  }

  if (basicGetClearBtn) {
    basicGetClearBtn.addEventListener('click', () => {
      updateOutput(
        'basicGetOutput',
        'Click "Fetch Post #1" to run the example',
      );
    });
  }
}
