import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: useEffect started');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user); // Log user state
      setUser(user);
      setLoading(false);
      console.log('Loading set to false, user:', user);
    });

    return () => unsubscribe();
  }, []);

  console.log('AuthProvider: Rendering', { user: user ? 'User exists' : 'No user', loading });

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  console.log('useAuth called:', { user: context.user ? 'User exists' : 'No user', loading: context.loading });
  return context;
};
