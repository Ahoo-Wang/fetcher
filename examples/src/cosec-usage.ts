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

import { Fetcher } from '@ahoo-wang/fetcher';
import {
  CoSecRequestInterceptor,
  CoSecResponseInterceptor,
  DeviceIdStorage,
  TokenStorage,
  CompositeToken,
} from '@ahoo-wang/fetcher-cosec';

// Create storage instances
const deviceIdStorage = new DeviceIdStorage();
const tokenStorage = new TokenStorage();

// Token refresher implementation
const tokenRefresher = {
  refresh: async (_token: CompositeToken): Promise<CompositeToken> => {
    // In a real application, you would make a request to refresh the token
    console.log('Refreshing token...');
    // Example: return await refreshAuthToken(token.refreshToken);
    return {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };
  },
};

// Create a Fetcher instance
const fetcher = new Fetcher({
  baseURL: 'https://api.example.com',
});

// Add CoSec request interceptor
fetcher.interceptors.request.use(
  new CoSecRequestInterceptor({
    appId: 'your-app-id',
    deviceIdStorage: deviceIdStorage,
    tokenStorage: tokenStorage,
    tokenRefresher: {
      refresh(token: CompositeToken): Promise<CompositeToken> {
        return Promise.reject('Token refresh failed');
      },
    },
  }),
);

// Add CoSec response interceptor
fetcher.interceptors.response.use(
  new CoSecResponseInterceptor({
    appId: 'your-app-id',
    deviceIdStorage: deviceIdStorage,
    tokenStorage: tokenStorage,
    tokenRefresher: tokenRefresher,
  }),
);

// Example usage
async function makeAuthenticatedRequest() {
  try {
    // Store some initial tokens for testing
    tokenStorage.setCompositeToken({
      accessToken: 'initial-access-token',
      refreshToken: 'initial-refresh-token',
    });

    const response = await fetcher.get('/protected-resource');
    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Export for potential reuse
export { makeAuthenticatedRequest };

// Default export
export default makeAuthenticatedRequest;
