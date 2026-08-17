import { usePowerSyncWatchedQuery, usePowerSync } from '@powersync/react-native';
import { useSession } from '../../../context/SessionContext';
import { useMemo } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

export interface Establecimiento {
  id: string;
  nombre_comercial: string;
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
  estado_comercial: string;
  cliente_id: string | null;
  cliente_nombre?: string;
  cliente_estado?: string;
}

export interface Visita {
  id: string;
  establecimiento_id: string;
  fecha_programada: string | null;
  fecha_realizada: string | null;
  estado_visita: string;
}

export interface VisitaMapItem extends Establecimiento {
  ultima_visita?: Visita;
}

export const useVisits = () => {
  const { empresaId } = useSession();
  const powerSync = usePowerSync();

  // Consultar todos los establecimientos de la empresa
  // NOTA: eliminamos deleted_at de la consulta ya que la base real no lo tiene.
  const establecimientos = usePowerSyncWatchedQuery<Establecimiento>(
    `SELECT e.id, e.nombre_comercial, e.direccion, e.latitud, e.longitud, e.estado_comercial, e.cliente_id, c.nombre as cliente_nombre, c.estado_cliente as cliente_estado
     FROM establecimientos e
     LEFT JOIN clientes c ON e.cliente_id = c.id
     WHERE e.empresa_id = ?`,
    [empresaId]
  );

  // Consultar todas las visitas de las rutas de esta empresa
  const visitas = usePowerSyncWatchedQuery<Visita>(
    `SELECT v.id, v.establecimiento_id, v.fecha_programada, v.fecha_realizada, v.estado_visita
     FROM visitas v
     INNER JOIN rutas r ON v.ruta_id = r.id
     WHERE r.empresa_id = ?
     ORDER BY v.fecha_programada DESC, v.created_at DESC`,
    [empresaId]
  );

  // Combinar en TypeScript
  const visitasMapItems = useMemo(() => {
    if (!establecimientos || !visitas) return [];
    
    // Agrupar visitas por establecimiento, quedándose con la primera (la más reciente por el ORDER BY)
    const ultimaVisitaPorEstablecimiento = new Map<string, Visita>();
    for (const v of visitas) {
      if (!ultimaVisitaPorEstablecimiento.has(v.establecimiento_id)) {
        ultimaVisitaPorEstablecimiento.set(v.establecimiento_id, v);
      }
    }

    // Mapear establecimientos, filtrando los que no tienen coords válidas
    const validItems: VisitaMapItem[] = [];
    for (const e of establecimientos) {
      // Ignorar sin lat/lng
      if (e.latitud === null || e.longitud === null || (e.latitud === 0 && e.longitud === 0)) continue;
      
      validItems.push({
        ...e,
        ultima_visita: ultimaVisitaPorEstablecimiento.get(e.id)
      });
    }

    return validItems;
  }, [establecimientos, visitas]);

  const checkInVisit = async (visitId: string) => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Habilita los permisos de ubicación en tu dispositivo para realizar el check-in.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      
      await powerSync.execute(
        `UPDATE visitas SET estado_visita = 'en_curso', latitud_registro = ?, longitud_registro = ? WHERE id = ?`,
        [location.coords.latitude, location.coords.longitude, visitId]
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const completeVisit = async (visitId: string, establecimientoId: string) => {
    try {
      const now = new Date().toISOString();
      await powerSync.execute(
        `UPDATE visitas SET estado_visita = 'completada', fecha_realizada = ? WHERE id = ?`,
        [now, visitId]
      );
      
      // Actualizar el estado del establecimiento
      await powerSync.execute(
        `UPDATE establecimientos SET estado_comercial = 'atendido' WHERE id = ?`,
        [establecimientoId]
      );
      
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const cancelVisit = async (visitId: string) => {
    try {
      await powerSync.execute(
        `UPDATE visitas SET estado_visita = 'cancelada' WHERE id = ?`,
        [visitId]
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return {
    visitasMapItems,
    checkInVisit,
    completeVisit,
    cancelVisit
  };
};
