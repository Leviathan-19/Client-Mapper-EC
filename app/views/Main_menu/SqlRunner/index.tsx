import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSession } from '../../../context/SessionContext';
import { powerSync, startSync } from '../../../powerSync';
import { supabase } from '../../../supabaseClient';

export const SqlRunner: React.FC<any> = ({ navigation }) => {
  const { empresaId, usuarioId, userName, empresaNombre } = useSession();
  const [sql, setSql] = useState<string>('SELECT * FROM clientes;');
  const [results, setResults] = useState<any[] | null>(null);
  const [writeResult, setWriteResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  
  // PowerSync Status State
  const [psStatus, setPsStatus] = useState({
    connected: false,
    connecting: false,
    downloading: false,
    uploading: false,
    statusText: '',
  });

  // Query Queue Stats
  const [queueStats, setQueueStats] = useState<{ count: number; size?: number | null } | null>(null);

  const checkStatusAndQueue = async () => {
    try {
      const status: any = powerSync.currentStatus || {};
      setPsStatus({
        connected: powerSync.connected,
        connecting: powerSync.connecting,
        downloading: status.downloading || status.dataFlowStatus?.downloading || false,
        uploading: status.uploading || status.dataFlowStatus?.uploading || false,
        statusText: status.statusText || status.error?.message || '',
      });

      const stats = await powerSync.getUploadQueueStats();
      setQueueStats(stats);
    } catch (e) {
      console.warn('Error reading status or queue stats:', e);
    }
  };

  useEffect(() => {
    // Check status immediately
    checkStatusAndQueue();
    // Poll status every 1.5 seconds
    const interval = setInterval(checkStatusAndQueue, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleSyncAction = async (action: 'connect' | 'disconnect' | 'reconnect') => {
    try {
      setLoading(true);
      setError(null);
      if (action === 'disconnect') {
        await powerSync.disconnect();
        Alert.alert('Info', 'PowerSync desconectado');
      } else if (action === 'connect') {
        await startSync();
        Alert.alert('Info', 'Conexión a PowerSync iniciada');
      } else if (action === 'reconnect') {
        await powerSync.disconnect();
        await startSync();
        Alert.alert('Info', 'Reconexión completada');
      }
      await checkStatusAndQueue();
    } catch (e: any) {
      setError(`Error en acción sync: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunSelect = async () => {
    if (!sql.trim()) return;
    setLoading(true);
    setError(null);
    setResults(null);
    setWriteResult(null);
    try {
      const rows = await powerSync.getAll<any>(sql);
      setResults(rows);
    } catch (e: any) {
      setError(e.message || 'Error desconocido ejecutando consulta SELECT');
    } finally {
      setLoading(false);
    }
  };

  const handleRunWrite = async () => {
    if (!sql.trim()) return;
    setLoading(true);
    setError(null);
    setResults(null);
    setWriteResult(null);
    try {
      const res = await powerSync.execute(sql);
      setWriteResult(res);
    } catch (e: any) {
      setError(e.message || 'Error desconocido ejecutando consulta de escritura');
    } finally {
      setLoading(false);
    }
  };

  const setTemplate = (query: string) => {
    setSql(query);
    setError(null);
  };

  // Extract columns for table view
  const columns = results && results.length > 0 ? Object.keys(results[0]) : [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>🔙</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Consola de Diagnóstico SQL</Text>
      </View>

      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        {/* Session Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Sesión del Dispositivo</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Usuario:</Text>
            <Text style={styles.value}>{userName || 'N/A'} ({usuarioId || 'Sin ID'})</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Empresa:</Text>
            <Text style={styles.value}>{empresaNombre || 'N/A'} ({empresaId || 'Sin ID'})</Text>
          </View>
        </View>

        {/* Sync Status Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Estado de PowerSync & Base de Datos</Text>
          <View style={styles.grid}>
            <View style={styles.gridCol}>
              <Text style={styles.label}>Conectado:</Text>
              <View style={styles.indicatorContainer}>
                <View style={[styles.dot, { backgroundColor: psStatus.connected ? '#28a745' : '#dc3545' }]} />
                <Text style={styles.value}>{psStatus.connected ? 'Sí' : 'No'}</Text>
              </View>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.label}>Conectando:</Text>
              <Text style={styles.value}>{psStatus.connecting ? 'Sí' : 'No'}</Text>
            </View>
          </View>

          <View style={styles.grid}>
            <View style={styles.gridCol}>
              <Text style={styles.label}>Descargando (Sync):</Text>
              <Text style={styles.value}>{psStatus.downloading ? '🔄 Sincronizando' : 'Inactivo'}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.label}>Subiendo (Offline):</Text>
              <Text style={styles.value}>{psStatus.uploading ? '⬆️ Subiendo' : 'Inactivo'}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Cola de Carga Local (Pendientes):</Text>
            <Text style={[styles.value, queueStats && queueStats.count > 0 ? styles.alertValue : null]}>
              {queueStats ? `${queueStats.count} transacciones` : 'Cargando...'}
            </Text>
          </View>

          {psStatus.statusText ? (
            <View style={styles.row}>
              <Text style={styles.label}>Mensaje:</Text>
              <Text style={styles.statusMsg}>{psStatus.statusText}</Text>
            </View>
          ) : null}

          {/* Sync Control Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.miniBtn, { backgroundColor: '#007bff' }]} onPress={() => handleSyncAction('connect')}>
              <Text style={styles.miniBtnText}>Iniciar Sync</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.miniBtn, { backgroundColor: '#ffc107' }]} onPress={() => handleSyncAction('reconnect')}>
              <Text style={[styles.miniBtnText, { color: '#000' }]}>Reconectar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.miniBtn, { backgroundColor: '#6c757d' }]} onPress={() => handleSyncAction('disconnect')}>
              <Text style={styles.miniBtnText}>Desconectar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Templates SQL */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Plantillas SQL Rápidas</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateScroll}>
            <TouchableOpacity style={styles.templateBtn} onPress={() => setTemplate("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'ps_%';")}>
              <Text style={styles.templateBtnText}>📁 Ver Tablas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.templateBtn} onPress={() => setTemplate("SELECT id, nombre, empresa_id, asignado_a, deleted_at FROM clientes;")}>
              <Text style={styles.templateBtnText}>👥 Clientes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.templateBtn} onPress={() => setTemplate("SELECT * FROM ps_crud;")}>
              <Text style={styles.templateBtnText}>🔄 Cola Sincronización</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.templateBtn} onPress={() => setTemplate("SELECT 'clientes' as tabla, count(*) as total FROM clientes UNION SELECT 'usuarios', count(*) FROM usuarios UNION SELECT 'rutas', count(*) FROM rutas UNION SELECT 'visitas', count(*) FROM visitas;")}>
              <Text style={styles.templateBtnText}>📊 Conteo Filas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.templateBtn} onPress={() => setTemplate("SELECT * FROM whitelist;")}>
              <Text style={styles.templateBtnText}>🛡️ Whitelist</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.templateBtn} onPress={() => setTemplate("SELECT * FROM usuarios;")}>
              <Text style={styles.templateBtnText}>👤 Usuarios</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Terminal Input */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Editor de Consultas SQL</Text>
          <TextInput
            style={styles.terminalInput}
            multiline
            numberOfLines={4}
            value={sql}
            onChangeText={setSql}
            placeholder="Escribe tu consulta SQL aquí..."
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.runBtn, { backgroundColor: '#28a745' }]} onPress={handleRunSelect} disabled={loading}>
              <Text style={styles.runBtnText}>Run SELECT</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.runBtn, { backgroundColor: '#dc3545' }]} onPress={handleRunWrite} disabled={loading}>
              <Text style={styles.runBtnText}>Run WRITE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.runBtn, { backgroundColor: '#6c757d' }]} onPress={() => { setSql(''); setResults(null); setWriteResult(null); setError(null); }}>
              <Text style={styles.runBtnText}>Limpiar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Results / Error Area */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={{ marginTop: 10, color: '#666' }}>Ejecutando consulta SQL...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorCardHeader}>❌ Error SQL</Text>
            <Text style={styles.errorCardBody}>{error}</Text>
          </View>
        )}

        {writeResult && (
          <View style={styles.successCard}>
            <Text style={styles.successCardHeader}>🟢 Escritura Exitosa</Text>
            <Text style={styles.successCardBody}>
              Filas Afectadas: {writeResult.rowsAffected ?? 0}
            </Text>
            {writeResult.insertId !== undefined && (
              <Text style={styles.successCardBody}>ID Insertado: {writeResult.insertId}</Text>
            )}
          </View>
        )}

        {results && (
          <View style={styles.resultsCard}>
            <View style={styles.resultsHeaderRow}>
              <Text style={styles.resultsCardHeader}>
                📋 Resultados ({results.length} filas)
              </Text>
              <View style={styles.viewModeToggle}>
                <TouchableOpacity
                  style={[styles.toggleBtn, viewMode === 'table' ? styles.toggleBtnActive : null]}
                  onPress={() => setViewMode('table')}
                >
                  <Text style={[styles.toggleBtnText, viewMode === 'table' ? styles.toggleBtnTextActive : null]}>Tabla</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, viewMode === 'json' ? styles.toggleBtnActive : null]}
                  onPress={() => setViewMode('json')}
                >
                  <Text style={[styles.toggleBtnText, viewMode === 'json' ? styles.toggleBtnTextActive : null]}>JSON</Text>
                </TouchableOpacity>
              </View>
            </View>

            {results.length === 0 ? (
              <Text style={styles.emptyResultsText}>Consulta completada. 0 filas devueltas.</Text>
            ) : viewMode === 'json' ? (
              <ScrollView style={styles.jsonScrollView} nestedScrollEnabled>
                <Text style={styles.jsonText}>{JSON.stringify(results, null, 2)}</Text>
              </ScrollView>
            ) : (
              <ScrollView horizontal style={styles.horizontalTableScroll} nestedScrollEnabled>
                <View>
                  {/* Table Header */}
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.tableHeaderCell, { width: 50 }]}>#</Text>
                    {columns.map((col) => (
                      <Text key={col} style={[styles.tableHeaderCell, { width: 140 }]}>
                        {col}
                      </Text>
                    ))}
                  </View>

                  {/* Table Rows */}
                  <ScrollView style={styles.verticalTableScroll} nestedScrollEnabled>
                    {results.map((row, index) => (
                      <View key={index} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowOdd : null]}>
                        <Text style={[styles.tableCell, { width: 50, fontWeight: 'bold' }]}>{index + 1}</Text>
                        {columns.map((col) => {
                          const val = row[col];
                          const displayVal = val === null ? 'NULL' : typeof val === 'object' ? JSON.stringify(val) : String(val);
                          return (
                            <Text key={col} style={[styles.tableCell, { width: 140 }]} numberOfLines={2}>
                              {displayVal}
                            </Text>
                          );
                        })}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </ScrollView>
            )}
          </View>
        )}
        
        {/* Extra spacing at bottom */}
        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    elevation: 3,
  },
  backButton: {
    paddingRight: 15,
  },
  backText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  gridCol: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: '#6c757d',
    fontWeight: '600',
  },
  value: {
    fontSize: 13,
    color: '#212529',
    marginTop: 2,
  },
  alertValue: {
    color: '#dc3545',
    fontWeight: 'bold',
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusMsg: {
    fontSize: 12,
    color: '#555',
    fontStyle: 'italic',
    marginTop: 2,
    flex: 1,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 8,
  },
  miniBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  miniBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  templateScroll: {
    paddingVertical: 5,
    gap: 10,
  },
  templateBtn: {
    backgroundColor: '#f1f3f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  templateBtnText: {
    fontSize: 12,
    color: '#495057',
    fontWeight: '600',
  },
  terminalInput: {
    backgroundColor: '#1e1e1e',
    color: '#39ff14',
    fontFamily: 'monospace',
    fontSize: 13,
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  runBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  runBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 15,
  },
  errorCard: {
    backgroundColor: '#fff5f5',
    borderColor: '#ffc9c9',
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  errorCardHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fa5252',
    marginBottom: 5,
  },
  errorCardBody: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#c92a2a',
  },
  successCard: {
    backgroundColor: '#f4fbf7',
    borderColor: '#c3e6cb',
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  successCardHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 5,
  },
  successCardBody: {
    fontSize: 13,
    color: '#155724',
  },
  resultsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
    paddingBottom: 8,
  },
  resultsCardHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#343a40',
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f3f5',
    borderRadius: 6,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  toggleBtnActive: {
    backgroundColor: '#ffffff',
    elevation: 1,
  },
  toggleBtnText: {
    fontSize: 11,
    color: '#6c757d',
    fontWeight: '600',
  },
  toggleBtnTextActive: {
    color: '#212529',
  },
  emptyResultsText: {
    textAlign: 'center',
    color: '#868e96',
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  jsonScrollView: {
    maxHeight: 250,
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 6,
  },
  jsonText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#495057',
  },
  horizontalTableScroll: {
    width: '100%',
  },
  verticalTableScroll: {
    maxHeight: 250,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#e9ecef',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#495057',
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
    alignItems: 'center',
  },
  tableRowOdd: {
    backgroundColor: '#f8f9fa',
  },
  tableCell: {
    fontSize: 12,
    color: '#212529',
    paddingHorizontal: 8,
  },
});
