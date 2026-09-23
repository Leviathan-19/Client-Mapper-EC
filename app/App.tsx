import 'react-native-get-random-values';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { PowerSyncContext } from '@powersync/react-native';
import { powerSync } from './powerSync';
import { AppNavigator } from './navigation/AppNavigator';
import { SessionProvider } from './context/SessionContext';
import { ThemeProvider, useAppTheme } from './context/ThemeContext';
import { requestNotificationPermissions } from './notifications/NotificationManager';

import { ConnectivityProvider } from './context/ConnectivityContext';

function AppContent() {
  const { isDarkMode, colors } = useAppTheme();

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

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
      <ConnectivityProvider>
        <ThemeProvider>
          <SessionProvider>
            <AppContent />
          </SessionProvider>
        </ThemeProvider>
      </ConnectivityProvider>
    </PowerSyncContext.Provider>
  );
}
