import { Fetcher } from '@ahoo-wang/fetcher';

// Create a basic Fetcher instance
const fetcher = new Fetcher({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 5000,
});

// Basic GET request
fetcher
  .get('/posts/1')
  .then((response: Response) => response.json())
  .then((data: unknown) => {
    console.log('Basic GET request:', data);
  })
  .catch((error: unknown) => {
    console.error('Error:', error);
  });

// GET request with path parameters
fetcher
  .get('/posts/{id}', {
    pathParams: { id: 1 },
  })
  .then((response: Response) => response.json())
  .then((data: unknown) => {
    console.log('GET request with path params:', data);
  })
  .catch((error: unknown) => {
    console.error('Error:', error);
  });

// GET request with query parameters
fetcher
  .get('/posts', {
    queryParams: { userId: 1 },
  })
  .then((response: Response) => response.json())
  .then((data: unknown) => {
    console.log('GET request with query params:', data);
  })
  .catch((error: unknown) => {
    console.error('Error:', error);
  });
