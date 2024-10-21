import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, login: async () => {} });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    console.log("Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed", user);
      setUser(user);
      setLoading(false);
      if (user) {
        router.push('/'); // Redirect to home page when user is authenticated
      }
    });

    return () => unsubscribe();
  }, [router]);

  const login = async () => {
    console.log("Login function called");
    const provider = new GoogleAuthProvider();
    try {
      console.log("Attempting to sign in with popup");
      const result = await signInWithPopup(auth, provider);
      console.log("Sign in successful", result.user);
      const idToken = await result.user.getIdToken();
      
      console.log("Sending token to backend");
      console.log("token = ", idToken);
      const response = await fetch('/api/auth/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (response.ok) {
        console.log("Token verified successfully");
        router.push('/'); // Redirect to home page after successful token verification
      } else {
        console.error('Failed to create session');
      }
    } catch (error) {
      console.error('Error signing in with Google', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
