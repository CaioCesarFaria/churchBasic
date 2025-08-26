// DisplayUser.js
import React, { useState, useContext } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";

export default function DisplayUser({ isLoggedIn, userName, onLoginPress }) {
  const [modalVisible, setModalVisible] = useState(false);
  const { user } = useContext(AuthContext);

  const handleBellPress = () => {
    if (user) {
      // Se estiver logado, pode navegar para notificações
      console.log("Usuário logado - mostrar notificações");
      // Aqui você pode navegar para uma tela de notificações
    } else {
      // Se não estiver logado, mostra o modal
      setModalVisible(true);
    }
  };

  const handleGoToLogin = () => {
    setModalVisible(false);
    if (onLoginPress) {
      onLoginPress();
    }
  };

  return (
    <>
      {/* Linha cinza acima */}
      <View style={styles.divider} />

      <View style={styles.containerDisplay}>
        <Ionicons name="person-circle-outline" size={40} color="#555" />
        <Text style={styles.greeting}>
          Olá, {userName || "Visitante"}!
        </Text>

        <TouchableOpacity
          style={styles.bellButton}
          onPress={handleBellPress}
        >
          <Ionicons name="notifications-outline" size={28} color="#555" />
        </TouchableOpacity>
      </View>

      {/* Alert customizado */}
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
  divider: {
    height: 1,
    backgroundColor: "#000",
    width: "100%",
  },
  containerDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  greeting: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 10,
    flex: 1,
  },
  bellButton: {
    padding: 5,
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