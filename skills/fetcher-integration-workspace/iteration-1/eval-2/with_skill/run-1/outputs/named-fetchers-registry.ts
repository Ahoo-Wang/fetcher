/**
 * Named Fetcher Registry Pattern
 *
 * This example demonstrates creating multiple named fetchers for different services
 * (auth, api, files) and retrieving them from the registry.
 */

import { NamedFetcher, fetcherRegistrar } from '@ahoo-wang/fetcher';

// ---------------------------------------------------------------------------
// 1. Create named fetchers for different services
// ---------------------------------------------------------------------------

// Auth service fetcher - handles authentication endpoints
new NamedFetcher('auth', {
  baseURL: 'https://auth.example.com',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API service fetcher - handles main application API
new NamedFetcher('api', {
  baseURL: 'https://api.example.com/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Files service fetcher - handles file upload/download with longer timeout
new NamedFetcher('files', {
  baseURL: 'https://files.example.com',
  timeout: 60000, // 60 seconds for large file transfers
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// ---------------------------------------------------------------------------
// 2. Add interceptors to named fetchers
// ---------------------------------------------------------------------------

// Get the auth fetcher and add a request interceptor
const authFetcher = fetcherRegistrar.requiredGet('auth');
authFetcher.interceptors.request.use({
  name: 'auth-token-interceptor',
  order: 100,
  intercept(exchange) {
    const token = localStorage.getItem('authToken');
    if (token) {
      exchange.request.headers.Authorization = `Bearer ${token}`;
    }
    return exchange;
  },
});

// Get the api fetcher and add logging interceptors
const apiFetcher = fetcherRegistrar.requiredGet('api');
apiFetcher.interceptors.request.use({
  name: 'api-request-logger',
  order: 5,
  intercept(exchange) {
    console.log(`[API] ${exchange.request.method} ${exchange.request.url}`);
    return exchange;
  },
});
apiFetcher.interceptors.response.use({
  name: 'api-response-logger',
  order: 5,
  intercept(exchange) {
    console.log(`[API] Response: ${exchange.response?.status}`);
    return exchange;
  },
});

// Get the files fetcher and add progress tracking
const filesFetcher = fetcherRegistrar.requiredGet('files');
filesFetcher.interceptors.request.use({
  name: 'files-request-logger',
  order: 5,
  intercept(exchange) {
    console.log(`[FILES] Uploading to: ${exchange.request.url}`);
    return exchange;
  },
});

// ---------------------------------------------------------------------------
// 3. Retrieve fetchers from registry and use them
// ---------------------------------------------------------------------------

// Safe get - returns undefined if not found
function getApiFetcher() {
  const fetcher = fetcherRegistrar.get('api');
  if (\!fetcher) {
    throw new Error('API fetcher not registered');
  }
  return fetcher;
}

// Required get - throws error if not found
function getAuthFetcher() {
  return fetcherRegistrar.requiredGet('auth');
}

// Example: Auth service - login
async function login(username: string, password: string) {
  const fetcher = getAuthFetcher();
  const response = await fetcher.post('/login', {
    body: { username, password },
  });
  const data = await response.json<{ token: string; expiresIn: number }>();
  localStorage.setItem('authToken', data.token);
  return data;
}

// Example: Auth service - get current user
async function getCurrentUser() {
  const fetcher = getAuthFetcher();
  const response = await fetcher.get('/me');
  return response.json<{ id: string; name: string; email: string }>();
}

// Example: API service - get user profile
async function getUserProfile(userId: string) {
  const fetcher = getApiFetcher();
  const response = await fetcher.get('/users/{id}', {
    urlParams: { path: { id: userId } },
  });
  return response.json<{ id: string; name: string; bio: string }>();
}

// Example: API service - list posts with query params
async function listPosts(page = 1, limit = 10) {
  const fetcher = getApiFetcher();
  const response = await fetcher.get('/posts', {
    urlParams: { query: { page, limit, sort: 'createdAt' } },
  });
  return response.json<Array<{ id: string; title: string; content: string }>>();
}

// Example: Files service - upload file
async function uploadFile(file: File, folderId: string) {
  const fetcher = fetcherRegistrar.requiredGet('files');
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folderId', folderId);

  const response = await fetcher.post('/upload', {
    body: formData,
  });
  return response.json<{ fileId: string; url: string; size: number }>();
}

// Example: Files service - download file
async function downloadFile(fileId: string): Promise<Response> {
  const fetcher = fetcherRegistrar.requiredGet('files');
  return fetcher.get(`/files/{fileId}/download`, {
    urlParams: { path: { fileId } },
  });
}

// ---------------------------------------------------------------------------
// 4. Registry utility functions
// ---------------------------------------------------------------------------

// Check if a fetcher is registered
function isFetcherRegistered(name: string): boolean {
  return fetcherRegistrar.get(name) \!== undefined;
}

// List all registered fetcher names
function listRegisteredFetchers(): string[] {
  const knownFetchers = ['auth', 'api', 'files'];
  return knownFetchers.filter(isFetcherRegistered);
}

// ---------------------------------------------------------------------------
// 5. Usage demonstration
// ---------------------------------------------------------------------------

async function demonstrateRegistry() {
  console.log('Registered fetchers:', listRegisteredFetchers());

  // Safe retrieval pattern
  const maybeApiFetcher = fetcherRegistrar.get('api');
  if (maybeApiFetcher) {
    console.log('API fetcher baseURL:', maybeApiFetcher.config.baseURL);
  }

  // Required retrieval pattern (throws if not found)
  const filesFetcherInstance = fetcherRegistrar.requiredGet('files');
  console.log('Files fetcher timeout:', filesFetcherInstance.config.timeout);

  // Direct access via fetcherRegistrar.get()
  const authFetcherInstance = fetcherRegistrar.get('auth');
  if (authFetcherInstance) {
    console.log('Auth fetcher baseURL:', authFetcherInstance.config.baseURL);
  }
}

// Run demonstration
demonstrateRegistry();

// Export for external use
export {
  login,
  getCurrentUser,
  getUserProfile,
  listPosts,
  uploadFile,
  downloadFile,
  getApiFetcher,
  getAuthFetcher,
  isFetcherRegistered,
  listRegisteredFetchers,
};
