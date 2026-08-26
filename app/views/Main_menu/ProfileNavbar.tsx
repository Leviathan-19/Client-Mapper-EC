import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSession } from '../../context/SessionContext';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../context/ThemeContext';
import { AppColors } from '../../theme/colors';

// El Navbar ahora lee DIRECTAMENTE del SessionContext (AsyncStorage),
// sin depender de SQLite. Esto garantiza que siempre muestre los datos
// aunque la sincronización de PowerSync aún no haya terminado.
export const ProfileNavbar: React.FC = () => {
  const { userName, empresaNombre } = useSession();
  const navigation = useNavigation<any>();
  const { isDarkMode, toggleTheme, colors } = useAppTheme();
  const styles = createProfileNavbarStyles(colors);

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
        accessibilityRole="switch"
        accessibilityLabel="Cambiar tema de la aplicación"
        accessibilityState={{ checked: isDarkMode }}
      >
        <View style={[styles.themeToggle, isDarkMode ? styles.themeToggleRight : styles.themeToggleLeft]}>
          <Text style={styles.themeIcon}>{isDarkMode ? '🌙' : '☀️'}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export const createProfileNavbarStyles = (colors: AppColors) => 
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
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
      color: colors.text,
    },
    companyName: {
      fontSize: 14,
      color: colors.textSecondary,
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
      backgroundColor: colors.inputBackground,
    },
    themeButtonDark: {
      backgroundColor: colors.surfaceElevated,
    },
    themeToggle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.surface,
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
      backgroundColor: colors.inputBackground,
    },
    themeIcon: {
      fontSize: 14,
      color: colors.text,
    },
  });

