import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRoutes, useRouteVisits, Visit } from './useRoutes';
import { styles } from './styles';

export const RouteDetail: React.FC<any> = ({ route, navigation }) => {
  const { rutaId, rutaNombre } = route.params;
  const visits = useRouteVisits(rutaId);
  const { establishments, clients, createVisit, deleteVisit, createEstablishment } = useRoutes();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEstId, setSelectedEstId] = useState<string>('');
  
  // New Establishment Form State
  const [isNewEst, setIsNewEst] = useState(false);
  const [estNombre, setEstNombre] = useState('');
  const [estDireccion, setEstDireccion] = useState('');
  const [estLat, setEstLat] = useState('');
  const [estLng, setEstLng] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  const openAddModal = () => {
    setIsNewEst(false);
    setEstNombre('');
    setEstDireccion('');
    setEstLat('');
    setEstLng('');
    setSelectedClientId('');
    
    // Set default selected establishment if list is not empty
    if (establishments && establishments.length > 0) {
      setSelectedEstId(establishments[0].id);
    } else {
      setSelectedEstId('');
    }
    
    setModalVisible(true);
  };

  const handleSaveVisit = async () => {
    try {
      if (isNewEst) {
        // Validate new establishment fields
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

        // Create establishment first
        const newEstId = await createEstablishment(
          estNombre,
          estDireccion,
          lat,
          lng,
          selectedClientId || undefined
        );

        // Then create visit to it
        await createVisit(rutaId, newEstId);
      } else {
        // Use existing establishment
        if (!selectedEstId) {
          Alert.alert('Error', 'Debe seleccionar un establecimiento');
          return;
        }
        await createVisit(rutaId, selectedEstId);
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

  const renderVisitItem = ({ item }: { item: Visit }) => {
    const status = getStatusStyle(item.estado_visita);
    return (
      <View style={styles.visitCard}>
        <View style={styles.visitHeader}>
          <Text style={styles.visitTitle}>{item.nombre_comercial}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={styles.statusText}>{status.text}</Text>
          </View>
        </View>

        <Text style={styles.cardText}>Dirección: {item.direccion || 'N/A'}</Text>
        
        {item.latitud_registro !== null && item.longitud_registro !== null ? (
          <Text style={styles.cardText}>
            Ubicación Check-in: {item.latitud_registro.toFixed(6)}, {item.longitud_registro.toFixed(6)}
          </Text>
        ) : null}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteVisit(item)}
          >
            <Text style={styles.actionText}>Eliminar Visita</Text>
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

      {/* Modal Agregar Visita */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Agregar Visita a la Ruta</Text>
            
            <TouchableOpacity onPress={() => setIsNewEst(!isNewEst)}>
              <Text style={styles.toggleLink}>
                {isNewEst ? '➔ Seleccionar establecimiento existente' : '➔ Registrar nuevo local en campo'}
              </Text>
            </TouchableOpacity>

            <ScrollView style={{ maxHeight: 350 }} keyboardShouldPersistTaps="handled">
              {!isNewEst ? (
                <>
                  <Text style={styles.inputLabel}>Seleccionar Establecimiento</Text>
                  {establishments && establishments.length > 0 ? (
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={selectedEstId}
                        onValueChange={(value) => setSelectedEstId(value)}
                        style={styles.picker}
                      >
                        {establishments.map((est) => (
                          <Picker.Item key={est.id} label={est.nombre_comercial} value={est.id} />
                        ))}
                      </Picker>
                    </View>
                  ) : (
                    <Text style={{ color: '#dc3545', marginVertical: 10 }}>
                      No hay locales comerciales registrados. ¡Registra uno nuevo!
                    </Text>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.inputLabel}>Nombre del Establecimiento (Obligatorio)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej. Tienda Don Pepe"
                    value={estNombre}
                    onChangeText={setEstNombre}
                  />

                  <Text style={styles.inputLabel}>Dirección</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej. Av. De los Granados y 6 de Diciembre"
                    value={estDireccion}
                    onChangeText={setEstDireccion}
                  />

                  <Text style={styles.inputLabel}>Latitud (GPS)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej. -0.180653"
                    value={estLat}
                    onChangeText={setEstLat}
                    keyboardType="numeric"
                  />

                  <Text style={styles.inputLabel}>Longitud (GPS)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej. -78.467834"
                    value={estLng}
                    onChangeText={setEstLng}
                    keyboardType="numeric"
                  />

                  <Text style={styles.inputLabel}>Cliente / Dueño (Opcional)</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={selectedClientId}
                      onValueChange={(value) => setSelectedClientId(value)}
                      style={styles.picker}
                    >
                      <Picker.Item label="Ninguno (Mantener como Prospecto)" value="" />
                      {clients.map((cli) => (
                        <Picker.Item key={cli.id} label={cli.nombre} value={cli.id} />
                      ))}
                    </Picker>
                  </View>
                </>
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
                <Text style={styles.modalButtonText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
