import { useState, useEffect } from 'react';
import { apiClient } from '../apiClient';

export function useAdminAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    apiClient
      .get<{ user_id: string; role: string }>('/auth/me')
      .then((me) => {
        setUserId(me.user_id);
        setIsAdmin(me.role === 'admin');
      })
      .catch(() => {
        setUserId(null);
        setIsAdmin(false);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return { userId, isAdmin, isLoading };
}
