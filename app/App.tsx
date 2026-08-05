import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { useAppInit } from './hooks/useAppInit';
import { ValidationWhitelist } from './views/Validation_whitelist';
import { CheckSync } from './views/Check_sync';
import { MainMenu } from './views/Main_menu';

export default function App() {
  const { appState, setAppState, deviceId, checkDeviceStatus } = useAppInit();

  if (appState === 'main_menu') {
    return (
      <>
        <MainMenu />
        <StatusBar style="auto" />
      </>
    );
  }

  if (appState === 'active') {
    return (
      <>
        <CheckSync deviceId={deviceId} setAppState={setAppState} />
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
