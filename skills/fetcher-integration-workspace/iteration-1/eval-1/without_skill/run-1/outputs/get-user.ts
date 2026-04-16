import { Fetcher } from '../../../../../packages/fetcher/src/index.ts';

/**
 * Makes a GET request to /users/{id} with:
 * - Path param: id=123
 * - Query param: include=profile
 * - Returns the JSON response
 */

interface User {
  id: number;
  name: string;
  profile?: {
    avatar?: string;
    bio?: string;
  };
}

async function getUser(): Promise<User> {
  const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

  const response = await fetcher.get<User>('/users/{id}', {
    urlParams: {
      path: { id: 123 },
      query: { include: 'profile' },
    },
  });

  // Parse JSON response
  const user: User = await response.json<User>();
  return user;
}

// Execute the request
getUser()
  .then((user) => {
    console.log('User retrieved:', user);
  })
  .catch((error) => {
    console.error('Failed to get user:', error);
  });

export { getUser, User };
