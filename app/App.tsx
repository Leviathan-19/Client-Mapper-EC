import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Platform, Alert } from 'react-native';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { supabase } from './supabaseClient';
import { powerSync, startSync } from './powerSync';

type AppState = 'loading' | 'unregistered' | 'pending' | 'active' | 'revoked' | 'error';

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  
  // Estados de validación de la Fase 3
  const [hasInternet, setHasInternet] = useState<boolean | null>(null);
  const [userAssigned, setUserAssigned] = useState<boolean | null>(null);
  const [companyAssigned, setCompanyAssigned] = useState<boolean | null>(null);
  const [companyName, setCompanyName] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<'pending' | 'syncing' | 'completed' | 'error'>('pending');
  const [syncError, setSyncError] = useState<string>('');

  useEffect(() => {
    checkDeviceStatus();
  }, []);

  const checkInternetConnection = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const response = await fetch('https://www.google.com', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });
      clearTimeout(timeoutId);
      return response.ok;
    } catch (e) {
      return false;
    }
  };

  const triggerPowerSyncSetup = async () => {
    try {
      setSyncStatus('syncing');
      setSyncError('');

      // 1. Inicializa la base SQLite local
      await powerSync.init();

      // 2. Conecta PowerSync con el servicio en la nube (JWT sync stream)
      await startSync();

      setSyncStatus('completed');
    } catch (err: any) {
      console.error(' Error de sincronización PowerSync:', err);
      setSyncStatus('error');
      setSyncError(err.message || 'Error al sincronizar datos locales');
    }
  };

  const checkDeviceStatus = async () => {
    try {
      setAppState('loading');
      
      // 1. Validar conexión a internet
      const hasNet = await checkInternetConnection();
      setHasInternet(hasNet);
      if (!hasNet) {
        setAppState('error');
        Alert.alert('Sin Conexión', 'No tienes conexión a internet. Se requiere internet para las validaciones iniciales de sincronización.');
        return;
      }

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

      // 2. Consultar whitelist con usuarios y empresas asociados
      const { data, error } = await supabase
        .from('whitelist')
        .select(`
          estado,
          usuario_id,
          usuarios (
            id,
            nombre,
            empresa_id,
            empresas (
              id,
              nombre
            )
          )
        `)
        .eq('device_id', id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setAppState('unregistered');
      } else {
        const dbEstado = data.estado;

        // Parsear información de usuario
        let usrObj: any = null;
        if (data.usuarios) {
          usrObj = Array.isArray(data.usuarios) ? data.usuarios[0] : data.usuarios;
        }

        const uNombre = usrObj?.nombre || null;
        const uId = usrObj?.id || data.usuario_id || null;
        const eId = usrObj?.empresa_id || null;

        // Parsear información de empresa
        let empObj: any = null;
        if (usrObj?.empresas) {
          empObj = Array.isArray(usrObj.empresas) ? usrObj.empresas[0] : usrObj.empresas;
        }
        const eNombre = empObj?.nombre || null;

        setUserName(uNombre || 'Desconocido');
        setCompanyName(eNombre || 'Sin Empresa');

        const isUserValid = uNombre !== null && uNombre !== 'Desconocido' && uId !== null;
        const isCompanyValid = eNombre !== null && eId !== null;

        setUserAssigned(isUserValid);
        setCompanyAssigned(isCompanyValid);

        if (dbEstado === 'activo') {
          setAppState('active');
          // Iniciar la sincronización si el usuario y la empresa son correctos
          if (isUserValid && isCompanyValid) {
            triggerPowerSyncSetup();
          }
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
    const isReady = hasInternet && userAssigned && companyAssigned && syncStatus === 'completed';
    const hasError = !hasInternet || !userAssigned || !companyAssigned || syncStatus === 'error';

    return (
      <View style={styles.container}>
        <Text style={styles.welcomeTitle}>
          ¡Bienvenido{userName ? `, ${userName}` : ''}!
        </Text>
        <Text style={styles.welcomeSubtitle}>
          {companyName ? `Empresa: ${companyName}` : 'Validando información de la empresa...'}
        </Text>

        <View style={styles.cardContainer}>
          <Text style={styles.cardHeader}>Estado de Configuración Inicial</Text>
          
          {/* Fila 1: Conexión de Red */}
          <View style={styles.statusRow}>
            <Text style={styles.statusEmoji}>
              {hasInternet === null ? '⏳' : hasInternet ? '🟢' : '🔴'}
            </Text>
            <View style={styles.statusDetails}>
              <Text style={styles.statusLabel}>Conectividad de Red</Text>
              <Text style={styles.statusDescription}>
                {hasInternet === null ? 'Verificando red...' : hasInternet ? 'Conectado a Internet' : 'Sin conexión a Internet'}
              </Text>
            </View>
          </View>

          {/* Fila 2: Asignación de Usuario */}
          <View style={styles.statusRow}>
            <Text style={styles.statusEmoji}>
              {userAssigned === null ? '⏳' : userAssigned ? '🟢' : '🔴'}
            </Text>
            <View style={styles.statusDetails}>
              <Text style={styles.statusLabel}>Asignación de Usuario</Text>
              <Text style={styles.statusDescription}>
                {userAssigned === null ? 'Buscando usuario...' : userAssigned ? `Usuario "${userName}" asignado` : 'No se detecta usuario asignado'}
              </Text>
            </View>
          </View>

          {/* Fila 3: Asignación de Empresa */}
          <View style={styles.statusRow}>
            <Text style={styles.statusEmoji}>
              {companyAssigned === null ? '⏳' : companyAssigned ? '🟢' : '🔴'}
            </Text>
            <View style={styles.statusDetails}>
              <Text style={styles.statusLabel}>Empresa Autorizada</Text>
              <Text style={styles.statusDescription}>
                {companyAssigned === null ? 'Buscando empresa...' : companyAssigned ? `Empresa "${companyName}" asignada` : 'No se detecta empresa asignada'}
              </Text>
            </View>
          </View>

          {/* Fila 4: Clonación / Sincronización Local */}
          <View style={styles.statusRow}>
            <Text style={styles.statusEmoji}>
              {syncStatus === 'pending' ? '⏳' : syncStatus === 'syncing' ? '🔄' : syncStatus === 'completed' ? '🟢' : '🔴'}
            </Text>
            <View style={styles.statusDetails}>
              <Text style={styles.statusLabel}>Sincronización Local (Copia de BD)</Text>
              <Text style={styles.statusDescription}>
                {syncStatus === 'pending' ? 'Esperando validaciones...' : 
                 syncStatus === 'syncing' ? 'Sincronizando datos de Supabase...' : 
                 syncStatus === 'completed' ? 'Base de datos clonada exitosamente (Offline-First listo)' : 
                 `Error de sincronización: ${syncError}`}
              </Text>
            </View>
          </View>
        </View>

        {isReady && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>¡Todo listo! Ya puedes trabajar sin conexión. ✈️</Text>
          </View>
        )}

        {hasError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {hasInternet === false ? 'Se requiere conexión a Internet para iniciar la sincronización.' :
               userAssigned === false ? 'No tienes un usuario asignado a este dispositivo. Contacta al administrador.' :
               companyAssigned === false ? 'Tu usuario no tiene una empresa asignada. Contacta al administrador.' :
               syncStatus === 'error' ? `Ocurrió un error al sincronizar la base de datos: ${syncError}` :
               'Ocurrió un error inesperado al validar la información.'}
            </Text>
            <TouchableOpacity style={styles.buttonRetry} onPress={checkDeviceStatus}>
              <Text style={styles.buttonRetryText}>Validar y Reintentar Sincronización</Text>
            </TouchableOpacity>
          </View>
        )}

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
    backgroundColor: '#f4f6f9',
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
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  cardContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 20,
  },
  cardHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusEmoji: {
    fontSize: 24,
    marginRight: 15,
    width: 30,
    textAlign: 'center',
  },
  statusDetails: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2b2b2b',
  },
  statusDescription: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },
  successContainer: {
    backgroundColor: '#d4edda',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c3e6cb',
    width: '100%',
    alignItems: 'center',
  },
  successText: {
    color: '#155724',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f5c6cb',
    width: '100%',
    alignItems: 'center',
  },
  errorText: {
    color: '#721c24',
    fontWeight: '500',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
  },
  buttonRetry: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
  },
  buttonRetryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
