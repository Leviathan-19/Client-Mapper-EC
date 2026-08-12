import { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import * as Application from 'expo-application';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabaseClient';
import { powerSync, startSync } from '../powerSync';

export type AppState = 'loading' | 'unregistered' | 'pending' | 'active' | 'main_menu' | 'revoked' | 'error';

export const useAppInit = () => {
  const [appState, setAppState] = useState<AppState>('loading');
  const [deviceId, setDeviceId] = useState<string | null>(null);

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

      // 1. Asegurar que tenemos una sesión de Supabase
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      
      let session = sessionData.session;
      if (!session) {
        console.log('No hay sesión persistida, creando sesión anónima...');
        const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
        if (authError) throw authError;
        session = authData.session;
      }

      // 2. Ejecutar la validación y vinculación vía RPC seguro
      // Este RPC bypassea RLS de forma segura, revisa la whitelist y vincula el JWT
      const { data, error } = await supabase.rpc('vincular_usuario_auth', { p_device_id: id });

      if (error) {
        const msg = error.message || '';
        if (msg.includes('Dispositivo no registrado')) {
          setAppState('unregistered');
        } else if (msg.includes('estado: pendiente')) {
          setAppState('pending');
        } else if (msg.includes('estado: revocado')) {
          setAppState('revoked');
        } else {
          // Otro tipo de error (ej: Usuario no activo)
          throw error;
        }
      } else {
        // Dispositivo está activo y el usuario se vinculó exitosamente
        const usuarioInfo = data[0]; // La función retorna una tabla, tomamos la primera fila
        
        if (usuarioInfo) {
          // Persistir la info del usuario para uso de la interfaz (PowerSync usará el JWT)
          await AsyncStorage.setItem('@empresaId', usuarioInfo.empresa_id);
          await AsyncStorage.setItem('@usuarioId', usuarioInfo.usuario_id);
        }

        const isSetupComplete = await AsyncStorage.getItem('@isInitialSyncComplete');

        if (isSetupComplete === 'true') {
          try {
            await powerSync.init();
            await startSync();
          } catch (syncErr: any) {
            console.error('Error al inicializar PowerSync en arranque directo:', syncErr);
          }
          setAppState('main_menu');
        } else {
          setAppState('active');
        }
      }
    } catch (err: any) {
      console.error(err);
      setAppState('error');
      Alert.alert('Error', err.message || 'Error al conectar con el servidor');
    }
  };

  useEffect(() => {
    checkDeviceStatus();
  }, []);

  return { appState, setAppState, deviceId, checkDeviceStatus };
};
