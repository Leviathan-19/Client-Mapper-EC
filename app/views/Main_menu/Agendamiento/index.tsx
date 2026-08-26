import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as Location from "expo-location";
import { useAgendamiento, AgendamientoProduct } from "./useAgendamiento";
import { styles } from "./styles";

const PickerItem = ({ label, value, ...props }: any) => (
  <Picker.Item label={label} value={value} color="#000000" {...props} />
);

const CustomTextInput = (props: any) => (
  <TextInput placeholderTextColor="#000000" {...props} />
);

export const AgendamientoScreen: React.FC<any> = ({ navigation }) => {
  const { clientes, establecimientos, rutas, productos, saveAgendamiento } =
    useAgendamiento();

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [rutaId, setRutaId] = useState<string>("");
  const [newRutaNombre, setNewRutaNombre] = useState<string>("");

  const [establecimientoId, setEstablecimientoId] = useState<string>("");
  const [newEstNombre, setNewEstNombre] = useState<string>("");
  const [newEstDireccion, setNewEstDireccion] = useState<string>("");
  const [latitud, setLatitud] = useState<number | null>(null);
  const [longitud, setLongitud] = useState<number | null>(null);

  const [clienteId, setClienteId] = useState<string>("");
  const [newCliNombre, setNewCliNombre] = useState<string>("");
  const [newCliCedula, setNewCliCedula] = useState<string>("");
  const [newCliTelefono, setNewCliTelefono] = useState<string>("");

  const [fechaProgramada, setFechaProgramada] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [estadoVisita, setEstadoVisita] = useState<string>("programada");

  const [selectedProducts, setSelectedProducts] = useState<
    AgendamientoProduct[]
  >([]);
  const [currentProductSelection, setCurrentProductSelection] =
    useState<string>("");

  // Handle Establishment Change
  const handleEstablecimientoChange = (val: string) => {
    setEstablecimientoId(val);
    if (val) {
      const selectedEst = establecimientos.find((e) => e.id === val);
      if (selectedEst && selectedEst.cliente_id) {
        setClienteId(selectedEst.cliente_id);
      }
    }
  };

  const captureLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso denegado",
        "Se necesita acceso a la ubicación para registrar el establecimiento.",
      );
      return;
    }
    const location = await Location.getCurrentPositionAsync({});
    setLatitud(location.coords.latitude);
    setLongitud(location.coords.longitude);
    Alert.alert("Éxito", "Coordenadas capturadas correctamente");
  };

  const handleAddProduct = () => {
    if (!currentProductSelection) return;
    const prod = productos.find((p) => p.id === currentProductSelection);
    if (!prod) return;

    if (selectedProducts.find((p) => p.id === prod.id)) {
      Alert.alert("Aviso", "El producto ya está en la lista");
      return;
    }

    setSelectedProducts([
      ...selectedProducts,
      {
        id: prod.id,
        nombre: prod.nombre,
        precio_unitario: prod.precio_unitario?.toString() || "0",
        cantidad: "1",
      },
    ]);
    setCurrentProductSelection("");
  };

  const removeProduct = (id: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== id));
  };

  const updateProductField = (
    id: string,
    field: "cantidad" | "precio_unitario",
    value: string,
  ) => {
    setSelectedProducts(
      selectedProducts.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);

      const isNewRuta = !rutaId && newRutaNombre.trim();
      if (!rutaId && !isNewRuta) {
        throw new Error("Debe seleccionar o crear una ruta.");
      }

      const isNewEst = !establecimientoId;
      if (isNewEst) {
        if (!newEstNombre.trim())
          throw new Error(
            "Debe proporcionar el nombre del nuevo establecimiento.",
          );
        if (!latitud || !longitud)
          throw new Error(
            "Debe capturar las coordenadas para el nuevo establecimiento.",
          );
      }

      await saveAgendamiento(
        rutaId || null,
        newRutaNombre,
        establecimientoId || null,
        { nombre: newEstNombre, direccion: newEstDireccion, latitud, longitud },
        clienteId || null,
        {
          nombre: newCliNombre,
          cedula: newCliCedula,
          telefono: newCliTelefono,
        },
        {
          fecha_programada: fechaProgramada,
          fecha_realizada: null,
          estado: estadoVisita,
        },
        selectedProducts,
      );

      Alert.alert("Éxito", "Agendamiento guardado correctamente", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>🔙</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agendamiento</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* RUTA SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Ruta</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={rutaId}
              onValueChange={setRutaId}
              mode="dropdown"
              style={{ color: "#ffffffff", backgroundColor: "#ec5a16ff" }}
              dropdownIconColor="#000000ff"
            >
              <PickerItem
                label="-- Seleccione una Ruta --"
                value=""
                color="#ffffffff"
              />
              {rutas.map((r: any) => (
                <PickerItem
                  key={r.id}
                  label={r.nombre}
                  value={r.id}
                  color="#ffffffff"
                />
              ))}
            </Picker>
          </View>
          {!rutaId && (
            <CustomTextInput
              style={styles.input}
              placeholder="Crear Ruta"
              value={newRutaNombre}
              onChangeText={setNewRutaNombre}
              color="#000000ff"
            />
          )}
        </View>

        {/* ESTABLECIMIENTO SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            2. Establecimiento (Obligatorio)
          </Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={establecimientoId}
              onValueChange={handleEstablecimientoChange}
            >
              <PickerItem
                color="#000000ff"
                label="-- Seleccione o Cree Nuevo --"
                value=""
              />
              {establecimientos.map((e: any) => (
                <PickerItem
                  key={e.id}
                  label={e.nombre_comercial}
                  value={e.id}
                  color="#000000ff"
                />
              ))}
            </Picker>
          </View>

          {!establecimientoId && (
            <>
              <CustomTextInput
                style={styles.input}
                placeholder="Nombre Comercial"
                value={newEstNombre}
                onChangeText={setNewEstNombre}
              />
              <CustomTextInput
                style={[styles.input, { marginTop: 10 }]}
                placeholder="Dirección"
                value={newEstDireccion}
                onChangeText={setNewEstDireccion}
              />

              <TouchableOpacity
                style={styles.buttonSecondary}
                onPress={captureLocation}
              >
                <Text style={styles.buttonSecondaryText}>
                  {latitud && longitud
                    ? "📍 Coordenadas Capturadas"
                    : "📍 Capturar Coordenadas GPS"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* CLIENTE SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Cliente (Opcional)</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={clienteId} onValueChange={setClienteId}>
              <PickerItem
                label="-- Seleccione un Cliente --"
                value=""
                color="#000000ff"
              />
              {clientes.map((c: any) => (
                <PickerItem
                  key={c.id}
                  label={c.nombre}
                  value={c.id}
                  color="#000000ff"
                />
              ))}
            </Picker>
          </View>

          {!clienteId && (
            <>
              <Text style={{ fontSize: 12, color: "#666", marginBottom: 5 }}>
                O complete para crear nuevo:
              </Text>
              <CustomTextInput
                style={styles.input}
                placeholder="Nombre del Cliente"
                value={newCliNombre}
                onChangeText={setNewCliNombre}
              />
              <View style={{ flexDirection: "row", marginTop: 10, gap: 10 }}>
                <CustomTextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Cédula"
                  value={newCliCedula}
                  onChangeText={setNewCliCedula}
                  keyboardType="numeric"
                />
                <CustomTextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Teléfono"
                  value={newCliTelefono}
                  onChangeText={setNewCliTelefono}
                  keyboardType="numeric"
                />
              </View>
            </>
          )}
        </View>

        {/* VISITA DETAILS SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Detalles de Visita</Text>
          <Text style={styles.inputLabel}>Fecha Programada (YYYY-MM-DD)</Text>
          <CustomTextInput
            style={styles.input}
            value={fechaProgramada}
            onChangeText={setFechaProgramada}
          />
          <Text style={styles.inputLabel}>Estado </Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={estadoVisita}
              onValueChange={setEstadoVisita}
              style={{ color: "#000000ff" }}
            >
              <PickerItem
                label="Programada"
                value="programada"
                color="#000000ff"
              />
              <PickerItem
                label="Completada"
                value="completada"
                color="#000000ff"
              />
            </Picker>
          </View>
        </View>

        {/* PRODUCTOS SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Productos (Opcional)</Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <View
              style={[styles.pickerContainer, { flex: 1, marginBottom: 0 }]}
            >
              <Picker
                selectedValue={currentProductSelection}
                onValueChange={setCurrentProductSelection}
                style={{ backgroundColor: "#ffffff" }}
              >
                <PickerItem
                  label="-- Añadir Producto --"
                  value=""
                  color="#000000ff"
                />
                {productos.map((p: any) => (
                  <PickerItem
                    key={p.id}
                    label={p.nombre}
                    value={p.id}
                    color="#000000ff"
                  />
                ))}
              </Picker>
            </View>
            <TouchableOpacity
              style={[styles.saveButton, { marginLeft: 10 }]}
              onPress={handleAddProduct}
            >
              <Text style={styles.saveButtonText}>Agregar</Text>
            </TouchableOpacity>
          </View>

          {selectedProducts.map((prod) => (
            <View key={prod.id} style={styles.productRow}>
              <Text style={styles.productName} numberOfLines={1}>
                {prod.nombre}
              </Text>
              <CustomTextInput
                style={styles.productInput}
                value={prod.cantidad}
                onChangeText={(val: string) =>
                  updateProductField(prod.id, "cantidad", val)
                }
                keyboardType="numeric"
                placeholder="Cant"
              />
              <CustomTextInput
                style={styles.productInput}
                value={prod.precio_unitario}
                onChangeText={(val: string) =>
                  updateProductField(prod.id, "precio_unitario", val)
                }
                keyboardType="numeric"
                placeholder="Precio"
              />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeProduct(prod.id)}
              >
                <Text style={styles.removeButtonText}>X</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};
