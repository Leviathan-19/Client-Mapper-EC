import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, FlatList, Modal } from "react-native";
import { useAppTheme } from "../../../context/ThemeContext";
import { ThemedTextInput } from "../../../components/ThemedTextInput";
import { useVisits, VisitaMapItem } from "./useVisits";
import { MapView } from "./MapView";
import { createVisitsStyles } from "./styles";

export const VisitsList: React.FC<any> = ({ navigation }) => {
  const { colors } = useAppTheme();
  const styles = createVisitsStyles(colors);
  const { visitasMapItems, checkInVisit, completeVisit } = useVisits();
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [visitSearch, setVisitSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<VisitaMapItem | null>(null);

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "no_interesado":
        return "#c73737";
      case "por_visitar":
        return "#eab308";
      case "atendido":
        return "#28a745";
      default:
        return "#007bff";
    }
  };

  const handlePinPress = (item: VisitaMapItem) => {
    setSelectedItem(item);
  };

  const closeDetail = () => setSelectedItem(null);

  const handleCheckIn = async () => {
    if (selectedItem?.ultima_visita) {
      await checkInVisit(selectedItem.ultima_visita.id);
      closeDetail();
    }
  };

  const handleComplete = async () => {
    if (selectedItem?.ultima_visita) {
      await completeVisit(selectedItem.ultima_visita.id, selectedItem.id);
      closeDetail();
    }
  };

  const renderListItem = ({ item }: { item: VisitaMapItem }) => (
    <TouchableOpacity style={styles.card} onPress={() => handlePinPress(item)}>
      <Text style={styles.cardTitle}>{item.nombre_comercial}</Text>
      <Text style={styles.cardText}>{item.direccion || "Sin dirección"}</Text>
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.estado_comercial) },
        ]}
      >
        <Text style={styles.statusText}>
          {item.estado_comercial || "desconocido"}
        </Text>
      </View>
      {item.ultima_visita && (
        <View
          style={{
            marginTop: 10,
            borderTopWidth: 1,
            borderTopColor: "#eee",
            paddingTop: 10,
          }}
        >
          <Text style={styles.cardText}>
            Estado Visita: {item.ultima_visita.estado_visita}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const filteredVisits = useMemo(() => {
    return visitasMapItems.filter((v) =>
      v.nombre_comercial?.toLowerCase().includes(visitSearch.toLowerCase()),
    );
  }, [visitasMapItems, visitSearch]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ fontSize: 24, color: "#007bff" }}>🔙</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Visitas Planificadas</Text>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() =>
            setViewMode((prev) => (prev === "list" ? "map" : "list"))
          }
        >
          <Text style={styles.toggleText}>
            {viewMode === "list" ? "🗺️ Mapa" : "📋 Lista"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {viewMode === "list" && (
          <ThemedTextInput
            style={styles.searchBar}
            placeholder="Buscar establecimiento..."
            value={visitSearch}
            onChangeText={setVisitSearch}
          />
        )}
        {viewMode === "list" ? (
          <FlatList
            data={filteredVisits}
            keyExtractor={(item) => item.id}
            renderItem={renderListItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text
                style={{ textAlign: "center", marginTop: 30, color: "#666" }}
              >
                No hay establecimientos asignados a tus rutas.
              </Text>
            }
          />
        ) : (
          <MapView items={filteredVisits} onPinPress={handlePinPress} />
        )}
      </View>

      {/* Modal Detalle Establecimiento */}
      <Modal visible={!!selectedItem} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedItem && (
              <>
                <Text style={styles.modalTitle}>
                  {selectedItem.nombre_comercial}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {selectedItem.direccion}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 15,
                  }}
                >
                  <Text style={styles.modalText}>Estado comercial: </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: getStatusColor(
                          selectedItem.estado_comercial,
                        ),
                        marginTop: 0,
                      },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {selectedItem.estado_comercial}
                    </Text>
                  </View>
                </View>

                {selectedItem.cliente_id && (
                  <>
                    <Text style={styles.sectionTitle}>Cliente Asociado</Text>
                    <Text style={styles.modalText}>
                      {selectedItem.cliente_nombre}
                    </Text>
                  </>
                )}

                {selectedItem.ultima_visita ? (
                  <>
                    <Text style={styles.sectionTitle}>Última Visita</Text>
                    <Text style={styles.modalText}>
                      Estado: {selectedItem.ultima_visita.estado_visita}
                    </Text>
                    {selectedItem.ultima_visita.fecha_programada && (
                      <Text style={styles.modalText}>
                        Programada para:{" "}
                        {new Date(
                          selectedItem.ultima_visita.fecha_programada,
                        ).toLocaleDateString()}
                      </Text>
                    )}
                  </>
                ) : (
                  <Text
                    style={[
                      styles.modalText,
                      { marginTop: 15, fontStyle: "italic" },
                    ]}
                  >
                    No hay visitas registradas para este establecimiento.
                  </Text>
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={closeDetail}
                  >
                    <Text style={styles.modalButtonText}>Cerrar</Text>
                  </TouchableOpacity>

                  {selectedItem.ultima_visita &&
                    selectedItem.ultima_visita.estado_visita ===
                      "programada" && (
                      <TouchableOpacity
                        style={[styles.modalButton, styles.checkInButton]}
                        onPress={handleCheckIn}
                      >
                        <Text style={styles.modalButtonText}>Check-in GPS</Text>
                      </TouchableOpacity>
                    )}

                  {selectedItem.ultima_visita &&
                    selectedItem.ultima_visita.estado_visita === "en_curso" && (
                      <TouchableOpacity
                        style={[styles.modalButton, styles.completeButton]}
                        onPress={handleComplete}
                      >
                        <Text style={styles.modalButtonText}>Completar</Text>
                      </TouchableOpacity>
                    )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};
