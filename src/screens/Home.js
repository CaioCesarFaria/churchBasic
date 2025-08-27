// Home.js
import React, { useState, useContext } from "react";
import {
  StyleSheet,
  StatusBar,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import DisplayUser from "../components/DisplayUser";
import Topo from "../components/Topo";
import CardVideo from "../components/CardVideo";
import { AuthContext } from "../context/AuthContext";

export default function HomeScreen() {
  const { user, userData, setUserData } = useContext(AuthContext);

  const navigation = useNavigation();
  const [expandedSections, setExpandedSections] = useState({
    edificacao: true,
    ficadentr: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleLoginPress = () => {
    navigation.navigate("Login");
  };

  const SectionHeader = ({ title, section, onToggle }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity onPress={onToggle}>
        <Text style={styles.toggleText}>
          {expandedSections[section] ? "OCULTAR" : "EXPANDIR"}
        </Text>
        <Ionicons
          name={expandedSections[section] ? "chevron-up" : "chevron-down"}
          size={16}
          color="#666"
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.containerHome} edges={["bottom", "top"]}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Topo />
        <DisplayUser
          isLoggedIn={!!user}
          userName={userData?.name || user?.displayName || user?.email}
          onLoginPress={handleLoginPress}
        />
        {!user && !userData && (
          <View style={styles.notLoggedContainer}>
            <Text style={styles.notLoggedText}>Você não está logado</Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => navigation.navigate("Login")}
              >
                <Text style={styles.buttonText}>Entrar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.registerButton}
                onPress={() => navigation.navigate("Cadastro")}
              >
                <Text style={styles.buttonText}>Cadastre-se</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Seção Para sua edificação */}
        <View style={styles.section}>
          <SectionHeader
            title="Eventos"
            section="edificacao"
            onToggle={() => toggleSection("edificacao")}
          />

          {expandedSections.edificacao && (
            <View style={styles.sectionContent}>
              <CardVideo
                thumbnail="https://img.youtube.com/vi/mX8A3M7pL3k/maxresdefault.jpg"
                title="Jireh"
                subtitle="Ministério • Elevation"
                category="Louvor"
                videoId="mX8A3M7pL3k"
              />

              <CardVideo
                thumbnail="https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
                title="Grande é o Senhor"
                subtitle="Ministério • ABBA Music"
                category="Adoração"
                videoId="dQw4w9WgXcQ"
              />

              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>VER TODAS</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Seção Fique por dentro */}
        <View style={styles.section}>
          <SectionHeader
            title="Programação"
            section="ficadentr"
            onToggle={() => toggleSection("ficadentr")}
          />

          {expandedSections.ficadentr && (
            <View style={styles.sectionContent}>
              <View style={styles.newsGrid}>
                <View style={styles.newsItem}>
                  <View style={styles.newsIconContainer}>
                    <Text style={styles.newsIcon}>Z</Text>
                  </View>
                  <Text style={styles.newsTitle}>Geração Z</Text>
                </View>

                <View style={styles.newsItem}>
                  <View style={styles.newsIconContainer}>
                    <Ionicons name="laptop-outline" size={24} color="#B8986A" />
                  </View>
                  <Text style={styles.newsTitle}>Marketing Online</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>VER TODAS</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  containerHome: {
    backgroundColor: "#e0e0e0",
    flex: 1,
  },
  notLoggedContainer: {
    padding: 16,
    alignItems: "center",
  },
  notLoggedText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
  },
  loginButton: {
    backgroundColor: "#B8986A",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 8,
  },
  registerButton: {
    backgroundColor: "#555",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  section: {
    backgroundColor: "#fff",
    margin: 15,
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  toggleText: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
  },
  sectionContent: {
    padding: 20,
    alignItems: "center",
  },
  viewAllButton: {
    marginTop: 15,
    paddingVertical: 8,
  },
  viewAllText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    letterSpacing: 1,
  },
  newsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
  },
  newsItem: {
    alignItems: "center",
    flex: 1,
    marginHorizontal: 10,
  },
  newsIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 15,
    backgroundColor: "#f8f8f8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  newsIcon: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#B8986A",
  },
  newsTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333",
    textAlign: "center",
  },
});
