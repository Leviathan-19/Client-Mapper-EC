import { PowerSyncDatabase } from '@powersync/react-native';
import { OPSqliteOpenFactory } from '@powersync/op-sqlite';
import { AppSchemaDefinition } from './powerSyncSchema';
import { supabase } from './supabaseClient';

/**
 * Función auxiliar para obtener el JWT actual de la sesión en Supabase.
 */
const getSupabaseToken = async (): Promise<string> => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error obteniendo sesión Supabase:', error.message);
    throw error;
  }
  return data.session?.access_token ?? '';
};

// 1. Instanciar el cliente PowerSync local con la factoría de OP-SQLite.
export const powerSync = new PowerSyncDatabase({
  schema: AppSchemaDefinition,
  database: new OPSqliteOpenFactory({
    dbFilename: 'powersync.db',
  }),
});

// 2. Conector para manejar la sincronización con el servidor.
export const connector = {
  fetchCredentials: async () => {
    return {
      // Reemplaza con tu endpoint de PowerSync Service
      endpoint: process.env.POWERSYNC_ENDPOINT ?? 'https://tu-endpoint-powersync.com',
      token: await getSupabaseToken(),
    };
  },
  uploadData: async (db: any) => {
    // Aquí implementaremos el envío de cambios locales a Supabase más adelante.
  },
};

/**
 * Función para inicializar la sincronización de red.
 * Llama a esta función después de verificar la whitelist del dispositivo.
 */
export const startSync = async () => {
  // Conecta la base SQLite con el servicio en la nube
  await powerSync.connect(connector);
};

export default powerSync;
