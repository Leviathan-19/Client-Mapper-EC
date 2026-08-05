import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { useAppInit } from './hooks/useAppInit';
import { ValidationWhitelist } from './views/Validation_whitelist';
import { CheckSync } from './views/Check_sync';

export default function App() {
  const { appState, setAppState, deviceId, checkDeviceStatus } = useAppInit();

  if (appState === 'active') {
    return (
      <>
        <CheckSync deviceId={deviceId} />
        <StatusBar style="auto" />
      </>
    );
  }

  return (
    <>
      <ValidationWhitelist 
        appState={appState} 
        deviceId={deviceId} 
        setAppState={setAppState} 
        checkDeviceStatus={checkDeviceStatus} 
      />
      <StatusBar style="auto" />
    </>
  );
}
