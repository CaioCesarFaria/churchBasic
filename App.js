// App.js
import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import TabsNavigation from "./src/routes/TabsNavigation";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider, AuthContext } from "./src/context/AuthContext";
import { RadioProvider } from "./src/context/RadioContext";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import ConteudoVideo from "./src/screens/ConteudoVideo";
import LoginScreen from "./src/screens/Login";
import CadastroScreen from "./src/screens/Cadastro";
import MinisteriosScreen from "./src/screens/MinisteriosMain";
import ProfileScreen from "./src/screens/Profile";
import AdminMaster from "./src/screens/Administradores/AdminMaster";
import NewMinisterio from "./src/screens/Administradores/NewMinisterio";
import NewLider from "./src/screens/Administradores/NewLider";
import MembersAdm from "./src/screens/Administradores/MembersAdm";
import MinisteriosAdm from "./src/screens/Administradores/MinisteriosAdm";
import LideresAdm from "./src/screens/Administradores/LideresAdm";
import MinisterioComunicacaoAdmin from "./src/screens/Ministerios/MinisterioComunicacaoAdmin";
import MinisterioLouvorAdmin from "./src/screens/Ministerios/MinisterioLouvorAdmin";
import KidsMain from "./src/screens/KidsMain";
import MinisterioKidsAdmin from "./src/screens/Ministerios/MinisterioKidsAdmin";
import RadioMain from "./src/screens/RadioMain";
import BibliaMain from "./src/screens/BibliaMain";
import MinisteriosMain from "./src/screens/MinisteriosMain";
import CelulaMain from "./src/screens/CelulaMain";
import MinisterioCelulaAdmin from "./src/screens/Ministerios/MinisterioCelulaAdmin";
import AbbaTvMain from "./src/screens/AbbaTvMain";
import NewEvent from "./src/screens/Administradores/NewEvent";
import PoliticasPrivacidade from "./src/screens/PoliticasPrivacidade";
import MinisterioConexaoAdmin from "./src/screens/Ministerios/MinisterioConexaoAdmin";
import RelatoriosMinisterios from "./src/screens/Relatorios/RelatorioMinisterios";
import MinisterioConexaoRelatorio from "./src/screens/Relatorios/MinisterioConexaoRelatorio";

const Stack = createNativeStackNavigator();

// Componente de Loading
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#B8986A" />
    <Text style={styles.loadingText}>Carregando...</Text>
  </View>
);

// Componente principal de navegação
const AppNavigator = () => {
  const { loading } = useContext(AuthContext);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
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
          name="MinisteriosMain"
          component={MinisteriosMain}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="CelulaMain"
          component={CelulaMain}
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

        {/* Tela AdminMaster */}
        <Stack.Screen
          name="AdminMaster"
          component={AdminMaster}
          options={{
            headerShown: false,
          }}
        />

        {/* Telas Administrativas - Cadastros */}
        <Stack.Screen
          name="NewMinisterio"
          component={NewMinisterio}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="NewLider"
          component={NewLider}
          options={{
            headerShown: false,
          }}
        />

        {/* Páginas Administrativas - Gerenciamento */}
        <Stack.Screen name="MembersAdm" component={MembersAdm} />
        <Stack.Screen name="MinisteriosAdm" component={MinisteriosAdm} options={{
            headerShown: false,
          }} />
        <Stack.Screen name="LideresAdm" component={LideresAdm} />
        <Stack.Screen
          name="MinisterioComunicacaoAdmin"
          component={MinisterioComunicacaoAdmin}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="MinisterioLouvorAdmin"
          component={MinisterioLouvorAdmin}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="MinisterioKidsAdmin"
          component={MinisterioKidsAdmin}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="KidsMain"
          component={KidsMain}
          options={{
            headerShown: false,
          }}
        />

        {/* Tela da Rádio */}
        <Stack.Screen
          name="RadioMain"
          component={RadioMain}
          options={{
            headerShown: false,
          }}
        />
        {/* Tela da Rádio */}
        <Stack.Screen
          name="BibliaMain"
          component={BibliaMain}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="MinisterioCelulaAdmin"
          component={MinisterioCelulaAdmin}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="AbbaTvMain"
          component={AbbaTvMain}
          
        />
        <Stack.Screen
          name="NewEvent"
          component={NewEvent}
          
        />
        <Stack.Screen
          name="PoliticasPrivacidade"
          component={PoliticasPrivacidade}
          
        />
        <Stack.Screen
          name="MinisterioConexaoAdmin"
          component={MinisterioConexaoAdmin}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="RelatoriosMinisterios"
          component={RelatoriosMinisterios}
          options={{
            headerShown: false,
          }}
        />
        {/* Telas dos RELATÓRIOS */}
        <Stack.Screen
          name="MinisterioConexaoRelatorio"
          component={MinisterioConexaoRelatorio}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <RadioProvider>
        <AppNavigator />
      </RadioProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
});
