import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from 'expo-clipboard';

export default function GenerosidadeScreen() {
  const cnpjIgreja = "55.808.585/0001-62";

  const handleCopyPix = async () => {
    try {
      await Clipboard.setStringAsync(cnpjIgreja);
      Alert.alert(
        "PIX Copiado!",
        "O CNPJ da igreja foi copiado para a área de transferência. Cole no seu aplicativo bancário para fazer a contribuição.",
        [{ text: "OK" }]
      );
    } catch (error) {
      Alert.alert("Erro", "Não foi possível copiar o PIX. Tente novamente.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Generosidade</Text>
        <TouchableOpacity style={styles.historyButton}>
          <Ionicons name="time-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <Ionicons name="heart" size={40} color="#B8986A" />
          </View>
          <Text style={styles.heroTitle}>Sua generosidade importa</Text>
          <Text style={styles.heroSubtitle}>
            "Cada um contribua segundo propôs no seu coração; não com tristeza, 
            ou por necessidade; porque Deus ama ao que dá com alegria."
          </Text>
          <Text style={styles.heroReference}>2 Coríntios 9:7</Text>
        </View>

        {/* PIX Section */}
        <View style={styles.pixSection}>
          <View style={styles.pixIconContainer}>
            <Ionicons name="phone-portrait-outline" size={48} color="#B8986A" />
          </View>
          <Text style={styles.pixTitle}>Contribua via PIX</Text>
          <Text style={styles.pixSubtitle}>
            Copie o CNPJ da igreja e faça sua contribuição diretamente pelo seu aplicativo bancário
          </Text>
        </View>

        {/* Copy PIX Button */}
        <View style={styles.copyContainer}>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={handleCopyPix}
          >
            <Ionicons name="copy-outline" size={20} color="#fff" />
            <Text style={styles.copyButtonText}>Copiar PIX</Text>
          </TouchableOpacity>
          
          <View style={styles.cnpjContainer}>
            <Ionicons name="business" size={16} color="#666" />
            <Text style={styles.cnpjText}>CNPJ: {cnpjIgreja}</Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Como sua contribuição ajuda:</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="home-outline" size={20} color="#B8986A" />
            <Text style={styles.infoText}>Manutenção e infraestrutura da igreja</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="people-outline" size={20} color="#B8986A" />
            <Text style={styles.infoText}>Projetos sociais e assistenciais</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="globe-outline" size={20} color="#B8986A" />
            <Text style={styles.infoText}>Missões e evangelização</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="school-outline" size={20} color="#B8986A" />
            <Text style={styles.infoText}>Educação e discipulado</Text>
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
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
  },
  historyButton: {
    padding: 10,
    marginRight: -10,
  },
  heroSection: {
    backgroundColor: "#fff",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 30,
    margin: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFF8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    fontStyle: "italic",
    marginBottom: 10,
  },
  heroReference: {
    fontSize: 12,
    color: "#B8986A",
    fontWeight: "600",
  },
  pixSection: {
    backgroundColor: "#fff",
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 30,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pixIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFF8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#B8986A",
  },
  pixTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  pixSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  copyContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  copyButton: {
    backgroundColor: "#B8986A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 25,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  copyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  cnpjContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cnpjText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
    marginLeft: 8,
  },
  infoSection: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
});