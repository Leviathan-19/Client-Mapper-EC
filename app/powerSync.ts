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
      endpoint: process.env.EXPO_PUBLIC_POWERSYNC_URL ?? 'https://tu-endpoint-powersync.com',
      token: await getSupabaseToken(),
    };
  },
  uploadData: async (db: any) => {
    const transaction = await db.getNextCrudTransaction();
    if (!transaction) return;

    let lastOp = null;
    try {
      for (const op of transaction.crud) {
        lastOp = op;
        const table = op.table;
        let error = null;

        if (op.op === 'PUT') {
          const { error: err } = await supabase.from(table).upsert({ ...op.opData, id: op.id });
          error = err;
        } else if (op.op === 'PATCH') {
          const { error: err } = await supabase.from(table).update(op.opData).eq('id', op.id);
          error = err;
        } else if (op.op === 'DELETE') {
          const { error: err } = await supabase.from(table).delete().eq('id', op.id);
          error = err;
        }

        if (error) {
          throw new Error(error.message);
        }
      }
      
      await transaction.complete();
    } catch (ex: any) {
      console.error(`Error de sincronización en la tabla ${lastOp?.table}:`, ex.message);
      throw ex;
    }
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
