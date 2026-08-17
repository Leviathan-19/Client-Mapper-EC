import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useProducts, Producto } from './useProducts';
import { styles } from './styles';

export const ProductsList: React.FC<any> = ({ navigation }) => {
  const { productos, createProducto, updateProducto, deleteProducto } = useProducts();

  const [modalVisible, setModalVisible] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precioUnitario, setPrecioUnitario] = useState('');
  const [activo, setActivo] = useState(1);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');

  const openCreateModal = () => {
    setEditingId(null);
    setNombre('');
    setCodigo('');
    setDescripcion('');
    setPrecioUnitario('');
    setActivo(1);
    setModalVisible(true);
  };

  const openEditModal = (producto: Producto) => {
    setEditingId(producto.id);
    setNombre(producto.nombre);
    setCodigo(producto.codigo || '');
    setDescripcion(producto.descripcion || '');
    setPrecioUnitario(producto.precio_unitario?.toString() || '0');
    setActivo(producto.activo);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }
    
    const precioNum = parseFloat(precioUnitario);
    if (isNaN(precioNum) || precioNum < 0) {
      Alert.alert('Error', 'El precio debe ser un número válido y no negativo');
      return;
    }

    try {
      if (editingId) {
        await updateProducto(editingId, nombre, codigo, descripcion, precioNum, activo);
      } else {
        await createProducto(nombre, codigo, descripcion, precioNum, activo);
      }
      setModalVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDelete = (id: string, nombreProd: string) => {
    Alert.alert(
      'Desactivar Producto',
      `¿Estás seguro que deseas desactivar ${nombreProd}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Desactivar', style: 'destructive', onPress: async () => {
            try {
              await deleteProducto(id);
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          } 
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: Producto }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.nombre}</Text>
      <Text style={styles.cardText}>Código: {item.codigo || 'N/A'}</Text>
      <Text style={styles.cardText}>Precio: ${item.precio_unitario?.toFixed(2) || '0.00'}</Text>
      <Text style={styles.cardText}>Estado: {item.activo === 1 ? 'Activo' : 'Inactivo'}</Text>
      
      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => openEditModal(item)}>
          <Text style={styles.actionText}>Editar</Text>
        </TouchableOpacity>
        {item.activo === 1 && (
          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDelete(item.id, item.nombre)}>
            <Text style={styles.actionText}>Desactivar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const filteredProductos = useMemo(() => {
    return productos.filter(p => {
      const matchesSearch =
        p.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.codigo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.descripcion?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesEstado = 
        filterStatus === 'todos' ? true :
        filterStatus === 'activo' ? p.activo === 1 :
        p.activo === 0;

      return matchesSearch && matchesEstado;
    });
  }, [productos, searchQuery, filterStatus]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 24, color: '#007bff' }}>🔙</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Catálogo de Productos</Text>
        <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchBar}
        placeholder="Buscar por código o nombre..."
        placeholderTextColor="#999"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.filterPicker}>
        <Picker selectedValue={filterStatus} onValueChange={(itemValue) => setFilterStatus(itemValue)}>
          <Picker.Item label="Todos" value="todos" />
          <Picker.Item label="Activos" value="activo" />
          <Picker.Item label="Inactivos" value="inactivo" />
        </Picker>
      </View>

      <FlatList
        data={filteredProductos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>No hay productos registrados.</Text>}
      />

      {/* Modal Crear/Editar */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}} style={{width: '100%'}}>
            <View style={{alignItems: 'center', marginVertical: 20}}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>{editingId ? 'Editar Producto' : 'Nuevo Producto'}</Text>
                
                <Text style={styles.inputLabel}>Nombre (Obligatorio)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Taladro Percutor 800W"
                  placeholderTextColor="#999"
                  value={nombre}
                  onChangeText={setNombre}
                />

                <Text style={styles.inputLabel}>Código</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. TPT-800"
                  placeholderTextColor="#999"
                  value={codigo}
                  onChangeText={setCodigo}
                />

                <Text style={styles.inputLabel}>Descripción</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Descripción detallada"
                  placeholderTextColor="#999"
                  value={descripcion}
                  onChangeText={setDescripcion}
                  multiline
                />

                <Text style={styles.inputLabel}>Precio Unitario</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. 120.50"
                  placeholderTextColor="#999"
                  value={precioUnitario}
                  onChangeText={setPrecioUnitario}
                  keyboardType="numeric"
                />

                <Text style={styles.inputLabel}>Estado</Text>
                <View style={[styles.input, { padding: 0, justifyContent: 'center' }]}>
                  <Picker
                    selectedValue={activo}
                    onValueChange={(itemValue) => setActivo(itemValue)}
                    style={{ height: 50, width: '100%', color: '#333' }}
                    dropdownIconColor="#333"
                    mode="dropdown"
                  >
                    <Picker.Item label="Activo" value={1} />
                    <Picker.Item label="Inactivo" value={0} />
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
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};
