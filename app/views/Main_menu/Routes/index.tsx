import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, TextInput, Alert } from 'react-native';
import { useRoutes, Route } from './useRoutes';
import { styles } from './styles';

export const RoutesList: React.FC<any> = ({ navigation }) => {
  const { routes, createRoute, updateRouteName } = useRoutes();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');

  const openCreateModal = () => {
    setEditingId(null);
    setNombre('');
    setModalVisible(true);
  };

  const openEditModal = (route: Route) => {
    setEditingId(route.id);
    setNombre(route.nombre);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre de la ruta es obligatorio');
      return;
    }

    try {
      if (editingId) {
        await updateRouteName(editingId, nombre);
      } else {
        await createRoute(nombre);
      }
      setModalVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return 'N/A';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('es-EC', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString.split('T')[0];
    }
  };

  const renderItem = ({ item }: { item: Route }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('RouteDetail', { rutaId: item.id, rutaNombre: item.nombre })}
    >
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>{item.nombre}</Text>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => openEditModal(item)}
        >
          <Text style={styles.actionText}>Editar</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.cardText}>Fecha: {formatDate(item.fecha || item.created_at)}</Text>
      <Text style={styles.cardText}>Creador: {item.creador_nombre || 'N/A'}</Text>
      
      <View style={styles.cardFooter}>
        <View style={styles.visitsBadge}>
          <Text style={styles.visitsBadgeText}>
            {item.total_visitas === 1 ? '1 Visita' : `${item.total_visitas || 0} Visitas`}
          </Text>
        </View>
        <Text style={{ fontSize: 12, color: '#007bff', fontWeight: 'bold' }}>
          Ver detalle ➔
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>🔙</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rutas Planificadas</Text>
        <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={routes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay rutas planificadas aún.</Text>
        }
      />

      {/* Modal Crear/Editar Ruta */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {editingId ? 'Editar Nombre de Ruta' : 'Nueva Ruta'}
            </Text>

            <Text style={styles.inputLabel}>Nombre de la Ruta (Obligatorio)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Ruta Norte - Vendedores"
              value={nombre}
              onChangeText={setNombre}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSave}
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
