import React from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

export interface CustomerEstablishment {
  id: string;
  cliente_id: string | null;
  nombre_comercial: string;
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
}

interface EstablishmentsListProps {
  establishments: CustomerEstablishment[];
  onAdd: () => void;
  onEdit: (establishment: CustomerEstablishment) => void;
  onRemoveClient: (establishment: CustomerEstablishment) => void;
}

export const EstablishmentsList: React.FC<EstablishmentsListProps> = ({
  establishments,
  onAdd,
  onEdit,
  onRemoveClient,
}) => {
  const renderItem = ({ item }: { item: CustomerEstablishment }) => {
    const hasGps = item.latitud !== null && item.longitud !== null;

    return (
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 10,
          padding: 15,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: "#e0e0e0",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 17,
                fontWeight: "bold",
                color: "#222",
              }}
            >
              {item.nombre_comercial}
            </Text>

            <Text
              style={{
                color: "#666",
                marginTop: 5,
              }}
            >
              📍 {item.direccion || "Sin dirección"}
            </Text>

            {hasGps && (
              <Text
                style={{
                  color: "#555",
                  fontSize: 12,
                  marginTop: 5,
                }}
              >
                GPS: {item.latitud?.toFixed(6)}, {item.longitud?.toFixed(6)}
              </Text>
            )}

            {!hasGps && (
              <Text
                style={{
                  color: "#d97706",
                  fontSize: 12,
                  marginTop: 5,
                }}
              >
                ⚠ Sin coordenadas GPS
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={() => onEdit(item)}
            style={{
              backgroundColor: "#007bff",
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 6,
              marginLeft: 10,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontWeight: "bold",
              }}
            >
              Editar
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            marginTop: 12,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: "#eee",
          }}
        >
          <TouchableOpacity onPress={() => onRemoveClient(item)}>
            <Text
              style={{
                color: "#dc3545",
                fontWeight: "bold",
                fontSize: 13,
              }}
            >
              Desasociar cliente
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 15,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
          }}
        >
          Establecimientos ({establishments.length})
        </Text>

        <TouchableOpacity
          onPress={onAdd}
          style={{
            backgroundColor: "#28a745",
            paddingHorizontal: 14,
            paddingVertical: 9,
            borderRadius: 7,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontWeight: "bold",
            }}
          >
            + Agregar
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={establishments}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View
            style={{
              padding: 20,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: "#777",
                textAlign: "center",
              }}
            >
              Este cliente todavía no tiene establecimientos asociados.
            </Text>

            <TouchableOpacity
              onPress={onAdd}
              style={{
                marginTop: 15,
                backgroundColor: "#007bff",
                paddingHorizontal: 15,
                paddingVertical: 10,
                borderRadius: 7,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontWeight: "bold",
                }}
              >
                Crear establecimiento
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};
