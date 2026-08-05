import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSession } from '../../context/SessionContext';
import { usePowerSync } from '@powersync/react-native';

export const ProfileNavbar: React.FC = () => {
  const { usuarioId, empresaId } = useSession();
  const powerSync = usePowerSync();
  const [nombre, setNombre] = useState<string>('Cargando...');
  const [empresa, setEmpresa] = useState<string>('Cargando...');

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        if (usuarioId) {
          const userRes = await powerSync.getOptional<{ nombre: string }>(
            `SELECT nombre FROM usuarios WHERE id = ?`,
            [usuarioId]
          );
          if (userRes) setNombre(userRes.nombre);
        }
        if (empresaId) {
          const empRes = await powerSync.getOptional<{ nombre: string }>(
            `SELECT nombre FROM empresas WHERE id = ?`,
            [empresaId]
          );
          if (empRes) setEmpresa(empRes.nombre);
        }
      } catch (err) {
        console.error('Error fetching profile data:', err);
      }
    };

    fetchDatos();
  }, [usuarioId, empresaId]);

  return (
    <View style={styles.container}>
      <View style={styles.profileInfo}>
        <Text style={styles.greeting}>Hola, {nombre}</Text>
        <Text style={styles.companyName}>Empresa: {empresa}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 50, // Safe area approx
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
