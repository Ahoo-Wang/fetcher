import {ResponseInterceptor} from '@ahoo-wang/fetcher';
import {CoSecOptions, ResponseCodes} from "./types";

/**
 * CoSec Response Interceptor
 *
 * Handles automatic token refresh based on response codes
 */
export class CoSecResponseInterceptor implements ResponseInterceptor {
    private options: CoSecOptions;

    constructor(options: CoSecOptions) {
        this.options = options;
    }

    /**
     * Intercept responses to handle token refresh
     */
    async intercept(response: Response): Promise<Response> {
        if (response.status !== ResponseCodes.UNAUTHORIZED) {
            return response;
        }
        const currentToken = this.options.tokenStorage.get();
        if (!currentToken) {
            return response
        }
        const newToken = await this.options.tokenRefresher.refresh(currentToken);
        this.options.tokenStorage.set(newToken);
        return response;
    }
}
