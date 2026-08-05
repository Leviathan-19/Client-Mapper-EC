import 'react-native-get-random-values';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { PowerSyncContext } from '@powersync/react-native';
import { powerSync } from './powerSync';
import { AppNavigator } from './navigation/AppNavigator';
import { SessionProvider } from './context/SessionContext';

export default function App() {
  return (
    <PowerSyncContext.Provider value={powerSync}>
      <SessionProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </SessionProvider>
    </PowerSyncContext.Provider>
  );
}
