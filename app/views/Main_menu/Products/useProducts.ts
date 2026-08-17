import { usePowerSyncWatchedQuery, usePowerSync } from '@powersync/react-native';
import { v4 as uuidv4 } from 'uuid';
import { useSession } from '../../../context/SessionContext';

export interface Producto {
  id: string;
  empresa_id: string;
  codigo: string | null;
  nombre: string;
  descripcion: string | null;
  precio_unitario: number | null;
  activo: number;
}

export const useProducts = () => {
  const { empresaId } = useSession();
  const powerSync = usePowerSync();

  // Traer productos de esta empresa
  const productos = usePowerSyncWatchedQuery<Producto>(
    `SELECT id, empresa_id, codigo, nombre, descripcion, precio_unitario, activo 
     FROM productos 
     WHERE empresa_id = ?`,
    [empresaId]
  );

  const createProducto = async (
    nombre: string,
    codigo: string = '',
    descripcion: string = '',
    precio_unitario: number = 0,
    activo: number = 1
  ) => {
    if (!empresaId) throw new Error('No hay sesión activa');
    
    const id = uuidv4();
    await powerSync.execute(
      `INSERT INTO productos (id, empresa_id, codigo, nombre, descripcion, precio_unitario, activo) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        empresaId,
        codigo || null,
        nombre,
        descripcion || null,
        precio_unitario,
        activo
      ]
    );
  };

  const updateProducto = async (
    id: string,
    nombre: string,
    codigo: string = '',
    descripcion: string = '',
    precio_unitario: number = 0,
    activo: number = 1
  ) => {
    await powerSync.execute(
      `UPDATE productos SET nombre = ?, codigo = ?, descripcion = ?, precio_unitario = ?, activo = ? WHERE id = ?`,
      [
        nombre,
        codigo || null,
        descripcion || null,
        precio_unitario,
        activo,
        id
      ]
    );
  };

  const deleteProducto = async (id: string) => {
    // "Eliminar" es desactivar (activo = 0)
    await powerSync.execute(
      `UPDATE productos SET activo = 0 WHERE id = ?`,
      [id]
    );
  };

  return {
    productos,
    createProducto,
    updateProducto,
    deleteProducto
  };
};
