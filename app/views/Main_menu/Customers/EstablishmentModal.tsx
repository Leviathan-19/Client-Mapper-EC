import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Location from "expo-location";

export interface EstablishmentFormData {
  id?: string;
  nombre_comercial: string;
  direccion: string;
  latitud: number | null;
  longitud: number | null;
  cliente_id: string | null;
}

interface ClientOption {
  id: string;
  nombre: string;
}

interface EstablishmentModalProps {
  visible: boolean;
  establishment?: EstablishmentFormData | null;
  clients: ClientOption[];
  defaultClienteId?: string | null;
  onClose: () => void;
  onSave: (data: EstablishmentFormData) => Promise<void>;
}

export const EstablishmentModal: React.FC<EstablishmentModalProps> = ({
  visible,
  establishment,
  clients,
  defaultClienteId = null,
  onClose,
  onSave,
}) => {
  const [nombreComercial, setNombreComercial] = useState("");
  const [direccion, setDireccion] = useState("");
  const [latitud, setLatitud] = useState("");
  const [longitud, setLongitud] = useState("");
  const [clienteId, setClienteId] = useState<string | null>(null);

  const [searchCliente, setSearchCliente] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;

    setNombreComercial(establishment?.nombre_comercial ?? "");
    setDireccion(establishment?.direccion ?? "");

    setLatitud(
      establishment?.latitud !== null && establishment?.latitud !== undefined
        ? String(establishment.latitud)
        : "",
    );

    setLongitud(
      establishment?.longitud !== null && establishment?.longitud !== undefined
        ? String(establishment.longitud)
        : "",
    );

    setClienteId(establishment?.cliente_id ?? defaultClienteId ?? null);

    setSearchCliente("");
  }, [visible, establishment, defaultClienteId]);

  const handleGetCurrentLocation = async () => {
    setLoadingLocation(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Se requiere acceso a la ubicación para capturar las coordenadas.",
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLatitud(location.coords.latitude.toFixed(6));
      setLongitud(location.coords.longitude.toFixed(6));

      Alert.alert(
        "GPS capturado",
        "La ubicación actual fue registrada correctamente.",
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message || "No se pudo obtener la ubicación.",
      );
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleSave = async () => {
    if (!nombreComercial.trim()) {
      Alert.alert("Error", "El nombre comercial es obligatorio.");
      return;
    }

    let lat: number | null = null;
    let lng: number | null = null;

    if (latitud.trim()) {
      lat = Number(latitud);

      if (!Number.isFinite(lat)) {
        Alert.alert("Error", "La latitud no es válida.");
        return;
      }
    }

    if (longitud.trim()) {
      lng = Number(longitud);

      if (!Number.isFinite(lng)) {
        Alert.alert("Error", "La longitud no es válida.");
        return;
      }
    }

    if ((lat === null && lng !== null) || (lat !== null && lng === null)) {
      Alert.alert(
        "Error",
        "Debes ingresar ambas coordenadas o dejar ambas vacías.",
      );
      return;
    }

    setSaving(true);

    try {
      await onSave({
        id: establishment?.id,
        nombre_comercial: nombreComercial.trim(),
        direccion: direccion.trim(),
        latitud: lat,
        longitud: lng,
        cliente_id: clienteId,
      });

      onClose();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message || "No se pudo guardar el establecimiento.",
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredClients = clients.filter((client) =>
    client.nombre.toLowerCase().includes(searchCliente.toLowerCase()),
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            maxHeight: "90%",
          }}
        >
          <ScrollView
            contentContainerStyle={{
              padding: 20,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                marginBottom: 20,
              }}
            >
              {establishment?.id
                ? "Editar establecimiento"
                : "Nuevo establecimiento"}
            </Text>

            <Text style={labelStyle}>Nombre comercial *</Text>

            <TextInput
              style={inputStyle}
              placeholder="Ej. Ferretería XYZ"
              placeholderTextColor="#666"
              value={nombreComercial}
              onChangeText={setNombreComercial}
            />

            <Text style={labelStyle}>Dirección</Text>

            <TextInput
              style={inputStyle}
              placeholder="Ej. Av. 10 de Agosto"
              placeholderTextColor="#666"
              value={direccion}
              onChangeText={setDireccion}
            />

            <Text style={labelStyle}>Cliente asociado</Text>

            <TouchableOpacity
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 8,
                padding: 12,
                marginBottom: 10,
              }}
              onPress={() => setClienteId(null)}
            >
              <Text
                style={{
                  color: clienteId === null ? "#007bff" : "#555",
                }}
              >
                {clienteId === null
                  ? "✓ Sin cliente (Prospecto)"
                  : "Sin cliente / quitar asociación"}
              </Text>
            </TouchableOpacity>

            <TextInput
              style={inputStyle}
              placeholder="Buscar cliente..."
              placeholderTextColor="#666"
              value={searchCliente}
              onChangeText={setSearchCliente}
            />

            {searchCliente.trim() !== "" && (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: "#ddd",
                  borderRadius: 8,
                  marginBottom: 15,
                  maxHeight: 180,
                }}
              >
                <ScrollView nestedScrollEnabled>
                  {filteredClients.map((client) => (
                    <TouchableOpacity
                      key={client.id}
                      style={{
                        padding: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: "#eee",
                        backgroundColor:
                          clienteId === client.id ? "#e3f2fd" : "#fff",
                      }}
                      onPress={() => {
                        setClienteId(client.id);
                        setSearchCliente("");
                      }}
                    >
                      <Text
                        style={{
                          fontWeight:
                            clienteId === client.id ? "bold" : "normal",
                        }}
                      >
                        {client.nombre}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  {filteredClients.length === 0 && (
                    <Text
                      style={{
                        padding: 12,
                        color: "#777",
                      }}
                    >
                      No se encontraron clientes.
                    </Text>
                  )}
                </ScrollView>
              </View>
            )}

            {clienteId && (
              <View
                style={{
                  backgroundColor: "#e8f5e9",
                  padding: 10,
                  borderRadius: 8,
                  marginBottom: 15,
                }}
              >
                <Text
                  style={{
                    color: "#2e7d32",
                    fontWeight: "bold",
                  }}
                >
                  Cliente asociado
                </Text>
              </View>
            )}

            <Text style={labelStyle}>Ubicación GPS</Text>

            <TouchableOpacity
              style={{
                backgroundColor: "#007bff",
                padding: 12,
                borderRadius: 8,
                alignItems: "center",
                marginBottom: 15,
              }}
              onPress={handleGetCurrentLocation}
              disabled={loadingLocation}
            >
              {loadingLocation ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "bold",
                  }}
                >
                  📍 Capturar ubicación actual
                </Text>
              )}
            </TouchableOpacity>

            <Text style={labelStyle}>Latitud</Text>

            <TextInput
              style={inputStyle}
              placeholder="-0.180653"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={latitud}
              onChangeText={setLatitud}
            />

            <Text style={labelStyle}>Longitud</Text>

            <TextInput
              style={inputStyle}
              placeholder="-78.467834"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={longitud}
              onChangeText={setLongitud}
            />

            <View
              style={{
                flexDirection: "row",
                gap: 10,
                marginTop: 15,
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#6c757d",
                  padding: 14,
                  borderRadius: 8,
                  alignItems: "center",
                }}
                onPress={onClose}
                disabled={saving}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "bold",
                  }}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#28a745",
                  padding: 14,
                  borderRadius: 8,
                  alignItems: "center",
                }}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: "bold",
                    }}
                  >
                    Guardar
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const labelStyle = {
  fontSize: 14,
  fontWeight: "bold" as const,
  color: "#333",
  marginBottom: 6,
};

const inputStyle = {
  borderWidth: 1,
  borderColor: "#ccc",
  borderRadius: 8,
  padding: 12,
  marginBottom: 15,
  fontSize: 15,
  backgroundColor: "#fafafa",
};
