import { usePowerSyncWatchedQuery, usePowerSync } from '@powersync/react-native';
import { v4 as uuidv4 } from 'uuid';
import { useSession } from '../../../context/SessionContext';

export interface Cliente {
  id: string;
  nombre: string;
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
  estado_cliente: string;
  cedula: string | null;
  correo: string | null;
  telefono: string | null;
}

export const useClientes = () => {
  const { empresaId, usuarioId } = useSession();
  const powerSync = usePowerSync();

  // Traer clientes activos de esta empresa
  const clientes = usePowerSyncWatchedQuery<Cliente>(
    `SELECT id, nombre, direccion, latitud, longitud, estado_cliente, cedula, correo, telefono 
     FROM clientes 
     WHERE empresa_id = ? AND deleted_at IS NULL`,
    [empresaId]
  );

  const createCliente = async (
    nombre: string,
    direccion: string,
    latitud?: number,
    longitud?: number,
    estado_cliente: string = 'activo',
    cedula?: string,
    correo?: string,
    telefono?: string
  ) => {
    if (!empresaId || !usuarioId) throw new Error('No hay sesión activa');
    
    const id = uuidv4();
    await powerSync.execute(
      `INSERT INTO clientes (id, empresa_id, asignado_a, nombre, direccion, latitud, longitud, estado_cliente, cedula, correo, telefono) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        empresaId,
        usuarioId,
        nombre,
        direccion,
        latitud || null,
        longitud || null,
        estado_cliente,
        cedula || null,
        correo || null,
        telefono || null
      ]
    );
  };

  const updateCliente = async (
    id: string,
    nombre: string,
    direccion: string,
    latitud?: number,
    longitud?: number,
    estado_cliente: string = 'activo',
    cedula?: string,
    correo?: string,
    telefono?: string
  ) => {
    await powerSync.execute(
      `UPDATE clientes SET nombre = ?, direccion = ?, latitud = ?, longitud = ?, estado_cliente = ?, cedula = ?, correo = ?, telefono = ? WHERE id = ?`,
      [
        nombre,
        direccion,
        latitud || null,
        longitud || null,
        estado_cliente,
        cedula || null,
        correo || null,
        telefono || null,
        id
      ]
    );
  };

  const deleteCliente = async (id: string) => {
    // Al hacer DELETE en SQLite, PowerSync crea un tombstone localmente 
    // y luego emite un comando DELETE al servidor cuando hay internet.
    await powerSync.execute(
      `DELETE FROM clientes WHERE id = ?`,
      [id]
    );
  };

  return {
    clientes,
    createCliente,
    updateCliente,
    deleteCliente
  };
};

