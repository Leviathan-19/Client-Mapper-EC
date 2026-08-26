import 'react-native-get-random-values';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { PowerSyncContext } from '@powersync/react-native';
import { powerSync } from './powerSync';
import { AppNavigator } from './navigation/AppNavigator';
import { SessionProvider } from './context/SessionContext';
import { ThemeProvider, useAppTheme } from './context/ThemeContext';

function AppContent() {
  const { isDarkMode, colors } = useAppTheme();

  return (
    <>
      <AppNavigator />
      <StatusBar
        style={isDarkMode ? 'light' : 'dark'}
        backgroundColor={colors.background}
      />
    </>
  );
}

export default function App() {
  return (
    <PowerSyncContext.Provider value={powerSync}>
      <ThemeProvider>
        <SessionProvider>
          <AppContent />
        </SessionProvider>
      </ThemeProvider>
    </PowerSyncContext.Provider>
  );
}
