import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSession } from '../../context/SessionContext';

// El Navbar ahora lee DIRECTAMENTE del SessionContext (AsyncStorage),
// sin depender de SQLite. Esto garantiza que siempre muestre los datos
// aunque la sincronización de PowerSync aún no haya terminado.
export const ProfileNavbar: React.FC = () => {
  const { userName, empresaNombre } = useSession();

  return (
    <View style={styles.container}>
      <View style={styles.profileInfo}>
        <Text style={styles.greeting}>Hola, {userName || 'Cargando...'}</Text>
        <Text style={styles.companyName}>Empresa: {empresaNombre || 'Cargando...'}</Text>
      </View>
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
  },
  profileInfo: {
    flexDirection: 'column',
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
});
