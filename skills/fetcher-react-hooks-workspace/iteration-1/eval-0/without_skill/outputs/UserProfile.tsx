import React, { useState, useEffect } from 'react';

interface UserProfileProps {
  userId: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export function UserProfile({ userId }: UserProfileProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);
    setError(null);

    fetch(`/api/users/${userId}`, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(err => {
        if (err.name === 'AbortError') {
          console.log('Fetch was aborted');
        } else {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [userId]);

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
        <button onClick={() => {
          if (abortController) abortController.abort();
        }}>
          Retry
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="user-profile-empty">
        <span>No user data available</span>
      </div>
    );
  }

  return (
    <div className="user-profile">
      <h1>{user.name}</h1>
      <p>Email: {user.email}</p>
    </div>
  );
}

export default UserProfile;
