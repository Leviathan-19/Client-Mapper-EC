import React, { useMemo, useRef } from "react";
import { View, StyleSheet, Text } from "react-native";
import * as MapboxGL from "@maplibre/maplibre-react-native";
import { VisitaMapItem } from "./useVisits";

const MAP_STYLE = process.env.EXPO_PUBLIC_MAP_STYLE_URL;

interface MapViewProps {
  items: VisitaMapItem[];
  onPinPress: (item: VisitaMapItem) => void;
}
/**
 * El tamaño depende del nivel de zoom:
 * Zoom 3  -> 2 px
 * Zoom 5  -> 3 px
 * Zoom 10 -> 5 px
 * Zoom 14 -> 7 px
 * Zoom 18 -> 9 px
 *
 * Los puntos son deliberadamente pequeños para evitar
 * que establecimientos cercanos se sobrepongan demasiado.
 */
const mapStyles = {
  circle: {
    circleRadius: [
      "interpolate",
      ["linear"],
      ["zoom"],

      3,
      2,

      5,
      3,

      10,
      5,

      14,
      7,

      18,
      9,
    ],

    circleStrokeWidth: 1.5,
    circleStrokeColor: "#ffffff",
    circleColor: [
      "match",
      ["get", "estado_comercial"],
      "no_interesado",
      "#c73737",
      "por_visitar",
      "#eab308",
      "atendido",
      "#28a745",
      // Estado desconocido
      "#007bff",
    ],
  },
  /**
   * Estilo de los clusters.
   *
   * El tamaño depende de la cantidad
   * de establecimientos agrupados.
   */
  clusterCircle: {
    circleColor: [
      "step",
      ["get", "point_count"],
      // 2 - 10 establecimientos
      "#2563eb",
      10,
      // 11 - 50 establecimientos
      "#7c3aed",
      50,
      // Más de 50
      "#dc2626",
    ],

    circleRadius: [
      "step",
      ["get", "point_count"],
      // 2 - 10
      18,
      10,
      // 11 - 50
      23,
      50,
      // Más de 50
      28,
    ],
    circleStrokeWidth: 2,
    circleStrokeColor: "#ffffff",
  },
};

export const MapView: React.FC<MapViewProps> = ({ items, onPinPress }) => {
  const sourceRef = useRef<MapboxGL.GeoJSONSourceRef>(null);
  const cameraRef = useRef<MapboxGL.CameraRef>(null);
  const geoJsonSource = useMemo(() => {
    const validItems = items.filter(
      (item) =>
        item.latitud !== null &&
        item.longitud !== null &&
        Number.isFinite(item.latitud) &&
        Number.isFinite(item.longitud),
    );

    return {
      type: "FeatureCollection",

      features: validItems.map((item) => ({
        type: "Feature",

        id: item.id,

        properties: {
          id: item.id,

          nombre_comercial: item.nombre_comercial,

          estado_comercial: item.estado_comercial || "desconocido",
        },

        geometry: {
          type: "Point",
          coordinates: [item.longitud, item.latitud],
        },
      })),
    };
  }, [items]);
  const handlePress = async (event: any) => {
    const feature = event.features?.[0];

    if (!feature) {
      return;
    }

    const properties = feature.properties;

    if (!properties) {
      return;
    }

    /**
     * =====================================================
     * CASO 1: EL USUARIO PRESIONÓ UN CLUSTER
     * =====================================================
     *
     * Los clusters creados por MapLibre tienen:
     *
     * point_count
     * cluster_id
     *
     * Por ejemplo:
     *
     * {
     *   cluster_id: 42,
     *   point_count: 25
     * }
     */
    const isCluster = properties.point_count !== undefined;

    if (isCluster) {
      const clusterId = Number(properties.cluster_id);

      if (!Number.isFinite(clusterId)) {
        return;
      }

      try {
        const expansionZoom =
          await sourceRef.current?.getClusterExpansionZoom(clusterId);

        if (expansionZoom === undefined || expansionZoom === null) {
          return;
        }
        const coordinates = feature.geometry?.coordinates;

        if (!Array.isArray(coordinates) || coordinates.length < 2) {
          return;
        }

        const longitude = Number(coordinates[0]);
        const latitude = Number(coordinates[1]);

        if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
          return;
        }

        cameraRef.current?.flyTo({
          center: [longitude, latitude],
          zoom: expansionZoom,
          duration: 500,
        });
      } catch (error) {
        console.error("🔴 Error expandiendo cluster:", error);
      }

      return;
    }

    /**
     * =====================================================
     * CASO 2: EL USUARIO PRESIONÓ UN ESTABLECIMIENTO
     * =====================================================
     */

    const id = properties.id;

    if (!id) {
      return;
    }

    /**
     * Buscamos el establecimiento original
     * dentro de "items".
     */
    const selectedItem = items.find((item) => String(item.id) === String(id));

    if (selectedItem) {
      onPinPress(selectedItem);
    }
  };

  /**
   * Si no existe la URL del estilo del mapa,
   * mostramos un mensaje en lugar del mapa.
   */
  if (!MAP_STYLE) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Error: EXPO_PUBLIC_MAP_STYLE_URL no está configurada.
          {"\n\n"}
          El mapa requiere una URL de estilo válida.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapboxGL.Map
        style={styles.map}
        mapStyle={MAP_STYLE}
        logo={true}
        attribution={true}
        onWillStartLoadingMap={() => {
          console.log("🗺️ Iniciando carga del mapa...");
        }}
        onDidFinishLoadingStyle={() => {
          console.log("🟢 Style de OpenFreeMap cargado");
        }}
        onDidFinishLoadingMap={() => {
          console.log("🟢 Mapa cargado correctamente");
        }}
        onDidFailLoadingMap={(event) => {
          console.log("🔴 Error cargando mapa:", event.nativeEvent);
        }}
      >
        {/*
         * =====================================================
         * Vista principal al inicar el mapa
         * =====================================================
         */}
        <MapboxGL.Camera
          ref={cameraRef}
          initialViewState={{
            zoom: 11,
            center: [-78.497218, -0.106968],
          }}
        />

        {/*
         * =====================================================
         * CÁMARA
         * =====================================================
         */}
        <MapboxGL.Camera
          ref={cameraRef}
          initialViewState={{
            zoom: 11,
            center: [-78.497218, -0.106968],
          }}
        />

        <MapboxGL.UserLocation heading={true} accuracy={true} />

        <MapboxGL.GeoJSONSource
          ref={sourceRef}
          id="establecimientosSource"
          data={geoJsonSource as any}
          cluster={true}
          clusterRadius={50}
          clusterMinPoints={2}
          clusterMaxZoom={14}
          onPress={handlePress}
        >
          <MapboxGL.Layer
            id="establecimientosClusters"
            type="circle"
            filter={["has", "point_count"]}
            paint={mapStyles.clusterCircle as any}
          />

          {/*
           * 🔴 no_interesado
           * 🟡 por_visitar
           * 🟢 atendido
           * 🔵 desconocido
           */}

          <MapboxGL.Layer
            id="establecimientosLayer"
            type="circle"
            filter={["!", ["has", "point_count"]]}
            paint={mapStyles.circle as any}
          />
        </MapboxGL.GeoJSONSource>
      </MapboxGL.Map>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },

  map: {
    flex: 1,
  },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },

  errorText: {
    fontSize: 16,
    color: "#d9534f",
    textAlign: "center",
    fontWeight: "bold",
  },
});
