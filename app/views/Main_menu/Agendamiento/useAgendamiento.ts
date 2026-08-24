import { usePowerSync, usePowerSyncWatchedQuery } from "@powersync/react-native";
import { v4 as uuidv4 } from "uuid";
import { useSession } from "../../../context/SessionContext";

export interface AgendamientoProduct {
  id: string;
  nombre: string;
  precio_unitario: string;
  cantidad: string;
}

export const useAgendamiento = () => {
  const { empresaId, usuarioId } = useSession();
  const powerSync = usePowerSync();

  const clientes = usePowerSyncWatchedQuery<any>(
    `SELECT id, nombre, cedula, telefono FROM clientes WHERE empresa_id = ? AND deleted_at IS NULL ORDER BY nombre ASC`,
    [empresaId]
  );

  const establecimientos = usePowerSyncWatchedQuery<any>(
    `SELECT id, nombre_comercial, direccion, cliente_id FROM establecimientos WHERE empresa_id = ? AND deleted_at IS NULL ORDER BY nombre_comercial ASC`,
    [empresaId]
  );

  const rutas = usePowerSyncWatchedQuery<any>(
    `SELECT id, nombre FROM rutas WHERE empresa_id = ? AND asignado_a = ? ORDER BY created_at DESC`,
    [empresaId, usuarioId]
  );

  const productos = usePowerSyncWatchedQuery<any>(
    `SELECT id, nombre, precio_unitario FROM productos WHERE empresa_id = ? AND activo = 1 ORDER BY nombre ASC`,
    [empresaId]
  );

  const saveAgendamiento = async (
    rutaId: string | null,
    newRutaNombre: string,
    establecimientoId: string | null,
    newEstablecimiento: { nombre: string; direccion: string; latitud: number | null; longitud: number | null },
    clienteId: string | null,
    newCliente: { nombre: string; cedula: string; telefono: string },
    visitaDetails: { fecha_programada: string; fecha_realizada: string | null; estado: string },
    selectedProducts: AgendamientoProduct[]
  ) => {
    if (!empresaId || !usuarioId) throw new Error("No session active");

    let finalRutaId = rutaId;
    let finalClienteId = clienteId;
    let finalEstablecimientoId = establecimientoId;

    // Use a transaction to ensure all or nothing
    await powerSync.writeTransaction(async (tx) => {
      // 1. Create Route if needed
      if (!finalRutaId && newRutaNombre.trim()) {
        finalRutaId = uuidv4();
        await tx.execute(
          `INSERT INTO rutas (id, empresa_id, asignado_a, nombre, fecha, estado_ruta) VALUES (?, ?, ?, ?, ?, ?)`,
          [finalRutaId, empresaId, usuarioId, newRutaNombre, new Date().toISOString().split('T')[0], 'activa']
        );
      } else if (!finalRutaId) {
        throw new Error("Debe seleccionar o crear una ruta");
      }

      // 2. Create Client if needed
      if (!finalClienteId && newCliente.nombre.trim()) {
        finalClienteId = uuidv4();
        await tx.execute(
          `INSERT INTO clientes (id, empresa_id, asignado_a, nombre, estado_cliente, cedula, telefono) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [finalClienteId, empresaId, usuarioId, newCliente.nombre, 'activo', newCliente.cedula || null, newCliente.telefono || null]
        );
      }

      // 3. Create Establishment if needed
      if (!finalEstablecimientoId) {
        if (!newEstablecimiento.nombre.trim()) throw new Error("Debe seleccionar o crear un establecimiento");
        finalEstablecimientoId = uuidv4();
        await tx.execute(
          `INSERT INTO establecimientos (id, empresa_id, cliente_id, nombre_comercial, direccion, latitud, longitud, estado_comercial) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [finalEstablecimientoId, empresaId, finalClienteId || null, newEstablecimiento.nombre, newEstablecimiento.direccion || null, newEstablecimiento.latitud, newEstablecimiento.longitud, 'por_visitar']
        );
      }

      // 4. Create Visit
      const visitaId = uuidv4();
      await tx.execute(
        `INSERT INTO visitas (id, ruta_id, establecimiento_id, empresa_id, fecha_programada, fecha_realizada, estado_visita) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [visitaId, finalRutaId, finalEstablecimientoId, empresaId, visitaDetails.fecha_programada, visitaDetails.fecha_realizada, visitaDetails.estado]
      );

      // 5. Create Visit Products
      for (const prod of selectedProducts) {
        if (!prod.id || !prod.cantidad || !prod.precio_unitario) continue;
        const vpId = uuidv4();
        await tx.execute(
          `INSERT INTO visita_productos (id, visita_id, producto_id, empresa_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?, ?, ?)`,
          [vpId, visitaId, prod.id, empresaId, parseInt(prod.cantidad), parseFloat(prod.precio_unitario)]
        );
      }
    });
  };

  return {
    clientes,
    establecimientos,
    rutas,
    productos,
    saveAgendamiento
  };
};
