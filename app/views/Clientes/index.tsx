import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, TextInput, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useClientes, Cliente } from './useClientes';
import { styles } from './styles';

export const ClientesList: React.FC<any> = ({ navigation }) => {
  const { clientes, createCliente, updateCliente, deleteCliente } = useClientes();
  const [modalVisible, setModalVisible] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [latitud, setLatitud] = useState('');
  const [longitud, setLongitud] = useState('');
  const [estadoCliente, setEstadoCliente] = useState('activo');

  const openCreateModal = () => {
    setEditingId(null);
    setNombre('');
    setDireccion('');
    setLatitud('');
    setLongitud('');
    setEstadoCliente('activo');
    setModalVisible(true);
  };

  const openEditModal = (cliente: Cliente) => {
    setEditingId(cliente.id);
    setNombre(cliente.nombre);
    setDireccion(cliente.direccion || '');
    setLatitud(cliente.latitud ? cliente.latitud.toString() : '');
    setLongitud(cliente.longitud ? cliente.longitud.toString() : '');
    setEstadoCliente(cliente.estado_cliente || 'activo');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }
    
    try {
      const parsedLat = latitud.trim() ? parseFloat(latitud) : undefined;
      const parsedLon = longitud.trim() ? parseFloat(longitud) : undefined;

      if (editingId) {
        await updateCliente(editingId, nombre, direccion, parsedLat, parsedLon, estadoCliente);
      } else {
        await createCliente(nombre, direccion, parsedLat, parsedLon, estadoCliente);
      }
      setModalVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDelete = (id: string, nombreCli: string) => {
    Alert.alert(
      'Eliminar Cliente',
      `¿Estás seguro que deseas eliminar a ${nombreCli}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: async () => {
            try {
              await deleteCliente(id);
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          } 
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: Cliente }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.nombre}</Text>
      <Text style={styles.cardText}>Dirección: {item.direccion || 'N/A'}</Text>
      <Text style={styles.cardText}>Estado: {item.estado_cliente}</Text>
      
      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => openEditModal(item)}>
          <Text style={styles.actionText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDelete(item.id, item.nombre)}>
          <Text style={styles.actionText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Clientes</Text>
      </View>

      <FlatList
        data={clientes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>No tienes clientes registrados aún.</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modal Crear/Editar */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{editingId ? 'Editar Cliente' : 'Nuevo Cliente'}</Text>
            
            <Text style={styles.inputLabel}>Nombre (Obligatorio)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Juan Pérez"
              value={nombre}
              onChangeText={setNombre}
            />

            <Text style={styles.inputLabel}>Dirección</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Av. Principal 123"
              value={direccion}
              onChangeText={setDireccion}
            />

            <Text style={styles.inputLabel}>Latitud (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. -0.180653"
              value={latitud}
              onChangeText={setLatitud}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Longitud (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. -78.467838"
              value={longitud}
              onChangeText={setLongitud}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Estado del Cliente</Text>
            <View style={[styles.input, { padding: 0, justifyContent: 'center' }]}>
              <Picker
                selectedValue={estadoCliente}
                onValueChange={(itemValue) => setEstadoCliente(itemValue)}
                style={{ height: 50, width: '100%' }}
              >
                <Picker.Item label="Activo" value="activo" />
                <Picker.Item label="Inactivo" value="inactivo" />
                <Picker.Item label="Prospecto" value="prospecto" />
              </Picker>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSave}>
                <Text style={styles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
