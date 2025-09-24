// TabsNavigation.js
import React, { useContext, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Platform, Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

// Importar as telas
import ConteudosScreen from "../screens/Conteudos";
import ProgramacaoScreen from "../screens/Programacao";
import HomeScreen from "../screens/Home";
import GenerosidadeScreen from "../screens/Generosidade";
import MaisScreen from "../screens/Mais";
import AdminMaster from "../screens/Administradores/AdminMaster";
import KidsMain from "../screens/KidsMain";
import RadioMain from "../screens/RadioMain";
import { AuthContext } from "../context/AuthContext";
import BibliaMain from "../screens/BibliaMain";
import MinisteriosMain from "../screens/MinisteriosMain";
import CelulaMain from "../screens/CelulaMain";
import AbbaTvMain from "../screens/AbbaTvMain";
import MinisterioMembros from "../screens/Ministerios/MinisterioMembros";

// Importar as telas de ministérios para navegação dentro das tabs
import MinisterioComunicacaoAdmin from "../screens/Ministerios/MinisterioComunicacaoAdmin";
import MinisterioCelulaAdmin from "../screens/Ministerios/MinisterioCelulaAdmin";
import MinisterioKidsAdmin from "../screens/Ministerios/MinisterioKidsAdmin";
import MinisterioLouvorAdmin from "../screens/Ministerios/MinisterioLouvorAdmin";
import MinisterioDiaconatoAdmin from "../screens/Ministerios/MinisterioDiaconatoAdmin";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Componente de tela bloqueada
function LockedScreen({ screenName, onLoginPress }) {
  return (
    <View style={styles.lockedScreen}>
      <Ionicons name="lock-closed-outline" size={80} color="#B8986A" />
      <Text style={styles.lockedTitle}>{screenName}</Text>
      <Text style={styles.lockedMessage}>
        Esta seção requer login para ser acessada.
      </Text>
      <TouchableOpacity 
        style={styles.loginButton}
        onPress={onLoginPress}
      >
        <Text style={styles.loginButtonText}>Fazer Login</Text>
      </TouchableOpacity>
    </View>
  );
}

// Stack Navigator para a tela "Mais" que inclui Kids e Radio
function MaisStackNavigator() {
  return (
    // LOCAR PARA ADICIONAR TELAS QUE PRECISAR TEM O BOTTOMTABS
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MaisScreen" component={MaisScreen} />
      <Stack.Screen name="KidsMain" component={KidsMain} />
      <Stack.Screen name="RadioMain" component={RadioMain} />
      <Stack.Screen name="BibliaMain" component={BibliaMain} />
      <Stack.Screen name="MinisteriosMain" component={MinisteriosMain} />
      <Stack.Screen name="CelulaMain" component={CelulaMain} />
      <Stack.Screen name="AbbaTvMain" component={AbbaTvMain} />
      
      {/* TELA DE MINISTÉRIOS DO MEMBRO - AGORA COM BOTTOM TABS */}
      <Stack.Screen name="MinisterioMembros" component={MinisterioMembros} />
      
      {/* TELAS DOS MINISTÉRIOS - AGORA COM BOTTOM TABS */}
      <Stack.Screen name="MinisterioComunicacaoAdmin" component={MinisterioComunicacaoAdmin} />
      <Stack.Screen name="MinisterioCelulaAdmin" component={MinisterioCelulaAdmin} />
      <Stack.Screen name="MinisterioKidsAdmin" component={MinisterioKidsAdmin} />
      <Stack.Screen name="MinisterioLouvorAdmin" component={MinisterioLouvorAdmin} />
      <Stack.Screen name="MinisterioDiaconatoAdmin" component={MinisterioDiaconatoAdmin} />
      
      {/* Adicionar AdminMaster aqui para poder navegar do botão da Home */}
      <Stack.Screen name="AdminMaster" component={AdminMaster} />
    </Stack.Navigator>
  );
}

// Stack Navigator para Conteúdos (caso precise adicionar subpáginas no futuro)
function ConteudosStackNavigator() {
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();

  const handleLoginPress = () => {
    navigation.navigate("Login");
  };

  const ConteudosProtected = () => {
    return user ? <ConteudosScreen /> : <LockedScreen screenName="Conteúdos" onLoginPress={handleLoginPress} />;
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ConteudosScreen" component={ConteudosProtected} />
    </Stack.Navigator>
  );
}

// Stack Navigator para Home - AGORA TODOS VÃO PARA A HOME PRIMEIRO
function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* TODOS os usuários (incluindo adminMaster) vão para HomeScreen primeiro */}
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      {/* AdminMaster pode navegar para sua tela específica através do botão na Home */}
      <Stack.Screen name="AdminMaster" component={AdminMaster} />
    </Stack.Navigator>
  );
}

export default function TabsNavigation() {
  const { user, userData } = useContext(AuthContext);
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);

  const handleGoToLogin = () => {
    setModalVisible(false);
    navigation.navigate("Login");
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: "#007bff",
          tabBarInactiveTintColor: "#777",
          tabBarStyle: {
            backgroundColor: "#fff",
            height: Platform.OS === "ios" ? 80 : 100,
            paddingBottom: Platform.OS === "ios" ? 40 : 40,
            paddingTop: Platform.OS === 'ios' ? 10 : 10,
          },
          tabBarIcon: ({ color, size }) => {
            let iconName;

            switch (route.name) {
              case "ConteúdosTab":
                iconName = "book-outline";
                break;
              case "ProgramaçãoTab":
                iconName = "calendar-outline";
                break;
              case "HomeTab":
                iconName = "home-outline";
                break;
              case "GenerosidadeTab":
                iconName = "heart-outline";
                break;
              case "MaisTab":
                iconName = "menu-outline";
                break;
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
        initialRouteName="HomeTab"
      >
        <Tab.Screen 
          name="HomeTab" 
          component={HomeStackNavigator}
          options={{
            tabBarLabel: "Home"
          }}
        />
        <Tab.Screen 
          name="ConteúdosTab" 
          component={ConteudosScreen}
          options={{
            tabBarLabel: "Conteúdos"
          }}
        />
        <Tab.Screen 
          name="ProgramaçãoTab" 
          component={ProgramacaoScreen}
          options={{
            tabBarLabel: "Programação"
          }}
        />
        <Tab.Screen 
          name="GenerosidadeTab" 
          component={GenerosidadeScreen}
          options={{
            tabBarLabel: "Generosidade"
          }}
        />
        <Tab.Screen 
          name="MaisTab" 
          component={MaisStackNavigator}
          options={{
            tabBarLabel: "Mais"
          }}
        />
      </Tab.Navigator>

      {/* Modal de Login */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              Você não está logado. Para ter acesso a esse recurso é necessário
              fazer login
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#ccc" }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Agora Não</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#007bff" }]}
                onPress={handleGoToLogin}
              >
                <Text style={[styles.buttonText, { color: "#fff" }]}>
                  Ir pra login
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  lockedScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 20,
  },
  lockedTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  lockedMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: "#B8986A",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "85%",
    maxWidth: 400,
    alignItems: "center",
  },
  modalText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
});