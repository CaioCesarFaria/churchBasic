// App.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import TabsNavigation from "./src/routes/TabsNavigation";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider } from "./src/context/AuthContext";
import ConteudoVideo from "./src/screens/ConteudoVideo";
import LoginScreen from "./src/screens/Login";
import CadastroScreen from "./src/screens/Cadastro";
import MinisteriosScreen from "./src/screens/Ministerios";
import ProfileScreen from "./src/screens/Profile";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AuthProvider>
    <NavigationContainer>
      <Stack.Navigator>
        {/* Tabs como tela principal */}
        <Stack.Screen
          name="Início"
          component={TabsNavigation}
          options={{ headerShown: false }}
        />

        {/* Tela de vídeo (alvo do CardVideo) */}
        <Stack.Screen
          name="ConteudoVideo"
          component={ConteudoVideo}
          options={({ route }) => ({
            title: route?.params?.title || "Vídeo",
            headerStyle: {
              backgroundColor: "#fff",
            },
            headerTitleStyle: {
              color: "#333",
            },
            headerTintColor: "#B8986A",
          })}
        />

        {/* Tela de Login */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />

        {/* Tela de Cadastro */}
        <Stack.Screen
          name="Cadastro"
          component={CadastroScreen}
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />

        {/* Tela de Ministérios */}
        <Stack.Screen
          name="Ministerios"
          component={MinisteriosScreen}
          options={{
            headerShown: false,
          }}
        />

        {/* Tela de Perfil */}
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
    </AuthProvider>
  );
}
