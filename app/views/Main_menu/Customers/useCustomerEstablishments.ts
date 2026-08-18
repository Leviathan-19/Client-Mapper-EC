import { usePowerSyncWatchedQuery } from "@powersync/react-native";

export interface CustomerEstablishment {
  id: string;
  cliente_id: string | null;
  nombre_comercial: string;
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
}

export const useCustomerEstablishments = (clienteId: string | null) => {
  return usePowerSyncWatchedQuery<CustomerEstablishment>(
    `
      SELECT
        id,
        cliente_id,
        nombre_comercial,
        direccion,
        latitud,
        longitud
      FROM establecimientos
      WHERE cliente_id = ?
        AND deleted_at IS NULL
      ORDER BY nombre_comercial ASC
    `,
    [clienteId],
  );
};
