import {
  usePowerSyncWatchedQuery,
  usePowerSync,
} from "@powersync/react-native";
import { v4 as uuidv4 } from "uuid";
import { useSession } from "../../../context/SessionContext";

export interface Cliente {
  id: string;
  nombre: string;
  direccion: string | null;
  estado_cliente: string;
  cedula: string | null;
  correo: string | null;
  telefono: string | null;
}

export const useClientes = () => {
  const { empresaId, usuarioId } = useSession();
  const powerSync = usePowerSync();

  /**
   * Clientes pertenecientes a la empresa del usuario actual.
   */
  const clientes = usePowerSyncWatchedQuery<Cliente>(
    `
      SELECT
        id,
        nombre,
        direccion,
        estado_cliente,
        cedula,
        correo,
        telefono
      FROM clientes
      WHERE empresa_id = ?
        AND deleted_at IS NULL
      ORDER BY nombre ASC
    `,
    [empresaId],
  );

  /**
   * Crear cliente.
   */
  const createCliente = async (
    nombre: string,
    direccion: string,
    estado_cliente: string = "activo",
    cedula?: string,
    correo?: string,
    telefono?: string,
  ) => {
    if (!empresaId || !usuarioId) {
      throw new Error("No hay sesión activa");
    }

    const id = uuidv4();

    await powerSync.execute(
      `
        INSERT INTO clientes (
          id,
          empresa_id,
          asignado_a,
          nombre,
          direccion,
          estado_cliente,
          cedula,
          correo,
          telefono
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        empresaId,
        usuarioId,
        nombre,
        direccion,
        estado_cliente,
        cedula || null,
        correo || null,
        telefono || null,
      ],
    );
  };

  /**
   * Actualizar cliente.
   */
  const updateCliente = async (
    id: string,
    nombre: string,
    direccion: string,
    estado_cliente: string = "activo",
    cedula?: string,
    correo?: string,
    telefono?: string,
  ) => {
    await powerSync.execute(
      `
        UPDATE clientes
        SET
          nombre = ?,
          direccion = ?,
          estado_cliente = ?,
          cedula = ?,
          correo = ?,
          telefono = ?
        WHERE id = ?
      `,
      [
        nombre,
        direccion,
        estado_cliente,
        cedula || null,
        correo || null,
        telefono || null,
        id,
      ],
    );
  };

  /**
   * Eliminar cliente.
   */
  const deleteCliente = async (id: string) => {
    await powerSync.execute(
      `
        DELETE FROM clientes
        WHERE id = ?
      `,
      [id],
    );
  };

  return {
    clientes,
    createCliente,
    updateCliente,
    deleteCliente,
  };
};
