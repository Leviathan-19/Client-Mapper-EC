import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCheckSync } from './useCheckSync';
import { styles } from './styles';
import { AppState } from '../../hooks/useAppInit';
import { useSession } from '../../context/SessionContext';

interface Props {
  deviceId: string | null;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const CheckSync: React.FC<Props> = ({ deviceId, setAppState }) => {
  const {
    hasInternet,
    userAssigned,
    companyAssigned,
    userName,
    userId,
    companyName,
    empresaId,
    syncStatus,
    syncError,
    validateSync
  } = useCheckSync(deviceId);
  
  const { setSession } = useSession();

  const isReady = hasInternet && userAssigned && companyAssigned && syncStatus === 'completed';
  const hasError = !hasInternet || !userAssigned || !companyAssigned || syncStatus === 'error';

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeTitle}>
        ¡Bienvenido{userName ? `, ${userName}` : ''}!
      </Text>
      <Text style={styles.welcomeSubtitle}>
        {companyName ? `Empresa: ${companyName}` : 'Validando información de la empresa...'}
      </Text>

      <View style={styles.cardContainer}>
        <Text style={styles.cardHeader}>Estado de Configuración Inicial</Text>
        
        {/* Fila 1: Conexión de Red */}
        <View style={styles.statusRow}>
          <Text style={styles.statusEmoji}>
            {hasInternet === null ? '⏳' : hasInternet ? '🟢' : '🔴'}
          </Text>
          <View style={styles.statusDetails}>
            <Text style={styles.statusLabel}>Conectividad de Red</Text>
            <Text style={styles.statusDescription}>
              {hasInternet === null ? 'Verificando red...' : hasInternet ? 'Conectado a Internet' : 'Sin conexión a Internet'}
            </Text>
          </View>
        </View>

        {/* Fila 2: Asignación de Usuario */}
        <View style={styles.statusRow}>
          <Text style={styles.statusEmoji}>
            {userAssigned === null ? '⏳' : userAssigned ? '🟢' : '🔴'}
          </Text>
          <View style={styles.statusDetails}>
            <Text style={styles.statusLabel}>Asignación de Usuario</Text>
            <Text style={styles.statusDescription}>
              {userAssigned === null ? 'Buscando usuario...' : userAssigned ? `Usuario "${userName}" asignado` : 'No se detecta usuario asignado'}
            </Text>
          </View>
        </View>

        {/* Fila 3: Asignación de Empresa */}
        <View style={styles.statusRow}>
          <Text style={styles.statusEmoji}>
            {companyAssigned === null ? '⏳' : companyAssigned ? '🟢' : '🔴'}
          </Text>
          <View style={styles.statusDetails}>
            <Text style={styles.statusLabel}>Empresa Autorizada</Text>
            <Text style={styles.statusDescription}>
              {companyAssigned === null ? 'Buscando empresa...' : companyAssigned ? `Empresa "${companyName}" asignada` : 'No se detecta empresa asignada'}
            </Text>
          </View>
        </View>

        {/* Fila 4: Clonación / Sincronización Local */}
        <View style={styles.statusRow}>
          <Text style={styles.statusEmoji}>
            {syncStatus === 'pending' ? '⏳' : syncStatus === 'syncing' ? '🔄' : syncStatus === 'completed' ? '🟢' : '🔴'}
          </Text>
          <View style={styles.statusDetails}>
            <Text style={styles.statusLabel}>Sincronización Local (Copia de BD)</Text>
            <Text style={styles.statusDescription}>
              {syncStatus === 'pending' ? 'Esperando validaciones...' : 
               syncStatus === 'syncing' ? 'Sincronizando datos de Supabase...' : 
               syncStatus === 'completed' ? 'Base de datos clonada exitosamente (Offline-First listo)' : 
               `Error de sincronización: ${syncError}`}
            </Text>
          </View>
        </View>
      </View>

      {isReady && (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>¡Todo listo! Ya puedes trabajar sin conexión.</Text>
          <TouchableOpacity 
            style={[styles.buttonRetry, { backgroundColor: '#28a745', marginTop: 15 }]} 
            onPress={async () => {
              await AsyncStorage.setItem('@isInitialSyncComplete', 'true');
              await setSession({
                empresaId: empresaId || null,
                usuarioId: userId || null,
                userName: userName || null,
                empresaNombre: companyName || null,
              });
              setAppState('main_menu');
            }}
          >
            <Text style={styles.buttonRetryText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      )}

      {hasError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {hasInternet === false ? 'Se requiere conexión a Internet para iniciar la sincronización.' :
             userAssigned === false ? 'No tienes un usuario asignado a este dispositivo. Contacta al administrador.' :
             companyAssigned === false ? 'Tu usuario no tiene una empresa asignada. Contacta al administrador.' :
             syncStatus === 'error' ? `Ocurrió un error al sincronizar la base de datos: ${syncError}` :
             'Ocurrió un error inesperado al validar la información.'}
          </Text>
          <TouchableOpacity style={styles.buttonRetry} onPress={validateSync}>
            <Text style={styles.buttonRetryText}>Validar y Reintentar Sincronización</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
