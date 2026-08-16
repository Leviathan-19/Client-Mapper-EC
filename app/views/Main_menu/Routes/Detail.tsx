import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, TextInput, Alert, ScrollView, ActivityIndicator, Platform } from 'react-native';
import * as Location from 'expo-location';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRoutes, useRouteVisits, Visit } from './useRoutes';
import { styles } from './styles';

export const RouteDetail: React.FC<any> = ({ route, navigation }) => {
  const { rutaId, rutaNombre } = route.params;
  const visits = useRouteVisits(rutaId);
  const { establishments, createVisit, deleteVisit, updateVisitStatus, updateVisitDate, createEstablishment } = useRoutes();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
  
  const [selectedEstId, setSelectedEstId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Establishment Form State
  const [isNewEst, setIsNewEst] = useState(false);
  const [estNombre, setEstNombre] = useState('');
  const [estDireccion, setEstDireccion] = useState('');
  const [estLat, setEstLat] = useState('');
  const [estLng, setEstLng] = useState('');
  
  // Location capture state
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Date selection states
  const [hasProgDate, setHasProgDate] = useState(false);
  const [hasProgTime, setHasProgTime] = useState(false);
  const [progDate, setProgDate] = useState(new Date());
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const openAddModal = () => {
    setEditingVisitId(null);
    setIsNewEst(false);
    setEstNombre('');
    setEstDireccion('');
    setEstLat('');
    setEstLng('');
    setSearchQuery('');
    setSelectedEstId('');
    
    // Reset date/time selection states
    setHasProgDate(false);
    setHasProgTime(false);
    setProgDate(new Date());
    
    setModalVisible(true);
  };

  const openEditModal = (visit: Visit) => {
    setEditingVisitId(visit.id);
    
    if (visit.fecha_programada) {
      setHasProgDate(true);
      const dateObj = new Date(visit.fecha_programada);
      
      // If valid date
      if (!isNaN(dateObj.getTime())) {
        setProgDate(dateObj);
      } else {
        setProgDate(new Date());
      }
      
      // Check if it's a date-only timestamp (e.g. ends with T12:00:00 or no T)
      if (visit.fecha_programada.includes('T12:00:00') || !visit.fecha_programada.includes('T')) {
        setHasProgTime(false);
      } else {
        setHasProgTime(true);
      }
    } else {
      setHasProgDate(false);
      setHasProgTime(false);
      setProgDate(new Date());
    }
    
    setModalVisible(true);
  };

  const handleGetCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso Denegado', 'Se requiere acceso a la ubicación para capturar coordenadas.');
        setIsLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (location && location.coords) {
        setEstLat(location.coords.latitude.toFixed(6));
        setEstLng(location.coords.longitude.toFixed(6));
        Alert.alert('Éxito', 'Coordenadas GPS capturadas correctamente.');
      }
    } catch (err: any) {
      Alert.alert('Error', 'No se pudo obtener la ubicación: ' + err.message);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleSaveVisit = async () => {
    try {
      let formattedProgDate: string | null = null;
      if (hasProgDate) {
        if (hasProgTime) {
          formattedProgDate = progDate.toISOString();
        } else {
          // Mid-day to avoid timezone offset shifts when syncing
          const dateOnly = new Date(progDate);
          dateOnly.setHours(12, 0, 0, 0);
          formattedProgDate = dateOnly.toISOString().split('T')[0];
        }
      }

      if (editingVisitId) {
        // Editing existing visit date
        await updateVisitDate(editingVisitId, formattedProgDate);
      } else {
        // Creating new visit
        if (isNewEst) {
          if (!estNombre.trim()) {
            Alert.alert('Error', 'El nombre comercial es obligatorio');
            return;
          }
          
          const lat = estLat.trim() ? parseFloat(estLat) : 0;
          const lng = estLng.trim() ? parseFloat(estLng) : 0;

          if (isNaN(lat) || isNaN(lng)) {
            Alert.alert('Error', 'Latitud y Longitud deben ser coordenadas numéricas válidas');
            return;
          }

          const newEstId = await createEstablishment(
            estNombre,
            estDireccion,
            lat,
            lng
          );

          await createVisit(rutaId, newEstId, formattedProgDate);
        } else {
          if (!selectedEstId) {
            Alert.alert('Error', 'Debe seleccionar un establecimiento');
            return;
          }
          await createVisit(rutaId, selectedEstId, formattedProgDate);
        }
      }
      setModalVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDeleteVisit = (visit: Visit) => {
    Alert.alert(
      'Eliminar Visita',
      `¿Está seguro de eliminar la visita a ${visit.nombre_comercial}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVisit(visit.id);
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  const handleUpdateStatus = async (visitId: string, newStatus: string) => {
    try {
      await updateVisitStatus(visitId, newStatus);
    } catch (e: any) {
      Alert.alert('Error', 'No se pudo cambiar el estado: ' + e.message);
    }
  };

  const handleStatusPress = (visit: Visit) => {
    Alert.alert(
      'Cambiar Estado de la Visita',
      'Selecciona el nuevo estado:',
      [
        { text: 'Programada', onPress: () => handleUpdateStatus(visit.id, 'programada') },
        { text: 'En Curso', onPress: () => handleUpdateStatus(visit.id, 'en_curso') },
        { text: 'Completada', onPress: () => handleUpdateStatus(visit.id, 'completada') },
        { text: 'Cancelada', onPress: () => handleUpdateStatus(visit.id, 'cancelada') },
        { text: 'Cancelar', style: 'cancel' }
      ],
      { cancelable: true }
    );
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completada':
        return { bg: '#28a745', text: 'Completada' };
      case 'en_curso':
        return { bg: '#007bff', text: 'En Curso' };
      case 'cancelada':
        return { bg: '#dc3545', text: 'Cancelada' };
      default:
        return { bg: '#ff8800', text: 'Programada' };
    }
  };

  const formatVisitDate = (isoString: string | null) => {
    if (!isoString) return 'N/A';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      
      if (isoString.length === 10 && !isoString.includes('T')) {
        const [year, month, day] = isoString.split('-').map(Number);
        const localDate = new Date(year, month - 1, day);
        return localDate.toLocaleDateString('es-EC', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }

      const datePart = date.toLocaleDateString('es-EC', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      const timePart = date.toLocaleTimeString('es-EC', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      return `${datePart} ${timePart}`;
    } catch {
      return isoString;
    }
  };

  const onChangeDatePicker = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(progDate);
      newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      setProgDate(newDate);
    }
  };

  const onChangeTimePicker = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (selectedDate) {
      const newDate = new Date(progDate);
      newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
      setProgDate(newDate);
    }
  };

  // Filtrar establecimientos
  const filteredEsts = React.useMemo(() => {
    if (!establishments) return [];
    
    if (!searchQuery.trim()) {
      const sorted = [...establishments].sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });
      return sorted.slice(0, 5);
    }
    
    return establishments.filter(est => 
      est.nombre_comercial.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [establishments, searchQuery]);

  const renderVisitItem = ({ item }: { item: Visit }) => {
    const status = getStatusStyle(item.estado_visita);
    return (
      <View style={styles.visitCard}>
        <View style={styles.visitHeader}>
          <Text style={styles.visitTitle}>{item.nombre_comercial}</Text>
          <TouchableOpacity onPress={() => handleStatusPress(item)}>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Text style={styles.statusText}>{status.text} ⟳</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.cardText}>Dirección: {item.direccion || 'N/A'}</Text>
        
        {item.fecha_programada ? (
          <Text style={styles.cardText}>Programada: {formatVisitDate(item.fecha_programada)}</Text>
        ) : (
          <Text style={styles.cardText}>Programada: Sin fecha</Text>
        )}

        {item.fecha_realizada ? (
          <Text style={styles.cardText}>Realizada: {formatVisitDate(item.fecha_realizada)}</Text>
        ) : null}

        {item.latitud_registro !== null && item.longitud_registro !== null ? (
          <Text style={styles.cardText}>
            GPS Registro: {item.latitud_registro.toFixed(6)}, {item.longitud_registro.toFixed(6)}
          </Text>
        ) : null}

        <View style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
          marginTop: 10,
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          paddingTop: 10,
          gap: 10
        }}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton, { marginTop: 0 }]}
            onPress={() => openEditModal(item)}
          >
            <Text style={styles.actionText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton, { marginTop: 0 }]}
            onPress={() => handleDeleteVisit(item)}
          >
            <Text style={styles.actionText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>🔙</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{rutaNombre}</Text>
        <TouchableOpacity style={styles.fab} onPress={openAddModal}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Visitas Programadas ({visits.length})</Text>

      <FlatList
        data={visits}
        keyExtractor={(item) => item.id}
        renderItem={renderVisitItem}
        contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 20 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay visitas en esta ruta aún.</Text>
        }
      />

      {/* Modal Agregar / Editar Visita */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {editingVisitId ? 'Editar Fecha de Visita' : 'Agregar Visita a la Ruta'}
            </Text>
            
            <ScrollView style={{ maxHeight: 400 }} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
              
              {!editingVisitId && (
                <View style={{ marginBottom: 15 }}>
                  <TouchableOpacity onPress={() => setIsNewEst(!isNewEst)}>
                    <Text style={styles.toggleLink}>
                      {isNewEst ? 'Seleccionar establecimiento existente' : 'Ingresar nueva empresa o local'}
                    </Text>
                  </TouchableOpacity>

                  {!isNewEst ? (
                    <>
                      <Text style={styles.inputLabel}>Buscar Establecimiento</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Escribe para buscar..."
                        placeholderTextColor="#666"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                      />

                      <Text style={styles.inputLabel}>
                        {searchQuery.trim() === '' ? 'Establecimientos Recientes (Máx. 5)' : 'Resultados de Búsqueda'}
                      </Text>
                      
                      {filteredEsts.length > 0 ? (
                        <View style={{ maxHeight: 150, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, overflow: 'hidden', marginBottom: 15 }}>
                          <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                            {filteredEsts.map((est) => (
                              <TouchableOpacity
                                key={est.id}
                                style={{
                                  padding: 12,
                                  backgroundColor: selectedEstId === est.id ? '#e3f2fd' : '#fff',
                                  borderBottomWidth: 1,
                                  borderBottomColor: '#f0f0f0',
                                }}
                                onPress={() => setSelectedEstId(est.id)}
                              >
                                <Text style={{ fontWeight: selectedEstId === est.id ? 'bold' : 'normal', color: '#333' }}>
                                  {est.nombre_comercial}
                                </Text>
                                {est.direccion ? (
                                  <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{est.direccion}</Text>
                                ) : null}
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      ) : (
                        <Text style={{ color: '#888', fontStyle: 'italic', marginBottom: 15 }}>
                          No se encontraron establecimientos.
                        </Text>
                      )}
                    </>
                  ) : (
                    <>
                      <Text style={styles.inputLabel}>Nombre del Establecimiento (Obligatorio)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Ej. Tienda Don Pepe"
                        placeholderTextColor="#666"
                        value={estNombre}
                        onChangeText={setEstNombre}
                      />

                      <Text style={styles.inputLabel}>Dirección</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Ej. Av. De los Granados y 6 de Diciembre"
                        placeholderTextColor="#666"
                        value={estDireccion}
                        onChangeText={setEstDireccion}
                      />

                      {/* GPS Capture Button */}
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#007bff',
                          padding: 12,
                          borderRadius: 8,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 15,
                          flexDirection: 'row',
                        }}
                        onPress={handleGetCurrentLocation}
                        disabled={isLoadingLocation}
                      >
                        {isLoadingLocation ? (
                          <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                        ) : null}
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
                          {isLoadingLocation ? 'Obteniendo GPS...' : '📍 Capturar ubicación actual (GPS)'}
                        </Text>
                      </TouchableOpacity>

                      <Text style={styles.inputLabel}>Latitud (GPS)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Ej. -0.180653"
                        placeholderTextColor="#666"
                        value={estLat}
                        onChangeText={setEstLat}
                        keyboardType="numeric"
                      />

                      <Text style={styles.inputLabel}>Longitud (GPS)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Ej. -78.467834"
                        placeholderTextColor="#666"
                        value={estLng}
                        onChangeText={setEstLng}
                        keyboardType="numeric"
                      />
                    </>
                  )}
                </View>
              )}

              {/* Date & Time Selectors */}
              <Text style={styles.inputLabel}>Fecha Programada (Opcional)</Text>
              <TouchableOpacity
                style={{
                  backgroundColor: '#f1f3f5',
                  padding: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                  marginBottom: 15,
                  borderWidth: 1,
                  borderColor: '#ccc',
                }}
                onPress={() => setHasProgDate(!hasProgDate)}
              >
                <Text style={{ fontWeight: 'bold', color: hasProgDate ? '#28a745' : '#555' }}>
                  {hasProgDate ? '📅 Programar Visita (Activado)' : '📅 Sin Programar (Desactivado)'}
                </Text>
              </TouchableOpacity>

              {hasProgDate && (
                <View style={{ backgroundColor: '#fdfdfd', borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 15, marginBottom: 15 }}>
                  <Text style={{ fontSize: 13, color: '#666', fontWeight: 'bold', marginBottom: 10 }}>Seleccionar Fecha</Text>
                  
                  <TouchableOpacity
                    style={{
                      borderWidth: 1,
                      borderColor: '#007bff',
                      backgroundColor: '#e6f2ff',
                      padding: 12,
                      borderRadius: 8,
                      alignItems: 'center',
                      marginBottom: 15
                    }}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={{ fontSize: 16, color: '#0056b3', fontWeight: '600' }}>
                      {progDate.toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </Text>
                  </TouchableOpacity>

                  {showDatePicker && (
                    <DateTimePicker
                      value={progDate}
                      mode="date"
                      display="default"
                      onChange={onChangeDatePicker}
                    />
                  )}

                  <TouchableOpacity
                    style={{
                      backgroundColor: '#f1f3f5',
                      padding: 10,
                      borderRadius: 6,
                      alignItems: 'center',
                      marginBottom: 10,
                      borderWidth: 1,
                      borderColor: '#ddd',
                    }}
                    onPress={() => setHasProgTime(!hasProgTime)}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: hasProgTime ? '#007bff' : '#555' }}>
                      {hasProgTime ? '⏰ Definir Hora (Activado)' : '⏰ Definir Hora (Desactivado)'}
                    </Text>
                  </TouchableOpacity>

                  {hasProgTime && (
                    <View style={{ marginTop: 5 }}>
                      <TouchableOpacity
                        style={{
                          borderWidth: 1,
                          borderColor: '#28a745',
                          backgroundColor: '#eafaf1',
                          padding: 12,
                          borderRadius: 8,
                          alignItems: 'center',
                        }}
                        onPress={() => setShowTimePicker(true)}
                      >
                        <Text style={{ fontSize: 16, color: '#1e7e34', fontWeight: '600' }}>
                          {progDate.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </Text>
                      </TouchableOpacity>
                      
                      {showTimePicker && (
                        <DateTimePicker
                          value={progDate}
                          mode="time"
                          display="default"
                          is24Hour={true}
                          onChange={onChangeTimePicker}
                        />
                      )}
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveVisit}
              >
                <Text style={styles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
