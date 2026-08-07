import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SessionData {
  empresaId: string | null;
  usuarioId: string | null;
  userName: string | null;
  empresaNombre: string | null;
}

interface SessionContextType extends SessionData {
  setSession: (data: SessionData) => Promise<void>;
  clearSession: () => Promise<void>;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSessionState] = useState<SessionData>({ empresaId: null, usuarioId: null, userName: null, empresaNombre: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const empresaId = await AsyncStorage.getItem('@empresaId');
        const usuarioId = await AsyncStorage.getItem('@usuarioId');
        const userName = await AsyncStorage.getItem('@userName');
        const empresaNombre = await AsyncStorage.getItem('@empresaNombre');
        setSessionState({ empresaId, usuarioId, userName, empresaNombre });
      } catch (e) {
        console.error('Error loading session:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadSession();
  }, []);

  const setSession = async (data: SessionData) => {
    try {
      if (data.empresaId) await AsyncStorage.setItem('@empresaId', data.empresaId);
      if (data.usuarioId) await AsyncStorage.setItem('@usuarioId', data.usuarioId);
      if (data.userName) await AsyncStorage.setItem('@userName', data.userName);
      if (data.empresaNombre) await AsyncStorage.setItem('@empresaNombre', data.empresaNombre);
      setSessionState(data);
    } catch (e) {
      console.error('Error saving session:', e);
    }
  };

  const clearSession = async () => {
    try {
      await AsyncStorage.removeItem('@empresaId');
      await AsyncStorage.removeItem('@usuarioId');
      await AsyncStorage.removeItem('@userName');
      await AsyncStorage.removeItem('@empresaNombre');
      setSessionState({ empresaId: null, usuarioId: null, userName: null, empresaNombre: null });
    } catch (e) {
      console.error('Error clearing session:', e);
    }
  };

  return (
    <SessionContext.Provider value={{ ...session, setSession, clearSession, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
