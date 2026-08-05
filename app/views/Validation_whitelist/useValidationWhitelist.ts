import { Alert } from 'react-native';
import * as Device from 'expo-device';
import { supabase } from '../../supabaseClient';
import { AppState } from '../../hooks/useAppInit';

export const useValidationWhitelist = (deviceId: string | null, setAppState: React.Dispatch<React.SetStateAction<AppState>>) => {
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

  return { requestAccess };
};
