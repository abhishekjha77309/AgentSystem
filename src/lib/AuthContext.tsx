import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  logOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock user automatically logs in
    const mockUser = {
      uid: 'local-dev-user-id',
      email: 'dev@local.host',
      displayName: 'Local Dev',
      photoURL: null
    };
    
    // Slight artificial delay to simulate initial boot
    const timer = setTimeout(() => {
      setUser(mockUser);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const signIn = async () => {
    setUser({
      uid: 'local-dev-user-id',
      email: 'dev@local.host',
      displayName: 'Local Dev',
      photoURL: null
    });
  };
  
  const logOut = async () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
