import {
  usePowerSyncWatchedQuery,
  usePowerSync,
} from "@powersync/react-native";
import { v4 as uuidv4 } from "uuid";
import { useSession } from "../../../context/SessionContext";

export interface Route {
  id: string;
  nombre: string;
  fecha: string | null;
  estado_ruta: string;
  created_at: string;
  asignado_a: string | null;
  creador_nombre: string | null;
  total_visitas: number;
}

export interface Establishment {
  id: string;
  empresa_id: string;
  cliente_id: string | null;
  nombre_comercial: string;
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
  created_at: string;
}

export interface Visit {
  id: string;
  ruta_id: string;
  establecimiento_id: string;
  fecha_programada: string | null;
  fecha_realizada: string | null;
  estado_visita: string;
  latitud_registro: number | null;
  longitud_registro: number | null;
  created_at: string;
  nombre_comercial: string;
  direccion: string | null;
}

export const useRoutes = () => {
  const { empresaId, usuarioId } = useSession();
  const powerSync = usePowerSync();

  // Traer todas las rutas de la empresa, incluyendo info del creador y conteo de visitas
  const routes = usePowerSyncWatchedQuery<Route>(
    `SELECT 
       r.id, 
       r.nombre, 
       r.fecha, 
       r.estado_ruta, 
       r.created_at, 
       r.asignado_a,
       u.nombre AS creador_nombre,
       (SELECT COUNT(*) FROM visitas v WHERE v.ruta_id = r.id AND v.deleted_at IS NULL) AS total_visitas
     FROM rutas r
     LEFT JOIN usuarios u ON r.asignado_a = u.id
     WHERE r.empresa_id = ?
     ORDER BY r.created_at DESC`,
    [empresaId],
  );

  // Traer todos los establecimientos de la empresa para selección
  const establishments = usePowerSyncWatchedQuery<Establishment>(
    `SELECT id, empresa_id, cliente_id, nombre_comercial, direccion, latitud, longitud, created_at
     FROM establecimientos
     WHERE empresa_id = ? AND deleted_at IS NULL
     ORDER BY nombre_comercial ASC`,
    [empresaId],
  );
  const updateEstablishmentClient = async (
    establecimientoId: string,
    clienteId: string | null,
  ) => {
    await powerSync.execute(
      `UPDATE establecimientos
     SET cliente_id = ?
     WHERE id = ?`,
      [clienteId, establecimientoId],
    );
  };

  // Traer clientes para asociar al crear establecimientos
  const clients = usePowerSyncWatchedQuery<{ id: string; nombre: string }>(
    `SELECT id, nombre 
     FROM clientes 
     WHERE empresa_id = ? AND deleted_at IS NULL 
     ORDER BY nombre ASC`,
    [empresaId],
  );

  const createRoute = async (nombre: string) => {
    if (!empresaId || !usuarioId) throw new Error("No hay sesión activa");

    const id = uuidv4();
    const today = new Date().toISOString().split("T")[0];
    await powerSync.execute(
      `INSERT INTO rutas (id, empresa_id, asignado_a, nombre, fecha, estado_ruta, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        empresaId,
        usuarioId,
        nombre.trim(),
        today,
        "activa",
        new Date().toISOString(),
      ],
    );
  };

  const updateRouteName = async (id: string, nombre: string) => {
    if (!nombre.trim()) throw new Error("El nombre de la ruta es obligatorio");
    await powerSync.execute(`UPDATE rutas SET nombre = ? WHERE id = ?`, [
      nombre.trim(),
      id,
    ]);
  };

  const createVisit = async (
    rutaId: string,
    establecimientoId: string,
    fechaProgramada?: string | null,
  ) => {
    const id = uuidv4();
    await powerSync.execute(
      `INSERT INTO visitas (id, ruta_id, establecimiento_id, fecha_programada, estado_visita, created_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        rutaId,
        establecimientoId,
        fechaProgramada || null,
        "programada",
        new Date().toISOString(),
      ],
    );
  };

  const deleteVisit = async (id: string) => {
    await powerSync.execute(`DELETE FROM visitas WHERE id = ?`, [id]);
  };

  const updateVisitStatus = async (id: string, status: string) => {
    const isCompleted = status === "completada";
    await powerSync.execute(
      `UPDATE visitas SET estado_visita = ?, fecha_realizada = ? WHERE id = ?`,
      [status, isCompleted ? new Date().toISOString() : null, id],
    );
  };

  const updateVisitDate = async (
    id: string,
    fechaProgramada: string | null,
  ) => {
    await powerSync.execute(
      `UPDATE visitas SET fecha_programada = ? WHERE id = ?`,
      [fechaProgramada, id],
    );
  };

  const createEstablishment = async (
    nombreComercial: string,
    direccion: string,
    latitud: number,
    longitud: number,
    clienteId?: string,
  ): Promise<string> => {
    if (!empresaId) throw new Error("No hay sesión activa");
    if (!nombreComercial.trim())
      throw new Error("El nombre comercial es obligatorio");

    const id = uuidv4();
    await powerSync.execute(
      `INSERT INTO establecimientos (id, empresa_id, cliente_id, nombre_comercial, direccion, latitud, longitud, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        empresaId,
        clienteId || null,
        nombreComercial.trim(),
        direccion.trim() || null,
        latitud,
        longitud,
        new Date().toISOString(),
      ],
    );
    return id;
  };

  return {
    routes,
    establishments,
    clients,
    createRoute,
    updateRouteName,
    createVisit,
    deleteVisit,
    updateVisitStatus,
    updateVisitDate,
    createEstablishment,
    updateEstablishmentClient,
  };
};

export const useRouteVisits = (rutaId: string) => {
  const visits = usePowerSyncWatchedQuery<Visit>(
    `SELECT 
       v.id, 
       v.ruta_id, 
       v.establecimiento_id, 
       v.fecha_programada, 
       v.fecha_realizada, 
       v.estado_visita, 
       v.latitud_registro, 
       v.longitud_registro, 
       v.created_at,
       e.nombre_comercial,
       e.direccion
     FROM visitas v
     INNER JOIN establecimientos e ON v.establecimiento_id = e.id
     WHERE v.ruta_id = ? AND v.deleted_at IS NULL
     ORDER BY v.created_at ASC`,
    [rutaId],
  );

  return visits;
};
