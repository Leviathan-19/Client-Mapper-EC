import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as Location from "expo-location";
import { useAgendamiento, AgendamientoProduct } from "./useAgendamiento";
import { createAgendamientoStyles } from "./styles";
import { useAppTheme } from "../../../context/ThemeContext";
import {
  ThemedPicker,
  ThemedPickerItem,
  ThemedPickerContainer,
} from "../../../components/ThemedPicker";
import { ThemedTextInput } from "../../../components/ThemedTextInput";

export const AgendamientoScreen: React.FC<any> = ({ navigation }) => {
  const { clientes, establecimientos, rutas, productos, saveAgendamiento } =
    useAgendamiento();
  const { colors } = useAppTheme();
  const styles = createAgendamientoStyles(colors);

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

  // Búsqueda en listas
  const [rutaSearch, setRutaSearch] = useState("");
  const [establecimientoSearch, setEstablecimientoSearch] = useState("");
  const [clienteSearch, setClienteSearch] = useState("");
  const [productoSearch, setProductoSearch] = useState("");

  const filteredRutas = useMemo(() => {
    const list = rutas.filter((r: any) =>
      r.nombre?.toLowerCase().includes(rutaSearch.toLowerCase()),
    );
    // Mostrar solo las últimas 5 si no hay búsqueda
    return rutaSearch ? list : list.slice(-5);
  }, [rutas, rutaSearch]);

  const filteredEstablecimientos = useMemo(() => {
    const list = establecimientos.filter((e: any) =>
      e.nombre_comercial
        ?.toLowerCase()
        .includes(establecimientoSearch.toLowerCase()),
    );
    return establecimientoSearch ? list : list.slice(-5);
  }, [establecimientos, establecimientoSearch]);

  const filteredClientes = useMemo(() => {
    const searchLower = clienteSearch.toLowerCase();
    const list = clientes.filter(
      (c: any) =>
        c.nombre?.toLowerCase().includes(searchLower) ||
        (c.cedula && c.cedula.includes(searchLower)) ||
        (c.telefono && c.telefono.includes(searchLower)),
    );
    return clienteSearch ? list : list.slice(-5);
  }, [clientes, clienteSearch]);

  const filteredProductos = useMemo(() => {
    const list = productos.filter((p: any) =>
      p.nombre?.toLowerCase().includes(productoSearch.toLowerCase()),
    );
    return productoSearch ? list : list.slice(-5);
  }, [productos, productoSearch]);

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
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.saveButtonText}>Guardar</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* RUTA SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Ruta</Text>
          <ThemedTextInput
            style={[styles.input, { marginBottom: 10 }]}
            placeholder="🔍 Buscar ruta..."
            value={rutaSearch}
            onChangeText={setRutaSearch}
          />
          <ThemedPickerContainer style={styles.pickerContainer}>
            <ThemedPicker
              selectedValue={rutaId}
              onValueChange={(val) => setRutaId(String(val))}
              mode="dropdown"
            >
              <ThemedPickerItem label="-- Seleccione una Ruta --" value="" />
              {filteredRutas.map((r: any) => (
                <ThemedPickerItem key={r.id} label={r.nombre} value={r.id} />
              ))}
            </ThemedPicker>
          </ThemedPickerContainer>
          {!rutaId && (
            <ThemedTextInput
              style={styles.input}
              placeholder="Crear Ruta"
              value={newRutaNombre}
              onChangeText={setNewRutaNombre}
            />
          )}
        </View>

        {/* ESTABLECIMIENTO SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            2. Establecimiento (Obligatorio)
          </Text>
          <ThemedTextInput
            style={[styles.input, { marginBottom: 10 }]}
            placeholder="🔍 Buscar establecimiento..."
            value={establecimientoSearch}
            onChangeText={setEstablecimientoSearch}
          />
          <ThemedPickerContainer style={styles.pickerContainer}>
            <ThemedPicker
              selectedValue={establecimientoId}
              onValueChange={(val) => handleEstablecimientoChange(String(val))}
              mode="dropdown"
            >
              <ThemedPickerItem
                label="-- Seleccione o Cree Nuevo --"
                value=""
              />
              {filteredEstablecimientos.map((e: any) => (
                <ThemedPickerItem
                  key={e.id}
                  label={e.nombre_comercial}
                  value={e.id}
                />
              ))}
            </ThemedPicker>
          </ThemedPickerContainer>

          {!establecimientoId && (
            <>
              <ThemedTextInput
                style={styles.input}
                placeholder="Nombre Comercial"
                value={newEstNombre}
                onChangeText={setNewEstNombre}
              />
              <ThemedTextInput
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
          <ThemedTextInput
            style={[styles.input, { marginBottom: 10 }]}
            placeholder="🔍 Buscar cliente..."
            value={clienteSearch}
            onChangeText={setClienteSearch}
          />
          <ThemedPickerContainer style={styles.pickerContainer}>
            <ThemedPicker
              selectedValue={clienteId}
              onValueChange={(val) => setClienteId(String(val))}
              mode="dropdown"
            >
              <ThemedPickerItem label="-- Seleccione un Cliente --" value="" />
              {filteredClientes.map((c: any) => (
                <ThemedPickerItem key={c.id} label={c.nombre} value={c.id} />
              ))}
            </ThemedPicker>
          </ThemedPickerContainer>

          {!clienteId && (
            <>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  marginBottom: 5,
                }}
              >
                O complete para crear nuevo:
              </Text>
              <ThemedTextInput
                style={styles.input}
                placeholder="Nombre del Cliente"
                value={newCliNombre}
                onChangeText={setNewCliNombre}
              />
              <View style={{ flexDirection: "row", marginTop: 10, gap: 10 }}>
                <ThemedTextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Cédula"
                  value={newCliCedula}
                  onChangeText={setNewCliCedula}
                  keyboardType="numeric"
                />
                <ThemedTextInput
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
          <ThemedTextInput
            style={styles.input}
            value={fechaProgramada}
            onChangeText={setFechaProgramada}
          />
          <Text style={styles.inputLabel}>Estado </Text>
          <ThemedPickerContainer style={styles.pickerContainer}>
            <ThemedPicker
              selectedValue={estadoVisita}
              onValueChange={(val) => setEstadoVisita(String(val))}
              mode="dropdown"
            >
              <ThemedPickerItem label="Programada" value="programada" />
              <ThemedPickerItem label="Completada" value="completada" />
            </ThemedPicker>
          </ThemedPickerContainer>
        </View>

        {/* PRODUCTOS SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Productos (Opcional)</Text>
          <ThemedTextInput
            style={[styles.input, { marginBottom: 10 }]}
            placeholder="🔍 Buscar producto..."
            value={productoSearch}
            onChangeText={setProductoSearch}
          />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <ThemedPickerContainer
              style={[styles.pickerContainer, { flex: 1, marginBottom: 0 }]}
            >
              <ThemedPicker
                selectedValue={currentProductSelection}
                onValueChange={(val) => setCurrentProductSelection(String(val))}
                mode="dropdown"
              >
                <ThemedPickerItem label="-- Añadir Producto --" value="" />
                {filteredProductos.map((p: any) => (
                  <ThemedPickerItem key={p.id} label={p.nombre} value={p.id} />
                ))}
              </ThemedPicker>
            </ThemedPickerContainer>
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
              <ThemedTextInput
                style={styles.productInput}
                value={prod.cantidad}
                onChangeText={(val: string) =>
                  updateProductField(prod.id, "cantidad", val)
                }
                keyboardType="numeric"
                placeholder="Cant"
              />
              <ThemedTextInput
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
