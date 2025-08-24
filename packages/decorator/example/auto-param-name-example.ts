/*
 * Example demonstrating automatic parameter name extraction
 *
 * This example shows how the decorator package can automatically extract
 * parameter names from function signatures, eliminating the need to
 * manually specify parameter names in most cases.
 */

import {
  api,
  get,
  post,
  path,
  query,
  body,
  header,
} from '@ahoo-wang/fetcher-decorator';
import { fetcherRegistrar, Fetcher } from '@ahoo-wang/fetcher';

// Register a default fetcher
fetcherRegistrar.register(
  'default',
  new Fetcher({ baseURL: 'https://api.example.com' }),
);

/**
 * User Service demonstrating automatic parameter name extraction
 */
@api('/users')
class UserService {
  /**
   * Get a user by ID
   *
   * Before: @get('/{id}') getUser(@path('id') id: number)
   * After:  @get('/{id}') getUser(@path() id: number)
   *
   * The parameter name is automatically extracted from the function signature!
   */
  @get('/{id}')
  getUser(@path() id: number) {
    // Implementation will be generated automatically
    throw new Error('Implementation will be generated automatically.');
  }

  /**
   * Get users with pagination and filtering
   *
   * All parameter names are automatically extracted:
   * - limit from function parameter name
   * - offset from function parameter name
   * - filter from function parameter name
   */
  @get('/')
  getUsers(
    @query() limit: number = 10,
    @query() offset: number = 0,
    @query() filter: string = '',
  ) {
    throw new Error('Implementation will be generated automatically.');
  }

  /**
   * Create a new user
   *
   * Mixed approach - some automatic, some manual:
   * - userId parameter name is automatically extracted
   * - X-Request-ID header name is manually specified
   */
  @post('/')
  createUser(
    @body() userData: UserData,
    @header() authorization: string, // Automatically named "authorization"
    @header('X-Request-ID') requestId: string, // Manually named
  ) {
    throw new Error('Implementation will be generated automatically.');
  }

  /**
   * Get user posts with automatic parameter naming
   */
  @get('/{userId}/posts/{postId}')
  getUserPost(
    @path() userId: number, // Automatically named from parameter
    @path() postId: number, // Automatically named from parameter
    @query() includeComments: boolean = false, // Automatically named
  ) {
    throw new Error('Implementation will be generated automatically.');
  }
}

// Example usage
interface UserData {
  name: string;
  email: string;
  age: number;
}

// Usage example (this would normally be in application code)
async function example() {
  const userService = new UserService();

  // These calls will automatically use the correct parameter names
  try {
    // GET /users/123
    const user = await userService.getUser(123);

    // GET /users?limit=20&offset=0&filter=john
    const users = await userService.getUsers(20, 0, 'john');

    // POST /users with body and headers
    const newUser = await userService.createUser(
      { name: 'John Doe', email: 'john@example.com', age: 30 },
      'Bearer token123',
      'req-456',
    );

    // GET /users/123/posts/456?includeComments=true
    const post = await userService.getUserPost(123, 456, true);

    console.log('All requests completed successfully!');
  } catch (error) {
    console.error('Request failed:', error);
  }
}

// Run the example
example().catch(console.error);
