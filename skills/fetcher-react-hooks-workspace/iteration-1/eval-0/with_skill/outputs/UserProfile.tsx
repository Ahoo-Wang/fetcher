import React from 'react';
import { useFetcher } from '@ahoo-wang/fetcher-react';

interface UserProfileProps {
  userId: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  // Add other user fields as needed
}

export function UserProfile({ userId }: UserProfileProps) {
  const { loading, result, error, execute, abort } = useFetcher<User>({
    onAbort: () => console.log('Fetch was aborted'),
  });

  React.useEffect(() => {
    // Fetch user data when component mounts or userId changes
    execute({
      url: `/api/users/${userId}`,
      method: 'GET',
    });

    // Cleanup: abort request on unmount
    return () => {
      abort();
    };
  }, [userId, execute, abort]);

  if (loading) {
    return (
      <div className="user-profile-loading">
        <span>Loading user data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-profile-error">
        <span>Error loading user: {error.message}</span>
        <button onClick={() => execute({ url: `/api/users/${userId}`, method: 'GET' })}>
          Retry
        </button>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="user-profile-empty">
        <span>No user data available</span>
      </div>
    );
  }

  return (
    <div className="user-profile">
      <h1>{result.name}</h1>
      <p>Email: {result.email}</p>
      {/* Render other user fields */}
    </div>
  );
}

export default UserProfile;
