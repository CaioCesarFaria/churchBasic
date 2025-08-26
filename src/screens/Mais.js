import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function MaisScreen({ navigation }) {
  const MenuItem = ({ iconName, title, onPress, showArrow = true }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={24} color="#B8986A" />
        </View>
        <Text style={styles.menuItemText}>{title}</Text>
      </View>
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={30} color="#B8986A" />
            </View>
            <View style={styles.profileText}>
              <Text style={styles.profileName}>Guilherme Godoy</Text>
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>26% completo</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: "26%" }]} />
                </View>
              </View>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate("Profile")}
          >
            <Ionicons name="person-outline" size={20} color="#B8986A" />
            <Text style={styles.profileButtonText}>Ver meu perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Grid */}
        <View style={styles.menuGrid}>
          <View style={styles.menuRow}>
            <TouchableOpacity style={styles.gridItem}>
              <View style={styles.gridIconContainer}>
                <Ionicons name="people-outline" size={30} color="#B8986A" />
              </View>
              <Text style={styles.gridItemText}>Encontre uma MESA</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem}>
              <View style={styles.gridIconContainer}>
                <Ionicons name="book-outline" size={30} color="#B8986A" />
              </View>
              <Text style={styles.gridItemText}>Bíblia</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.menuRow}>
            <TouchableOpacity style={styles.gridItem}>
              <View style={styles.gridIconContainer}>
                <Ionicons name="library-outline" size={30} color="#B8986A" />
              </View>
              <Text style={styles.gridItemText}>Planos de Leitura</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem}>
              <View style={styles.gridIconContainer}>
                <Ionicons name="videocam-outline" size={30} color="#B8986A" />
              </View>
              <Text style={styles.gridItemText}>ABBA TV</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.menuRow}>
            <TouchableOpacity style={styles.gridItem}>
              <View style={styles.gridIconContainer}>
                <Ionicons name="church-outline" size={30} color="#B8986A" />
              </View>
              <Text style={styles.gridItemText}>ABBA CHURCH</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem}>
              <View style={styles.gridIconContainer}>
                <Ionicons name="calendar-outline" size={30} color="#B8986A" />
              </View>
              <Text style={styles.gridItemText}>Agenda</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.menuRow}>
            <TouchableOpacity style={styles.gridItem}>
              <View style={styles.gridIconContainer}>
                <Ionicons name="hand-left-outline" size={30} color="#B8986A" />
              </View>
              <Text style={styles.gridItemText}>Testemunho</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem}>
              <View style={styles.gridIconContainer}>
                <Ionicons name="download-outline" size={30} color="#B8986A" />
              </View>
              <Text style={styles.gridItemText}>Downloads</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.menuRow}>
            <TouchableOpacity style={styles.gridItem}>
              <View style={styles.gridIconContainer}>
                <Ionicons name="share-outline" size={30} color="#B8986A" />
              </View>
              <Text style={styles.gridItemText}>Compartilhar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem}>
              <View style={styles.gridIconContainer}>
                <Ionicons name="folder-outline" size={30} color="#B8986A" />
              </View>
              <Text style={styles.gridItemText}>Recursos</Text>
            </TouchableOpacity>
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
  profileSection: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#B8986A",
  },
  profileText: {
    marginLeft: 15,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  progressContainer: {
    marginTop: 5,
  },
  progressText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
    width: 150,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#B8986A",
    borderRadius: 2,
  },
  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  profileButtonText: {
    marginLeft: 8,
    color: "#B8986A",
    fontSize: 14,
    fontWeight: "500",
  },
  menuGrid: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  menuRow: {
    flexDirection: "row",
    marginBottom: 15,
  },
  gridItem: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 7.5,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gridIconContainer: {
    marginBottom: 8,
  },
  gridItemText: {
    fontSize: 12,
    textAlign: "center",
    color: "#333",
    fontWeight: "500",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 1,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f8f8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  menuItemText: {
    fontSize: 16,
    color: "#333",
  },
});