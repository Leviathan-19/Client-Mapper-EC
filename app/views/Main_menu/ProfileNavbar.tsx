import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSession } from '../../context/SessionContext';
import { useNavigation } from '@react-navigation/native';

// El Navbar ahora lee DIRECTAMENTE del SessionContext (AsyncStorage),
// sin depender de SQLite. Esto garantiza que siempre muestre los datos
// aunque la sincronización de PowerSync aún no haya terminado.
export const ProfileNavbar: React.FC = () => {
  const { userName, empresaNombre } = useSession();
  const navigation = useNavigation<any>();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // TODO: Implementar la actualización del tema global aquí
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileInfo}>
        <Text style={styles.greeting}>Hola, {userName || 'Cargando...'}</Text>
        <Text style={styles.companyName}>Empresa: {empresaNombre || 'Cargando...'}</Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.themeButton, isDarkMode ? styles.themeButtonDark : styles.themeButtonLight]} 
        onPress={toggleTheme}
        activeOpacity={0.8}
      >
        <View style={[styles.themeToggle, isDarkMode ? styles.themeToggleRight : styles.themeToggleLeft]}>
          <Text style={styles.themeIcon}>{isDarkMode ? '🌙' : '☀️'}</Text>
        </View>
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
  themeButton: {
    width: 60,
    height: 32,
    borderRadius: 16,
    padding: 2,
    justifyContent: 'center',
    marginLeft: 10,
  },
  themeButtonLight: {
    backgroundColor: '#e9ecef',
  },
  themeButtonDark: {
    backgroundColor: '#343a40',
  },
  themeToggle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  themeToggleLeft: {
    alignSelf: 'flex-start',
  },
  themeToggleRight: {
    alignSelf: 'flex-end',
    backgroundColor: '#495057',
  },
  themeIcon: {
    fontSize: 14,
  },
});

