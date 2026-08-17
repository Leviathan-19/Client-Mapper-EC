import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useMainMenu } from './useMainMenu';
import { styles } from './styles';

export const MainMenu: React.FC<any> = ({ navigation }) => {
  const { isOnline } = useMainMenu();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ClientMapper ERP</Text>
          <View style={styles.networkIndicator}>
            <View style={[styles.dot, { backgroundColor: isOnline ? '#28a745' : '#dc3545' }]} />
            <Text style={styles.networkText}>{isOnline ? 'Online' : 'Offline'}</Text>
          </View>
        </View>

        {/* Grid de Opciones */}
        <ScrollView contentContainerStyle={styles.grid}>
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Clientes')}>
            <Text style={{ fontSize: 32 }}>👥</Text>
            <Text style={styles.cardTitle}>Clientes</Text>
            <Text style={styles.cardSubtitle}>Gestionar cartera</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Routes')}>
            <Text style={{ fontSize: 32 }}>🗺️</Text>
            <Text style={styles.cardTitle}>Rutas</Text>
            <Text style={styles.cardSubtitle}>Ver planificaciones</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Visitas')}>
            <Text style={{ fontSize: 32 }}>📍</Text>
            <Text style={styles.cardTitle}>Visitas</Text>
            <Text style={styles.cardSubtitle}>Registrar actividad</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Productos')}>
            <Text style={{ fontSize: 32 }}>📦</Text>
            <Text style={styles.cardTitle}>Productos</Text>
            <Text style={styles.cardSubtitle}>Catálogo</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};
