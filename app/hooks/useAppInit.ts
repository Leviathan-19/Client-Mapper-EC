import { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import * as Application from 'expo-application';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabaseClient';

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

      // Revisar si ya completó el Check Sync inicial
      const isSetupComplete = await AsyncStorage.getItem('@isInitialSyncComplete');

      // Consultar whitelist
      const { data, error } = await supabase
        .from('whitelist')
        .select('estado')
        .eq('device_id', id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setAppState('unregistered');
      } else {
        const dbEstado = data.estado;

        if (dbEstado === 'activo') {
          if (isSetupComplete === 'true') {
            setAppState('main_menu');
          } else {
            setAppState('active');
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

  useEffect(() => {
    checkDeviceStatus();
  }, []);

  return { appState, setAppState, deviceId, checkDeviceStatus };
};
