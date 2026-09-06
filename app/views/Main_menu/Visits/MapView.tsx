import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Animated,
  Alert,
} from "react-native";

import * as MapboxGL from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";

import { VisitaMapItem } from "./useVisits";

const MAP_STYLE = process.env.EXPO_PUBLIC_MAP_STYLE_URL;

/**
 * Cada cuánto intentamos actualizar
 * la ubicación del usuario.
 *
 * 30 segundos.
 */
const LOCATION_UPDATE_INTERVAL = 30_000;

interface MapViewProps {
  items: VisitaMapItem[];
  onPinPress: (item: VisitaMapItem) => void;
}

/**
 * ============================================================
 * ESTILOS DE LOS ESTABLECIMIENTOS
 * ============================================================
 */

const mapStyles = {
  /**
   * Establecimientos individuales.
   */
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
   * Clusters.
   */
  clusterCircle: {
    circleColor: [
      "step",
      ["get", "point_count"],

      // 2 - 10 establecimientos
      "#2563eb",

      10,

      // 11 - 50
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

/**
 * ============================================================
 * MARCADOR DE UBICACIÓN DEL USUARIO
 * ============================================================
 *
 * Este componente NO pertenece al GeoJSONSource.
 *
 * Por eso:
 *
 * - NO forma parte de los clusters.
 * - NO se mezcla con los establecimientos.
 * - Siempre representa al usuario.
 *
 * Utilizamos Marker porque permite renderizar
 * componentes React Native personalizados.
 */
const UserLocationMarker: React.FC = () => {
  /**
   * Valor de animación del pulso.
   *
   * 0 = estado inicial
   * 1 = pulso expandido
   */
  const pulseAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    /**
     * Animación infinita.
     *
     * El círculo exterior:
     *
     * pequeño + visible
     *       ↓
     * grande + transparente
     *       ↓
     * pequeño + visible
     */
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),

        Animated.timing(pulseAnimation, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    /**
     * Detenemos la animación
     * cuando el componente desaparece.
     */
    return () => {
      animation.stop();
    };
  }, [pulseAnimation]);

  /**
   * El anillo exterior crece.
   */
  const pulseScale = pulseAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.8],
  });

  /**
   * El anillo exterior se vuelve transparente.
   */
  const pulseOpacity = pulseAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 0],
  });

  return (
    <View style={styles.userMarkerContainer}>
      {/* Anillo pulsante */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.userPulse,
          {
            transform: [
              {
                scale: pulseScale,
              },
            ],
            opacity: pulseOpacity,
          },
        ]}
      />

      {/* Anillo blanco */}
      <View pointerEvents="none" style={styles.userMarkerBorder}>
        {/* Punto azul central */}
        <View pointerEvents="none" style={styles.userMarkerDot} />
      </View>
    </View>
  );
};

