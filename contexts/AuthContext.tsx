import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useSignIn } from '@clerk/nextjs';

interface AuthContextType {
  userId: string | null;
  loading: boolean;
  login: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ userId: null, loading: true, login: async () => {} });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoaded } = useUser();
  const { signIn } = useSignIn();
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

  const login = async () => {
    try {
      await signIn();
      console.log("User signed in successfully");
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ userId, loading: !isLoaded, login }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
