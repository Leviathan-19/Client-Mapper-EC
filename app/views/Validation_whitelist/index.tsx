import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { AppState } from '../../hooks/useAppInit';
import { useValidationWhitelist } from './useValidationWhitelist';
import { styles } from './styles';

interface Props {
  appState: AppState;
  deviceId: string | null;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  checkDeviceStatus: () => Promise<void>;
}

export const ValidationWhitelist: React.FC<Props> = ({ appState, deviceId, setAppState, checkDeviceStatus }) => {
  const { requestAccess } = useValidationWhitelist(deviceId, setAppState);

  if (appState === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.statusText}>Verificando dispositivo...</Text>
      </View>
    );
  }

  if (appState === 'unregistered') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Dispositivo No Registrado</Text>
        <Text style={styles.statusText}>Este dispositivo no tiene permiso para acceder al sistema.</Text>
        <Text style={styles.infoText}>ID: {deviceId}</Text>
        
        <TouchableOpacity style={styles.button} onPress={requestAccess}>
          <Text style={styles.buttonText}>Solicitar Acceso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (appState === 'pending') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Solicitud Pendiente</Text>
        <Text style={styles.statusText}>Tu solicitud ha sido enviada. Por favor, espera a que un administrador apruebe este dispositivo.</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#6c757d' }]} onPress={checkDeviceStatus}>
          <Text style={styles.buttonText}>Actualizar Estado</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (appState === 'revoked') {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { color: '#dc3545' }]}>Acceso Revocado</Text>
        <Text style={styles.statusText}>El acceso para este dispositivo ha sido revocado. Contacta al administrador.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Error</Text>
      <Text style={styles.statusText}>Hubo un problema al verificar el dispositivo.</Text>
      <TouchableOpacity style={styles.button} onPress={checkDeviceStatus}>
        <Text style={styles.buttonText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );
};
