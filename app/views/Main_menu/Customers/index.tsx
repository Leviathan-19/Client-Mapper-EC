import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { ThemedTextInput } from "../../../components/ThemedTextInput";
import {
  ThemedPicker,
  ThemedPickerItem,
} from "../../../components/ThemedPicker";
import { useAppTheme } from "../../../context/ThemeContext";
import { useClientes, Cliente } from "./useClientes";
import { createClientesStyles } from "./styles";

export const ClientesList: React.FC<any> = ({ navigation }) => {
  const { colors } = useAppTheme();
  const styles = createClientesStyles(colors);
  const { clientes, createCliente, updateCliente, deleteCliente } =
    useClientes();

  // filteredClientes definition moved after state declarations

  const [modalVisible, setModalVisible] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [estadoCliente, setEstadoCliente] = useState("activo");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [cedula, setCedula] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const openCreateModal = () => {
    setEditingId(null);
    setNombre("");
    setDireccion("");
    setCedula("");
    setCorreo("");
    setTelefono("");
    setEstadoCliente("activo");
    setModalVisible(true);
  };

  const openEditModal = (cliente: Cliente) => {
    setEditingId(cliente.id);
    setNombre(cliente.nombre);
    setDireccion(cliente.direccion || "");
    setCedula(cliente.cedula || "");
    setCorreo(cliente.correo || "");
    setTelefono(cliente.telefono || "");
    setEstadoCliente(cliente.estado_cliente || "activo");
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!nombre.trim()) {
      Alert.alert("Error", "El nombre es obligatorio");
      return;
    }

    try {
      if (editingId) {
        await updateCliente(
          editingId,
          nombre,
          direccion,
          estadoCliente,
          cedula,
          correo,
          telefono,
        );
      } else {
        await createCliente(
          nombre,
          direccion,
          estadoCliente,
          cedula,
          correo,
          telefono,
        );
      }
      setModalVisible(false);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleDelete = (id: string, nombreCli: string) => {
    Alert.alert(
      "Eliminar Cliente",
      `¿Estás seguro que deseas eliminar a ${nombreCli}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCliente(id);
            } catch (e: any) {
              Alert.alert("Error", e.message);
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: Cliente }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.nombre}</Text>
      <Text style={styles.cardText}>Dirección: {item.direccion || "N/A"}</Text>
      <Text style={styles.cardText}>Estado: {item.estado_cliente}</Text>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => openEditModal(item)}
        >
          <Text style={styles.actionText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item.id, item.nombre)}
        >
          <Text style={styles.actionText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  const filteredClientes = useMemo(() => {
    return clientes.filter((c) => {
      const matchesSearch =
        c.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.cedula?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.correo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.telefono?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesEstado =
        filterStatus === "todos" ? true : c.estado_cliente === filterStatus;
      return matchesSearch && matchesEstado;
    });
  }, [clientes, searchQuery, filterStatus]);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>🔙</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Clientes</Text>
        <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>

      <ThemedTextInput
        style={styles.searchBar}
        placeholder="Buscar clientes..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.filterPicker}>
        <ThemedPicker
          selectedValue={filterStatus}
          onValueChange={(itemValue) => setFilterStatus(itemValue as string)}
          mode="dropdown"
        >
          <ThemedPickerItem label="Todos" value="todos" />
          <ThemedPickerItem label="Activo" value="activo" />
          <ThemedPickerItem label="Inactivo" value="inactivo" />
          <ThemedPickerItem label="Prospecto" value="prospecto" />
        </ThemedPicker>
      </View>

      <FlatList
        data={filteredClientes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20, color: "#666" }}>
            No tienes clientes registrados aún.
          </Text>
        }
      />
      {/* Modal Crear/Editar */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
            style={{ width: "100%" }}
          >
            <View style={{ alignItems: "center", marginVertical: 20 }}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>
                  {editingId ? "Editar Cliente" : "Nuevo Cliente"}
                </Text>

                <Text style={styles.inputLabel}>Nombre (Obligatorio)</Text>
                <ThemedTextInput
                  style={styles.input}
                  placeholder="Ej. Juan Pérez"
                  value={nombre}
                  onChangeText={setNombre}
                />

                <Text style={styles.inputLabel}>Cédula</Text>
                <ThemedTextInput
                  style={styles.input}
                  placeholder="Ej. 1718671662"
                  value={cedula}
                  onChangeText={setCedula}
                  keyboardType="numeric"
                />

                <Text style={styles.inputLabel}>Teléfono</Text>
                <ThemedTextInput
                  style={styles.input}
                  placeholder="Ej. 0987654321"
                  value={telefono}
                  onChangeText={setTelefono}
                  keyboardType="numeric"
                />
                <Text style={styles.inputLabel}>Correo</Text>
                <ThemedTextInput
                  style={styles.input}
                  placeholder="Ej.correo@gmail.com"
                  value={correo}
                  onChangeText={setCorreo}
                />
                <Text style={styles.inputLabel}>Dirección</Text>
                <ThemedTextInput
                  style={styles.input}
                  placeholder="Ej. Av. Principal 123"
                  value={direccion}
                  onChangeText={setDireccion}
                />

                <Text style={styles.inputLabel}>Estado del Cliente</Text>
                <View
                  style={[
                    styles.input,
                    { padding: 0, justifyContent: "center" },
                  ]}
                >
                  <ThemedPicker
                    selectedValue={estadoCliente}
                    onValueChange={(itemValue) =>
                      setEstadoCliente(itemValue as string)
                    }
                    style={{ height: 50, width: "100%" }}
                    mode="dropdown"
                  >
                    <ThemedPickerItem label="Activo" value="activo" />
                    <ThemedPickerItem label="Inactivo" value="inactivo" />
                    <ThemedPickerItem label="Prospecto" value="prospecto" />
                  </ThemedPicker>
                </View>

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
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};
