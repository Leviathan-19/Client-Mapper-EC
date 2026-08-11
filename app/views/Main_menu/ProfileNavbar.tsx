import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSession } from '../../context/SessionContext';
import { useNavigation } from '@react-navigation/native';

// El Navbar ahora lee DIRECTAMENTE del SessionContext (AsyncStorage),
// sin depender de SQLite. Esto garantiza que siempre muestre los datos
// aunque la sincronización de PowerSync aún no haya terminado.
export const ProfileNavbar: React.FC = () => {
  const { userName, empresaNombre } = useSession();
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <View style={styles.profileInfo}>
        <Text style={styles.greeting}>Hola, {userName || 'Cargando...'}</Text>
        <Text style={styles.companyName}>Empresa: {empresaNombre || 'Cargando...'}</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.settingsButton} 
        onPress={() => navigation.navigate('SqlRunner')}
        activeOpacity={0.7}
      >
        <Text style={styles.settingsIcon}>⚙️</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileInfo: {
    flexDirection: 'column',
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  companyName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f1f3f5',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  settingsIcon: {
    fontSize: 22,
    color: '#495057',
  },
});

