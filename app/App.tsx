import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './navigation/AppNavigator';
import { SessionProvider } from './context/SessionContext';

export default function App() {
  return (
    <SessionProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </SessionProvider>
  );
}
