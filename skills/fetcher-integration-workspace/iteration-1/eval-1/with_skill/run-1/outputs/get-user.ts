import { fetcher } from '@ahoo-wang/fetcher';

/**
 * Fetcher Integration Example:
 * GET /users/{id} with path param id=123 and query param include=profile
 */

interface User {
  id: number;
  name?: string;
  email?: string;
  profile?: Record<string, unknown>;
}

async function getUser(): Promise<User> {
  const response = await fetcher.get('/users/{id}', {
    urlParams: {
      path: { id: 123 },
      query: { include: 'profile' },
    },
  });

  // Extract JSON data with type safety
  const user = await response.json<User>();
  return user;
}

// Execute and log result
getUser()
  .then((user) => {
    console.log('User:', user);
  })
  .catch((error) => {
    console.error('Error:', error);
  });
