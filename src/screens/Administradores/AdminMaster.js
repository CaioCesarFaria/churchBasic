// AdminMaster.js
import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth, db } from "../../Firebase/FirebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export default function AdminMaster({ navigation }) {
  const { user, userData, setUserData } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  
  const [membersCount, setMembersCount] = useState(0);
  const [leadersCount, setLeadersCount] = useState(0);
  const [ministeriosCount, setMinisteriosCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const handleLogout = async () => {
    Alert.alert(
      "Sair",
      "Tem certeza que deseja sair?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
              setUserData(null);
              navigation.navigate("Início");
            } catch (error) {
              console.log("Erro ao sair:", error);
              Alert.alert("Erro", "Erro ao sair do sistema");
            }
          },
        },
      ]
    );
  };

  const navigateToNewMinisterio = () => {
    navigation.navigate("NewMinisterio");
  };

  const navigateToNewLider = () => {
    navigation.navigate("NewLider");
  };

  // Buscar estatísticas
  const fetchStatistics = async () => {
    try {
      setLoadingStats(true);

      // Membros
      const membersSnapshot = await getDocs(collection(db, "churchBasico", "users", "members"));
      const leadersSnapshot = await getDocs(collection(db, "churchBasico", "users", "lideres"));

      // Atualiza membros e líderes
      setMembersCount(membersSnapshot.size + leadersSnapshot.size);
      setLeadersCount(leadersSnapshot.size);

      // Contar ministérios únicos dos líderes
      const ministeriosSet = new Set();
      leadersSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.ministerio) ministeriosSet.add(data.ministerio);
      });
      setMinisteriosCount(ministeriosSet.size);

    } catch (error) {
      console.log("Erro ao buscar estatísticas:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);




  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>ABBA</Text>
          </View>
          <Text style={styles.churchText}>CHURCH</Text>
        </View>
        
        <View style={styles.headerRight}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              Olá, {userData?.name || user?.displayName || user?.email}!
            </Text>
            <Text style={styles.userType}>Admin Master</Text>
          </View>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#B8986A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Admin Action Buttons */}
      <View style={styles.adminButtonsContainer}>
        <TouchableOpacity 
          style={styles.adminButton}
          onPress={navigateToNewMinisterio}
          disabled={loading}
        >
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
          <Text style={styles.adminButtonText}>Atribuir Ministério</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.adminButton}
          onPress={navigateToNewLider}
          disabled={loading}
        >
          <Ionicons name="person-add-outline" size={24} color="#fff" />
          <Text style={styles.adminButtonText}>Cadastrar Líder</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Painel Administrativo</Text>
          <Text style={styles.welcomeSubtitle}>
            Gerencie ministérios, líderes e administre o sistema
          </Text>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={styles.statCard} 
            onPress={() => navigation.navigate("MembersAdm")}
          >
            <Ionicons name="people-outline" size={32} color="#B8986A" />
            <Text style={styles.statNumber}>{loadingStats ? "--" : membersCount}</Text>
            <Text style={styles.statLabel}>Membros</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.statCard} 
            onPress={() => navigation.navigate("MinisteriosAdm")}
          >
            <Ionicons name="business-outline" size={32} color="#B8986A" />
            <Text style={styles.statNumber}>{loadingStats ? "--" : ministeriosCount}</Text>
            <Text style={styles.statLabel}>Ministérios</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.statCard} 
            onPress={() => navigation.navigate("LideresAdm")}
          >
            <Ionicons name="person-outline" size={32} color="#B8986A" />
            <Text style={styles.statNumber}>{loadingStats ? "--" : leadersCount}</Text>
            <Text style={styles.statLabel}>Líderes</Text>
          </TouchableOpacity>
        </View>

        {/* Management Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Gerenciamento</Text>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate("ResponsaveisAdmin")}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="people" size={32} color="#B8986A" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Gerenciar Responsáveis</Text>
              <Text style={styles.actionSubtitle}>
                Administre responsáveis e permissões
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate("MinisteriosAdmin")}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="business" size={32} color="#B8986A" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Gerenciar Ministérios</Text>
              <Text style={styles.actionSubtitle}>
                Edite e organize ministérios
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate("RelatoriosAdmin")}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="bar-chart" size={32} color="#B8986A" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Relatórios</Text>
              <Text style={styles.actionSubtitle}>
                Visualize estatísticas e relatórios
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate("ConfiguracoesAdmin")}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="settings" size={32} color="#B8986A" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Configurações</Text>
              <Text style={styles.actionSubtitle}>
                Configure o sistema e preferências
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
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
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  logoContainer: {
    alignItems: "center",
  },
  logoBox: {
    borderWidth: 2,
    borderColor: "#000",
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 5,
  },
  logoText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    letterSpacing: 1,
  },
  churchText: {
    fontSize: 10,
    color: "#000",
    letterSpacing: 4,
    fontWeight: "300",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  userInfo: {
    alignItems: "flex-end",
    marginRight: 15,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  userType: {
    fontSize: 12,
    color: "#B8986A",
    fontWeight: "500",
  },
  logoutButton: {
    padding: 8,
  },
  adminButtonsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  adminButton: {
    flex: 1,
    backgroundColor: "#B8986A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  adminButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeSection: {
    marginBottom: 25,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  actionsContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    marginRight: 15,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
  },
});