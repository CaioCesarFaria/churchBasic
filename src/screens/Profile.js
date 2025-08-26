import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen({ navigation }) {
  const ProfileMenuItem = ({ iconName, title, onPress, showArrow = true }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <Ionicons name={iconName} size={20} color="#B8986A" />
        <Text style={styles.menuItemText}>{title}</Text>
      </View>
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={30} color="#B8986A" />
              </View>
              <TouchableOpacity style={styles.cameraButton}>
                <Ionicons name="camera" size={16} color="#fff" />
              </TouchableOpacity>
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
          
          <TouchableOpacity style={styles.editProfileButton}>
            <Ionicons name="person-outline" size={20} color="#B8986A" />
            <Text style={styles.editProfileButtonText}>Editar meu perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <ProfileMenuItem
            iconName="notifications-outline"
            title="Notificações"
            onPress={() => console.log("Notificações")}
          />
          
          <ProfileMenuItem
            iconName="document-text-outline"
            title="Bloco de Notas"
            onPress={() => console.log("Bloco de Notas")}
          />
          
          <ProfileMenuItem
            iconName="people-outline"
            title="Ministérios"
            onPress={() => navigation.navigate("Ministerios")}
          />
          
          <ProfileMenuItem
            iconName="card-outline"
            title="Minhas carteirinhas"
            onPress={() => console.log("Carteirinhas")}
          />
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
  backButton: {
    padding: 10,
    marginLeft: -10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  settingsButton: {
    padding: 10,
    marginRight: -10,
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
  avatarContainer: {
    position: "relative",
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
  cameraButton: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#B8986A",
    alignItems: "center",
    justifyContent: "center",
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
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  editProfileButtonText: {
    marginLeft: 8,
    color: "#B8986A",
    fontSize: 14,
    fontWeight: "500",
  },
  menuSection: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 15,
  },
});