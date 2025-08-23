import {Fetcher} from '@ahoo-wang/fetcher';
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
        tokenStorage.storeTokens('initial-access-token', 'initial-refresh-token');

        const response = await fetcher.get('/protected-resource');
        const data = await response.json();
        console.log('Response:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Export for potential reuse
export {makeAuthenticatedRequest};

// Default export
export default makeAuthenticatedRequest;
