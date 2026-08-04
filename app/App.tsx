import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Platform, Alert } from 'react-native';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { supabase } from './supabaseClient';

type AppState = 'loading' | 'unregistered' | 'pending' | 'active' | 'revoked' | 'error';

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    checkDeviceStatus();
  }, []);

  const checkDeviceStatus = async () => {
    try {
      setAppState('loading');
      let id: string | null = null;

      if (Platform.OS === 'android') {
        id = Application.getAndroidId();
      } else if (Platform.OS === 'ios') {
        id = await Application.getIosIdForVendorAsync();
      }

      if (!id) {
        throw new Error('No se pudo obtener el ID del dispositivo');
      }

      setDeviceId(id);

      // Consultar estado en Supabase
      const { data, error } = await supabase
        .from('whitelist')
        .select('estado, usuario_id, usuarios(nombre)')
        .eq('device_id', id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setAppState('unregistered');
      } else {
        const dbEstado = data.estado;

        // Obtener nombre del usuario
        let nombre = 'Desconocido';
        if (data.usuarios && Array.isArray(data.usuarios) && data.usuarios.length > 0) {
          nombre = (data.usuarios[0] as any).nombre;
        } else if (data.usuario_id) {
          const { data: usr, error: usrErr, status: usrStatus } = await supabase
            .from('usuarios')
            .select('nombre')
            .eq('id', data.usuario_id)
            .maybeSingle();
          if (usrErr) {
            if (usrStatus === 42501) {
              console.error('❌ PERMISO NEGADO (RLS) al leer tabla usuarios');
            } else {
              console.error(`❌ Error al consultar usuarios (status ${usrStatus}):`, usrErr.message);
            }
          } else if (usr && (usr as any).nombre) {
            nombre = (usr as any).nombre;
          }
        }
        setUserName(nombre);

        if (dbEstado === 'activo') {
          setAppState('active');
        } else if (dbEstado === 'pendiente') {
          setAppState('pending');
        } else if (dbEstado === 'revocado') {
          setAppState('revoked');
        } else {
           setAppState('error');
        }
      }
    } catch (err: any) {
      console.error(err);
      setAppState('error');
      Alert.alert('Error', err.message || 'Error al conectar con el servidor');
    }
  };

  const requestAccess = async () => {
    if (!deviceId) return;
    try {
      setAppState('loading');
      
      const deviceName = `${Device.brand} ${Device.modelName}`;
      
      const { error } = await supabase
        .from('whitelist')
        .insert({
          device_id: deviceId,
          estado: 'pendiente',
          descripcion: deviceName
        });

      if (error) throw error;
      
      setAppState('pending');
    } catch (err: any) {
      console.error(err);
      setAppState('error');
      Alert.alert('Error', err.message || 'Error al solicitar acceso');
    }
  };

  // Renderizados según el estado
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

  if (appState === 'active') {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { color: '#28a745', textAlign: 'center' }]}>
          ¡Bienvenido{userName ? `, ${userName}` : ''}!
        </Text>
        <Text style={styles.statusText}>Dispositivo autorizado correctamente.</Text>
        <Text style={styles.infoText}>Aquí irá la pantalla principal con PowerSync.</Text>
        <StatusBar style="auto" />
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#343a40',
  },
  statusText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6c757d',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 12,
    color: '#adb5bd',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007bff',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
