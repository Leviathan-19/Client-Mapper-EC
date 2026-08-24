import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAppInit } from "../hooks/useAppInit";
import { ValidationWhitelist } from "../views/Validation_whitelist";
import { CheckSync } from "../views/Check_sync";
import { MainMenu } from "../views/Main_menu";
import { ClientesList } from "../views/Main_menu/Customers";
import { RoutesList } from "../views/Main_menu/Routes";
import { RouteDetail } from "../views/Main_menu/Routes/Detail";
import { ProductsList } from "../views/Main_menu/Products";
import { VisitsList } from "../views/Main_menu/Visits";
import { AgendamientoScreen } from "../views/Main_menu/Agendamiento";
import { ActivityIndicator, View } from "react-native";
import { ProfileNavbar } from "../views/Main_menu/ProfileNavbar";
import { SqlRunner } from "../views/Main_menu/SqlRunner";

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const { appState, setAppState, deviceId, checkDeviceStatus } = useAppInit();

  if (appState === "loading") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        <View style={{ flex: 1 }}>
          {appState === "main_menu" && <ProfileNavbar />}
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {appState === "main_menu" ? (
              // Stack Principal
              <>
                <Stack.Screen name="MainMenu" component={MainMenu} />
                <Stack.Screen name="Clientes" component={ClientesList} />
                <Stack.Screen name="Routes" component={RoutesList} />
                <Stack.Screen name="RouteDetail" component={RouteDetail} />
                <Stack.Screen name="Productos" component={ProductsList} />
                <Stack.Screen name="Visitas" component={VisitsList} />
                <Stack.Screen
                  name="Agendamiento"
                  component={AgendamientoScreen}
                />
                <Stack.Screen name="SqlRunner" component={SqlRunner} />
              </>
            ) : appState === "active" ? (
              // Stack Sincronización Inicial
              <Stack.Screen name="CheckSync">
                {(props) => (
                  <CheckSync
                    {...props}
                    deviceId={deviceId}
                    setAppState={setAppState}
                  />
                )}
              </Stack.Screen>
            ) : (
              // Stack Validación
              <Stack.Screen name="Validation">
                {(props) => (
                  <ValidationWhitelist
                    {...props}
                    appState={appState}
                    deviceId={deviceId}
                    setAppState={setAppState}
                    checkDeviceStatus={checkDeviceStatus}
                  />
                )}
              </Stack.Screen>
            )}
          </Stack.Navigator>
        </View>
      </NavigationContainer>
    </View>
  );
};