export const MapView: React.FC<MapViewProps> = ({ items, onPinPress }) => {
  /**
   * ============================================================
   * REFERENCIAS
   * ============================================================
   */

  const sourceRef = useRef<MapboxGL.GeoJSONSourceRef>(null);

  const cameraRef = useRef<MapboxGL.CameraRef>(null);

  /**
   * ============================================================
   * ESTADO DE UBICACIÓN
   * ============================================================
   */

  /**
   * Indica si el modo "mi ubicación"
   * está actualmente activo.
   */
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);

  /**
   * Coordenadas actuales del usuario.
   *
   * null = no estamos mostrando ubicación.
   */
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  /**
   * Evita que se ejecuten simultáneamente
   * varias consultas GPS.
   */
  const locationRequestInProgress = useRef(false);

  /**
   * ============================================================
   * GEOJSON DE ESTABLECIMIENTOS
   * ============================================================
   */

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

          /**
           * GeoJSON:
           *
           * [longitud, latitud]
           */
          coordinates: [item.longitud, item.latitud],
        },
      })),
    };
  }, [items]);

  /**
   * ============================================================
   * ACTUALIZAR UBICACIÓN
   * ============================================================
   */

  const updateUserLocation = useCallback(async () => {
    /**
     * Evitamos consultas simultáneas.
     */
    if (locationRequestInProgress.current) {
      return;
    }

    locationRequestInProgress.current = true;

    try {
      /**
       * Verificamos que el servicio de ubicación
       * esté habilitado en el dispositivo.
       */
      const servicesEnabled = await Location.hasServicesEnabledAsync();

      if (!servicesEnabled) {
        console.log("⚠️ Los servicios de ubicación están desactivados.");

        return;
      }

      /**
       * Obtenemos la posición actual.
       *
       * High busca una precisión aproximada
       * de hasta unos metros cuando el dispositivo
       * puede proporcionarla.
       */
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const latitude = location.coords.latitude;

      const longitude = location.coords.longitude;

      /**
       * Validación.
       */
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        console.log("⚠️ Coordenadas GPS inválidas.");

        return;
      }

      /**
       * Actualizamos nuestro marcador.
       */
      setUserLocation({
        latitude,
        longitude,
      });

      console.log("📍 Ubicación actualizada:", {
        latitude,
        longitude,
        accuracy: location.coords.accuracy,
      });
    } catch (error) {
      console.error("🔴 Error obteniendo ubicación:", error);
    } finally {
      locationRequestInProgress.current = false;
    }
  }, []);

  /**
   * ============================================================
   * ACTIVAR / DESACTIVAR UBICACIÓN
   * ============================================================
   */

  const toggleUserLocation = useCallback(async () => {
    /**
     * --------------------------------------------------------
     * DESACTIVAR
     * --------------------------------------------------------
     */

    if (isLocationEnabled) {
      console.log("📍 Ubicación desactivada.");

      setIsLocationEnabled(false);

      /**
       * Al eliminar la coordenada:
       *
       * userLocation = null
       *
       * desaparece el Marker.
       */
      setUserLocation(null);

      return;
    }

    /**
     * --------------------------------------------------------
     * ACTIVAR
     * --------------------------------------------------------
     */

    try {
      console.log("📍 Solicitando permiso de ubicación...");

      /**
       * Pedimos permiso SOLO cuando el usuario
       * pulsa el botón.
       */
      const { status } = await Location.requestForegroundPermissionsAsync();

      /**
       * Usuario rechazó.
       */
      if (status !== "granted") {
        console.log("❌ Permiso de ubicación rechazado.");

        Alert.alert(
          "Ubicación desactivada",
          "Necesitamos permiso de ubicación para mostrar tu posición en el mapa.",
        );

        setIsLocationEnabled(false);

        return;
      }

      console.log("✅ Permiso de ubicación concedido.");

      /**
       * Activamos el modo.
       */
      setIsLocationEnabled(true);

      /**
       * Obtenemos inmediatamente
       * la primera ubicación.
       */
      await updateUserLocation();
    } catch (error) {
      console.error("🔴 Error activando ubicación:", error);

      setIsLocationEnabled(false);
    }
  }, [isLocationEnabled, updateUserLocation]);

  /**
   * ============================================================
   * ACTUALIZACIÓN AUTOMÁTICA CADA 30 SEGUNDOS
   * ============================================================
   */

  useEffect(() => {
    /**
     * Si la funcionalidad está desactivada,
     * no hacemos absolutamente nada.
     */
    if (!isLocationEnabled) {
      return;
    }

    console.log("🔄 Actualización automática de ubicación activada.");

    /**
     * Primera actualización inmediata
     * ya se hizo al activar el botón.
     *
     * Aquí programamos las siguientes.
     */
    const interval = setInterval(() => {
      updateUserLocation();
    }, LOCATION_UPDATE_INTERVAL);

    /**
     * IMPORTANTE:
     *
     * Al desactivar la ubicación:
     *
     * clearInterval()
     *
     * Esto evita seguir consultando GPS.
     */
    return () => {
      console.log("⏹️ Actualización automática de ubicación detenida.");

      clearInterval(interval);
    };
  }, [isLocationEnabled, updateUserLocation]);

  /**
   * ============================================================
   * CENTRAR MAPA EN EL USUARIO
   * ============================================================
   *
   * Se ejecuta cuando conseguimos la primera
   * coordenada después de activar la ubicación.
   */

  const previousUserLocation = useRef<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    if (!userLocation) {
      previousUserLocation.current = null;

      return;
    }

    /**
     * Solo centramos automáticamente
     * cuando se obtiene la primera ubicación.
     *
     * NO centramos cada 30 segundos.
     *
     * Esto es importante porque si el usuario
     * mueve manualmente el mapa no queremos
     * "secuestrar" la cámara cada 30 segundos.
     */
    if (!previousUserLocation.current) {
      cameraRef.current?.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 15,
        duration: 800,
      });
    }

    previousUserLocation.current = userLocation;
  }, [userLocation]);

  /**
   * ============================================================
   * CLICK SOBRE CLUSTER / ESTABLECIMIENTO
   * ============================================================
   */

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
     * --------------------------------------------------------
     * CLUSTER
     * --------------------------------------------------------
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
     * --------------------------------------------------------
     * ESTABLECIMIENTO
     * --------------------------------------------------------
     */

    const id = properties.id;

    if (!id) {
      return;
    }

    const selectedItem = items.find((item) => String(item.id) === String(id));

    if (selectedItem) {
      onPinPress(selectedItem);
    }
  };

  /**
   * ============================================================
   * MAP STYLE
   * ============================================================
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

  /**
   * ============================================================
   * RENDER
   * ============================================================
   */

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

        {/*
         * =====================================================
         * ESTABLECIMIENTOS + CLUSTERS
         * =====================================================
         */}

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
          {/*
           * CLUSTERS
           */}

          <MapboxGL.Layer
            id="establecimientosClusters"
            type="circle"
            filter={["has", "point_count"]}
            paint={mapStyles.clusterCircle as any}
          />

          {/*
           * ESTABLECIMIENTOS INDIVIDUALES
           */}

          <MapboxGL.Layer
            id="establecimientosLayer"
            type="circle"
            filter={["!", ["has", "point_count"]]}
            paint={mapStyles.circle as any}
          />
        </MapboxGL.GeoJSONSource>

        {/*
         * =====================================================
         * UBICACIÓN DEL USUARIO
         * =====================================================
         *
         * IMPORTANTE:
         *
         * Este Marker está FUERA del GeoJSONSource.
         *
         * Por lo tanto:
         *
         * NO se agrupa.
         * NO se convierte en cluster.
         * NO comparte colores con establecimientos.
         */}

        {userLocation && (
          <MapboxGL.Marker
            id="user-location-marker"
            lngLat={[userLocation.longitude, userLocation.latitude]}
          >
            <UserLocationMarker />
          </MapboxGL.Marker>
        )}
      </MapboxGL.Map>

      {/*
       * =======================================================
       * BOTÓN "MI UBICACIÓN"
       * =======================================================
       *
       * Está fuera del Map para poder posicionarlo
       * como una interfaz de React Native.
       */}

      <TouchableOpacity
        activeOpacity={0.75}
        onPress={toggleUserLocation}
        style={[
          styles.locationButton,
          isLocationEnabled && styles.locationButtonActive,
        ]}
      >
        <Text
          style={[
            styles.locationButtonIcon,
            isLocationEnabled && styles.locationButtonIconActive,
          ]}
        >
          🌐
        </Text>
      </TouchableOpacity>
    </View>
  );
};

