import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import * as MapboxGL from '@maplibre/maplibre-react-native';
import { VisitaMapItem } from './useVisits';

const MAP_STYLE = process.env.EXPO_PUBLIC_MAP_STYLE_URL;

interface MapViewProps {
  items: VisitaMapItem[];
  onPinPress: (item: VisitaMapItem) => void;
}

const mapStyles = {
  circle: {
    circleRadius: 10,
    circleStrokeWidth: 2,
    circleStrokeColor: '#ffffff',
    circleColor: [
      'match',
      ['get', 'estado_comercial'],
      'no_interesado', '#c73737',
      'por_visitar', '#eab308',
      'atendido', '#28a745',
      '#007bff'
    ]
  }
};

export const MapView: React.FC<MapViewProps> = ({
  items,
  onPinPress
}) => {

  const geoJsonSource = useMemo(() => {

    const validItems = items.filter(
      item =>
        item.latitud !== null &&
        item.longitud !== null &&
        Number.isFinite(item.latitud) &&
        Number.isFinite(item.longitud)
    );

    return {
      type: 'FeatureCollection',
      features: validItems.map(item => ({
        type: 'Feature',
        id: item.id,
        properties: {
          id: item.id,
          nombre_comercial: item.nombre_comercial,
          estado_comercial: item.estado_comercial || 'desconocido'
        },
        geometry: {
          type: 'Point',

          // GeoJSON / MapLibre:
          // [longitud, latitud]
          coordinates: [
            item.longitud,
            item.latitud
          ]
        }
      }))
    };
  }, [items]);

  const handlePress = (e: any) => {

    const feature = e.features?.[0];

    if (!feature) {
      return;
    }

    const id = feature.properties?.id;

    if (!id) {
      return;
    }

    const selectedItem = items.find(
      item => item.id === id
    );

    if (selectedItem) {
      onPinPress(selectedItem);
    }
  };

  if (!MAP_STYLE) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Error: EXPO_PUBLIC_MAP_STYLE_URL no está configurada.
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
          console.log('🗺️ Iniciando carga del mapa...');
        }}

        onDidFinishLoadingStyle={() => {
          console.log('🟢 Style de OpenFreeMap cargado');
        }}

        onDidFinishLoadingMap={() => {
          console.log('🟢 Mapa cargado correctamente');
        }}

        onDidFailLoadingMap={(event) => {
          console.log(
            '🔴 Error cargando mapa:',
            event.nativeEvent
          );
        }}
      >

        <MapboxGL.Camera
          initialViewState={{
            zoom: 11,

            // IMPORTANTE:
            // [longitud, latitud]
            center: [-78.497218, -0.106968]
          }}
        />

        <MapboxGL.GeoJSONSource
          id="establecimientosSource"
          data={geoJsonSource as any}
          onPress={handlePress}
        >

          <MapboxGL.Layer
            id="establecimientosLayer"
            type="circle"
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
    overflow: 'hidden',
  },

  map: {
    flex: 1,
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },

  errorText: {
    fontSize: 16,
    color: '#d9534f',
    textAlign: 'center',
    fontWeight: 'bold',
  }
});
