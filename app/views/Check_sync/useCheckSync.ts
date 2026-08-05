import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { powerSync, startSync } from '../../powerSync';

export const useCheckSync = (deviceId: string | null) => {
  const [hasInternet, setHasInternet] = useState<boolean | null>(null);
  const [userAssigned, setUserAssigned] = useState<boolean | null>(null);
  const [companyAssigned, setCompanyAssigned] = useState<boolean | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<'pending' | 'syncing' | 'completed' | 'error'>('pending');
  const [syncError, setSyncError] = useState<string>('');

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

      await powerSync.init();
      await startSync();

      setSyncStatus('completed');
    } catch (err: any) {
      console.error(' Error de sincronización PowerSync:', err);
      setSyncStatus('error');
      setSyncError(err.message || 'Error al sincronizar datos locales');
    }
  };

  const validateSync = useCallback(async () => {
    if (!deviceId) return;
    
    try {
      setHasInternet(null);
      setUserAssigned(null);
      setCompanyAssigned(null);
      setSyncStatus('pending');

      const hasNet = await checkInternetConnection();
      setHasInternet(hasNet);
      if (!hasNet) return;

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
        .eq('device_id', deviceId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        let usrObj: any = null;
        if (data.usuarios) {
          usrObj = Array.isArray(data.usuarios) ? data.usuarios[0] : data.usuarios;
        }

        const uNombre = usrObj?.nombre || null;
        const uId = usrObj?.id || data.usuario_id || null;
        const eId = usrObj?.empresa_id || null;

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

        if (isUserValid && isCompanyValid) {
          triggerPowerSyncSetup();
        }
      }
    } catch (err: any) {
      console.error(err);
      setSyncStatus('error');
      setSyncError(err.message || 'Error validando datos relacionales');
    }
  }, [deviceId]);

  useEffect(() => {
    validateSync();
  }, [validateSync]);

  return {
    hasInternet,
    userAssigned,
    companyAssigned,
    userName,
    companyName,
    syncStatus,
    syncError,
    validateSync
  };
};