/**
 * ============================================================
 * ESTILOS
 * ============================================================
 */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },

  map: {
    flex: 1,
  },

  /**
   * ==========================================================
   * BOTÓN DE UBICACIÓN
   * ==========================================================
   */

  locationButton: {
    position: "absolute",

    top: 16,
    left: 16,

    width: 50,
    height: 50,

    borderRadius: 25,

    backgroundColor: "#ffffff",

    justifyContent: "center",
    alignItems: "center",

    elevation: 5,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },

  locationButtonActive: {
    backgroundColor: "#e8f1ff",
  },

  locationButtonIcon: {
    fontSize: 32,
    lineHeight: 36,

    color: "#555555",
    fontWeight: "bold",
  },

  locationButtonIconActive: {
    color: "#1976d2",
  },

  /**
   * ==========================================================
   * MARCADOR DEL USUARIO
   * ==========================================================
   */

  userMarkerContainer: {
    width: 40,
    height: 40,

    justifyContent: "center",
    alignItems: "center",
  },

  /**
   * Anillo que crece y desaparece.
   */

  userPulse: {
    position: "absolute",

    width: 18,
    height: 18,

    borderRadius: 9,

    backgroundColor: "rgba(25, 118, 210, 0.35)",
  },

  /**
   * Círculo blanco exterior.
   */

  userMarkerBorder: {
    width: 18,
    height: 18,

    borderRadius: 9,

    backgroundColor: "#ffffff",

    justifyContent: "center",
    alignItems: "center",

    elevation: 4,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },

  /**
   * Punto azul central.
   */

  userMarkerDot: {
    width: 12,
    height: 12,

    borderRadius: 6,

    backgroundColor: "#1976d2",
  },

  /**
   * ==========================================================
   * ERROR
   * ==========================================================
   */

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
