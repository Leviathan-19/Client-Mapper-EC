import { Schema, column, Table } from '@powersync/react-native';

const empresas = new Table({
  id: column.text,
  ruc: column.text,
  direccion: column.text,
  nombre: column.text,
  estado: column.text,
  created_at: column.text
});

const clientes = new Table({
  empresa_id: column.text,
  asignado_a: column.text,
  nombre: column.text,
  direccion: column.text,
  estado_cliente: column.text,
  created_at: column.text,
  deleted_at: column.text,
  cedula: column.text,
  correo: column.text,
  telefono: column.text
});

const establecimientos = new Table({
  empresa_id: column.text,
  cliente_id: column.text,
  nombre_comercial: column.text,
  direccion: column.text,
  latitud: column.real,
  longitud: column.real,
  estado_comercial: column.text,
  created_at: column.text,
  deleted_at: column.text
});

const rutas = new Table({
  empresa_id: column.text,
  asignado_a: column.text,
  nombre: column.text,
  fecha: column.text,
  estado_ruta: column.text,
  created_at: column.text
});

const visitas = new Table({
  ruta_id: column.text,
  establecimiento_id: column.text,
  fecha_programada: column.text,
  fecha_realizada: column.text,
  estado_visita: column.text,
  latitud_registro: column.real,
  longitud_registro: column.real,
  created_at: column.text,
  deleted_at: column.text
});

const productos = new Table({
  empresa_id: column.text,
  codigo: column.text,
  nombre: column.text,
  descripcion: column.text,
  precio_unitario: column.real,
  activo: column.integer,
  created_at: column.text
});

const visita_productos = new Table({
  visita_id: column.text,
  producto_id: column.text,
  cantidad: column.integer,
  precio_unitario: column.real,
  created_at: column.text
});

// Tabla whitelist
const whitelist = new Table({
  device_id: column.text,
  estado: column.text,
  descripcion: column.text,
  created_at: column.text,
  updated_at: column.text,
  usuario_id: column.text
});

// Tabla usuarios
const usuarios = new Table({
  empresa_id: column.text,
  nombre: column.text,
  rol: column.text,
  estado: column.text,
  created_at: column.text,
  auth_user_id: column.text
});

export const AppSchemaDefinition = new Schema({
  empresas,
  clientes,
  establecimientos,
  rutas,
  visitas,
  productos,
  visita_productos,
  whitelist,
  usuarios
});
