import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, FlatList, Modal, ScrollView } from "react-native";
import { useAppTheme } from "../../../context/ThemeContext";
import { ThemedTextInput } from "../../../components/ThemedTextInput";
import { useVisits, VisitaMapItem, Visita } from "./useVisits";
import { MapView } from "./MapView";
import { createVisitsStyles } from "./styles";

export const VisitsList: React.FC<any> = ({ navigation }) => {
  const { colors } = useAppTheme();
  const styles = createVisitsStyles(colors);
  const { visitasMapItems, checkInVisit, completeVisit } = useVisits();
  
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [applyDateFilters, setApplyDateFilters] = useState(true);
  const [visitSearch, setVisitSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<VisitaMapItem | null>(null);

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

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

  const handleCheckIn = async (visitId: string) => {
    await checkInVisit(visitId);
    // El query watched actualizará el estado en background
  };

  const handleComplete = async (visitId: string) => {
    if (selectedItem) {
      await completeVisit(visitId, selectedItem.id);
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
      <View
        style={{
          marginTop: 10,
          borderTopWidth: 1,
          borderTopColor: "#eee",
          paddingTop: 10,
        }}
      >
        <Text style={styles.cardText}>
          Visitas en este rango: {
            item.visitas.filter(v => {
              if (!v.fecha_programada) return false;
              const d = new Date(v.fecha_programada);
              if (selectedMonth !== null) {
                return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
              }
              return d.getFullYear() === selectedYear;
            }).length
          }
        </Text>
      </View>
    </TouchableOpacity>
  );

  const filteredVisits = useMemo(() => {
    return visitasMapItems.filter((v) => {
      const matchSearch = v.nombre_comercial?.toLowerCase().includes(visitSearch.toLowerCase());
      
      if (!applyDateFilters) {
        return matchSearch; // Si el filtro de fechas está apagado, mostramos todos los que coincidan con la búsqueda
      }

      const matchDate = v.visitas.some(visita => {
        if (!visita.fecha_programada) return false;
        const d = new Date(visita.fecha_programada);
        const y = d.getFullYear();
        const m = d.getMonth();
        
        if (selectedMonth !== null) {
          return y === selectedYear && m === selectedMonth;
        }
        return y === selectedYear;
      });

      return matchSearch && matchDate;
    });
  }, [visitasMapItems, visitSearch, selectedYear, selectedMonth, applyDateFilters]);

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
        {/* Filter Toggle Button */}
        <TouchableOpacity 
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}
          onPress={() => setIsFilterExpanded(!isFilterExpanded)}
        >
          <Text style={{ fontWeight: 'bold', color: colors.primary, marginRight: 5 }}>
            {isFilterExpanded ? 'Ocultar Filtros' : 'Mostrar Filtros de Búsqueda y Fecha'}
          </Text>
          <Text style={{ fontSize: 12 }}>{isFilterExpanded ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {isFilterExpanded && (
          <View style={{ backgroundColor: colors.surface, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border, elevation: 2, zIndex: 5 }}>
            <ThemedTextInput
              style={styles.searchBar}
              placeholder="Buscar establecimiento..."
              value={visitSearch}
              onChangeText={setVisitSearch}
            />
            
            <View style={{ marginHorizontal: 15, marginBottom: 10 }}>
              {/* Year Selector & Toggle Filter */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                {/* Year Controls */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => setSelectedYear(y => y - 1)} style={{ padding: 10 }}>
                    <Text style={{ fontSize: 20, color: colors.primary }}>◀</Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', marginHorizontal: 10, color: colors.text }}>{selectedYear}</Text>
                  <TouchableOpacity onPress={() => setSelectedYear(y => y + 1)} style={{ padding: 10 }}>
                    <Text style={{ fontSize: 20, color: colors.primary }}>▶</Text>
                  </TouchableOpacity>
                </View>

                {/* Filter Checkbox */}
                <TouchableOpacity 
                  onPress={() => setApplyDateFilters(!applyDateFilters)}
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}
                >
                  <View style={{ 
                    width: 20, height: 20, borderWidth: 2, borderColor: colors.primary, 
                    borderRadius: 4, marginRight: 8, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: applyDateFilters ? colors.primary : 'transparent' 
                  }}>
                    {applyDateFilters && <Text style={{ color: colors.onPrimary, fontSize: 12, fontWeight: 'bold' }}>✓</Text>}
                  </View>
                  <Text style={{ color: colors.text, fontSize: 14 }}>Aplicar filtros</Text>
                </TouchableOpacity>
              </View>

              {/* Month Grid 4x3 */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
                {months.map((m, i) => (
                  <TouchableOpacity 
                    key={m} 
                    style={{ 
                      width: '23%', 
                      margin: '1%', 
                      paddingVertical: 10, 
                      backgroundColor: selectedMonth === i ? colors.primary : colors.surface, 
                      borderRadius: 8, 
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: selectedMonth === i ? colors.primary : colors.border
                    }}
                    onPress={() => setSelectedMonth(i === selectedMonth ? null : i)}
                  >
                    <Text style={{ color: selectedMonth === i ? colors.onPrimary : colors.text }}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
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

                {selectedItem.visitas && selectedItem.visitas.length > 0 ? (
                  <ScrollView style={{ maxHeight: 300, marginTop: 10, marginHorizontal: -5 }}>
                    {selectedItem.visitas.map((visita, index) => (
                      <View key={visita.id} style={{ padding: 10, margin: 5, backgroundColor: colors.inputBackground, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                        <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Visita {selectedItem.visitas.length - index}</Text>
                        
                        {visita.fecha_programada && (
                          <Text style={styles.modalText}>
                            Programada: {new Date(visita.fecha_programada).toLocaleDateString()}
                          </Text>
                        )}
                        {visita.fecha_realizada && (
                          <Text style={styles.modalText}>
                            Realizada: {new Date(visita.fecha_realizada).toLocaleDateString()}
                          </Text>
                        )}
                        <Text style={styles.modalText}>
                          Estado: {visita.estado_visita}
                        </Text>
                        
                        <View style={[styles.modalButtons, { marginTop: 15 }]}>
                          {visita.estado_visita === "programada" && (
                            <TouchableOpacity
                              style={[styles.modalButton, styles.checkInButton]}
                              onPress={() => handleCheckIn(visita.id)}
                            >
                              <Text style={styles.modalButtonText}>Check-in GPS</Text>
                            </TouchableOpacity>
                          )}

                          {visita.estado_visita === "en_curso" && (
                            <TouchableOpacity
                              style={[styles.modalButton, styles.completeButton]}
                              onPress={() => handleComplete(visita.id)}
                            >
                              <Text style={styles.modalButtonText}>Completar</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={[styles.modalText, { marginTop: 15, fontStyle: "italic" }]}>
                    No hay visitas registradas para este establecimiento.
                  </Text>
                )}

                <View style={[styles.modalButtons, { marginTop: 15 }]}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={closeDetail}
                  >
                    <Text style={styles.modalButtonText}>Cerrar Historial</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};
