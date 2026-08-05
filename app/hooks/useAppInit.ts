import { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import * as Application from 'expo-application';
import { supabase } from '../supabaseClient';

export type AppState = 'loading' | 'unregistered' | 'pending' | 'active' | 'revoked' | 'error';

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

  useEffect(() => {
    checkDeviceStatus();
  }, []);

  return { appState, setAppState, deviceId, checkDeviceStatus };
};
