// TabsNavigation.js
import React, { useContext, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
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
import { AuthContext } from "../context/AuthContext";

const Tab = createBottomTabNavigator();

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

export default function TabsNavigation() {
  const { user, userData } = useContext(AuthContext);
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);

  const handleLoginPress = () => {
    navigation.navigate("Login");
  };

  const handleGoToLogin = () => {
    setModalVisible(false);
    navigation.navigate("Login");
  };

  // Componentes das telas protegidas
  const ConteudosProtected = () => {
    return user ? <ConteudosScreen /> : <LockedScreen screenName="Conteúdos" onLoginPress={handleLoginPress} />;
  };

  // Verificar se é adminMaster para mostrar a tela AdminMaster no lugar da Home
  const HomeComponent = () => {
    if (userData?.userType === "adminMaster") {
      return <AdminMaster navigation={navigation} />;
    }
    return <HomeScreen />;
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
            height: Platform.OS === "ios" ? 80 : 90,
            paddingBottom: Platform.OS === "ios" ? 40 : 30,
          },
          tabBarIcon: ({ color, size }) => {
            let iconName;

            switch (route.name) {
              case "Conteúdos":
                iconName = "book-outline";
                break;
              case "Programação":
                iconName = "calendar-outline";
                break;
              case "Home":
                iconName = "home-outline";
                break;
              case "Generosidade":
                iconName = "heart-outline";
                break;
              case "Mais":
                iconName = "menu-outline";
                break;
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
        initialRouteName="Home"
      >
        <Tab.Screen name="Conteúdos" component={ConteudosProtected} />
        <Tab.Screen name="Programação" component={ProgramacaoScreen} />
        <Tab.Screen name="Home" component={HomeComponent} />
        <Tab.Screen name="Generosidade" component={GenerosidadeScreen} />
        <Tab.Screen name="Mais" component={MaisScreen} />
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
