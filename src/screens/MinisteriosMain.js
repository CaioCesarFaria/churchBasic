// MinisteriosMain.js
import React, { useContext } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  StatusBar 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";

export default function MinisteriosMain({ navigation }) {
  const { user, userData } = useContext(AuthContext);
  
  // Pega o nome do usuário seguindo o mesmo padrão das outras telas
  const userName = userData?.name || user?.displayName || user?.email || "Visitante";

  const ministerios = [
    { id: 1, name: "ABBA Kids", screen: "KidsMain" },
    { id: 2, name: "ABBA School", screen: "AbbaSchoolMain" },
    { id: 3, name: "Comunicação", screen: "ComunicacaoMain" },
    { id: 4, name: "Conexão", screen: "ConexaoMain" },
    { id: 5, name: "Matilha", screen: "MatilhaMain" },
    { id: 6, name: "Célula", screen: "CelulaMain" },
    { id: 7, name: "Ministério de Casais", screen: "CasaisMain" },
    { id: 8, name: "Ministério de Mulheres", screen: "MulheresMain" },
    { id: 9, name: "Intercessão", screen: "IntercessaoMain" },
    { id: 10, name: "Diaconato", screen: "DiaconatoMain" },
    { id: 11, name: "Louvor", screen: "LouvorMain" },
    { id: 12, name: "Batismo", screen: "BatismoMain" },
  ];

  const MinisterioButton = ({ ministerio }) => (
    <TouchableOpacity 
      style={styles.ministerioButton}
      onPress={() => {
        console.log(`Navegando para: ${ministerio.screen}`);
        navigation.navigate(ministerio.screen);
      }}
    >
      <View style={styles.buttonContent}>
        <Ionicons name="people-outline" size={24} color="#B8986A" />
        <Text style={styles.ministerioText}>{ministerio.name}</Text>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#f5f5f5" barStyle="dark-content" />
      
      {/* TOPO */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ministérios</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* DISPLAY USER */}
      <View style={styles.userSection}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color="#B8986A" />
          </View>
          <View style={styles.userText}>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userSubtext}>Bem-vindo aos ministérios</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* LISTA DOS MINISTÉRIOS */}
        <View style={styles.listSection}>
          <Text style={styles.listTitle}>LISTA DOS MINISTÉRIOS</Text>
          
          <View style={styles.ministeriosList}>
            {ministerios.map((ministerio) => (
              <MinisterioButton 
                key={ministerio.id} 
                ministerio={ministerio} 
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  headerSpacer: {
    width: 34, // Mesmo tamanho do backButton para centralizar o título
  },
  userSection: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#B8986A",
  },
  userText: {
    marginLeft: 15,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  userSubtext: {
    fontSize: 14,
    color: "#666",
  },
  scrollContent: {
    flex: 1,
  },
  listSection: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 100, // Espaço extra para a bottom tab
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    marginBottom: 25,
    letterSpacing: 1,
  },
  ministeriosList: {
    gap: 15,
  },
  ministerioButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: "10%", // 80% da largura da tela
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  ministerioText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginLeft: 15,
  },
});