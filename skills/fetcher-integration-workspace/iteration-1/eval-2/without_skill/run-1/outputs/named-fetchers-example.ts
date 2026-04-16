/**
 * Example: Creating and Managing Multiple Named Fetchers
 *
 * This example demonstrates how to create multiple named fetchers for different services
 * (auth, api, files) and how to retrieve them from the registry.
 */

import {
  NamedFetcher,
  fetcherRegistrar,
  fetcher,
} from '@ahoo-wang/fetcher';

/**
 * Create named fetchers for different services
 */

// Auth fetcher - handles authentication requests
const authFetcher = new NamedFetcher('auth', {
  baseURL: 'https://auth.example.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API fetcher - handles general API requests
const apiFetcher = new NamedFetcher('api', {
  baseURL: 'https://api.example.com',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Files fetcher - handles file upload/download requests with longer timeout
const filesFetcher = new NamedFetcher('files', {
  baseURL: 'https://files.example.com',
  timeout: 120000, // 2 minutes for large file uploads
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

/**
 * Retrieve fetchers from the registry
 */

// Get fetchers by name
const retrievedAuthFetcher = fetcherRegistrar.get('auth');
const retrievedApiFetcher = fetcherRegistrar.get('api');
const retrievedFilesFetcher = fetcherRegistrar.get('files');

// Get fetchers with requiredGet (throws if not found)
const requiredAuthFetcher = fetcherRegistrar.requiredGet('auth');

// Get the default fetcher
const defaultFetcher = fetcherRegistrar.default;

// Get all registered fetchers
const allFetchers = fetcherRegistrar.fetchers;
console.log('Registered fetcher names:', Array.from(allFetchers.keys()));
// Output: ['default', 'auth', 'api', 'files']

/**
 * Using the fetchers
 */

// Using auth fetcher
async function login(username: string, password: string) {
  const response = await authFetcher.post('/login', {
    body: JSON.stringify({ username, password }),
  });
  return response.json();
}

// Using API fetcher
async function getUsers() {
  const response = await apiFetcher.get('/users');
  return response.json();
}

// Using files fetcher
async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await filesFetcher.post('/upload', {
    body: formData,
  });
  return response.json();
}

// Using default fetcher
async function fetchData() {
  const response = await defaultFetcher.get('/data');
  return response.json();
}

/**
 * Verify fetchers are singletons (same instance returned)
 */
console.log('Auth fetcher is same instance:', authFetcher === retrievedAuthFetcher);
// Output: true

console.log('API fetcher is same instance:', apiFetcher === retrievedApiFetcher);
// Output: true

console.log('Files fetcher is same instance:', filesFetcher === retrievedFilesFetcher);
// Output: true

/**
 * Unregister a fetcher when no longer needed
 */
fetcherRegistrar.unregister('files');

const removedFetcher = fetcherRegistrar.get('files');
console.log('Files fetcher after unregister:', removedFetcher);
// Output: undefined

/**
 * Re-registering a fetcher with the same name replaces the existing one
 */
const newApiFetcher = new NamedFetcher('api', {
  baseURL: 'https://new-api.example.com',
  timeout: 15000,
});

const replacedFetcher = fetcherRegistrar.get('api');
console.log('API fetcher was replaced:', replacedFetcher \!== apiFetcher);
// Output: true
