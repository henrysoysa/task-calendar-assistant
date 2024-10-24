import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

interface AuthContextType {
  userId: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ userId: null, loading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded) {
      if (user) {
        setUserId(user.id);
        console.log("User authenticated, redirecting to calendar view", user.id);
      } else {
        setUserId(null);
      }
    }
  }, [user, isLoaded, router]);

  return (
    <AuthContext.Provider value={{ userId, loading: !isLoaded }}>
      {children}
    </AuthContext.Provider>
  );
};

// Rename the custom hook to avoid conflict with Clerk's useAuth
export const useAuthContext = () => useContext(AuthContext);
