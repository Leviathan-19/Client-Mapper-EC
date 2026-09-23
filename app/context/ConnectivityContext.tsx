import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import NetInfo from "@react-native-community/netinfo";
import { powerSync, connector } from "../powerSync";

export type SyncStatus =
  | "idle"
  | "offline"
  | "connecting"
  | "syncing"
  | "synced"
  | "error";

export interface ConnectivityState {
  hasNetwork: boolean;
  isInternetReachable: boolean | null;
  syncStatus: SyncStatus;
  pendingMutations: number;
  lastSyncAt: string | null;
  syncError: string | null;
}

const ConnectivityContext = createContext<ConnectivityState>({
  hasNetwork: true,
  isInternetReachable: null,
  syncStatus: "idle",
  pendingMutations: 0,
  lastSyncAt: null,
  syncError: null,
});

export const ConnectivityProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [hasNetwork, setHasNetwork] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState<
    boolean | null
  >(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [pendingMutations, setPendingMutations] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const isConnectingRef = useRef(false);

  useEffect(() => {
    // Suscripción a NetInfo
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      setHasNetwork(!!state.isConnected);
      setIsInternetReachable(state.isInternetReachable);
    });

    // Suscripción al estado de PowerSync
    const unsubscribePowerSync = powerSync.registerListener({
      statusChanged: (status) => {
        if (status.connected) {
          setSyncStatus("synced");
          setLastSyncAt(new Date().toISOString());
          setSyncError(null);
        } else if (status.connecting) {
          setSyncStatus("connecting");
        } else if (
          (status as any).downloading ||
          (status as any).uploading ||
          (status as any).dataFlowStatus?.downloading ||
          (status as any).dataFlowStatus?.uploading
        ) {
          setSyncStatus("syncing");
        } else {
          setSyncStatus("offline");
        }
      },
    });

    // Monitorear cola local (pending mutations)
    const updatePendingMutations = async () => {
      try {
        // En PowerSync, dependiendo de la version, puedes usar getUploadQueueStats()
        // o si no se utiliza una abstracción propia
        const count = await powerSync.get(
          "SELECT count(*) as count FROM ps_crud",
        );
        setPendingMutations((count as any)?.count || 0);
      } catch (e) {
        console.error("Error obteniendo estado de cola", e);
      }
    };

    const interval = setInterval(updatePendingMutations, 5000);
    updatePendingMutations();

    return () => {
      unsubscribeNetInfo();
      interval && clearInterval(interval);
      if (typeof unsubscribePowerSync === "function") {
        unsubscribePowerSync();
      } else if (typeof (unsubscribePowerSync as any)?.dispose === "function") {
        (unsubscribePowerSync as any).dispose();
      }
    };
  }, []);

  // Lógica de reconexión controlada
  useEffect(() => {
    const handleReconnect = async () => {
      if (
        hasNetwork &&
        (isInternetReachable === true || isInternetReachable === null)
      ) {
        if (!isConnectingRef.current) {
          isConnectingRef.current = true;
          try {
            setSyncStatus("connecting");
            await powerSync.connect(connector);
            setSyncError(null);
          } catch (e: any) {
            console.error("Error en reconexión de PowerSync", e);
            setSyncError(e.message);
            setSyncStatus("error");
          } finally {
            isConnectingRef.current = false;
          }
        }
      } else {
        setSyncStatus("offline");
        try {
          await powerSync.disconnectAndClear();
        } catch (e) {
          try {
            await powerSync.disconnect();
          } catch (e2) {}
        }
      }
    };

    handleReconnect();
  }, [hasNetwork, isInternetReachable]);

  return (
    <ConnectivityContext.Provider
      value={{
        hasNetwork,
        isInternetReachable,
        syncStatus,
        pendingMutations,
        lastSyncAt,
        syncError,
      }}
    >
      {children}
    </ConnectivityContext.Provider>
  );
};

export const useConnectivity = () => useContext(ConnectivityContext);
