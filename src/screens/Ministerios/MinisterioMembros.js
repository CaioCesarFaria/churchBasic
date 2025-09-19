// MinisterioMembros.js - Com os cards dos ministérios que o mebro faz parte. 
import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../context/AuthContext";
import { db } from "../../Firebase/FirebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import DisplayUser from "../../components/DisplayUser";

export default function MinisterioMembros({ navigation }) {
  const { user, userData } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [ministerios, setMinisterios] = useState([]);

  const userName = userData?.name || user?.displayName || "Membro";

  useEffect(() => {
    if (user) {
      loadUserMinisterios();
    }
  }, [user]);

  const loadUserMinisterios = async () => {
    setLoading(true);
    try {
      const ministeriosData = [];

      // Buscar no ministério de Comunicação
      try {
        const comunicacaoRef = collection(db, "churchBasico", "ministerios", "conteudo", "comunicacao", "membros");
        const comunicacaoQuery = query(comunicacaoRef, where("userId", "==", user.uid));
        const comunicacaoSnapshot = await getDocs(comunicacaoQuery);
        
        comunicacaoSnapshot.forEach((doc) => {
          const data = doc.data();
          ministeriosData.push({
            id: doc.id,
            ministerio: "Comunicação",
            ministerioId: "comunicacao",
            icon: "megaphone",
            color: "#4A90E2",
            role: data.role || "membro",
            lider: "Pastor João", // Você pode buscar isso do banco depois
            route: "MinisterioComunicacaoAdmin",
            ...data
          });
        });
      } catch (error) {
        console.log("Erro ao buscar ministério de Comunicação:", error);
      }

      // Buscar no ministério de Células
      try {
        const celulaRef = collection(db, "churchBasico", "ministerios", "conteudo", "celula", "membros");
        const celulaQuery = query(celulaRef, where("userId", "==", user.uid));
        const celulaSnapshot = await getDocs(celulaQuery);
        
        celulaSnapshot.forEach((doc) => {
          const data = doc.data();
          ministeriosData.push({
            id: doc.id,
            ministerio: "Células",
            ministerioId: "celula",
            icon: "people",
            color: "#B8986A",
            role: data.role || "membro",
            lider: "Pastor Pedro", // Você pode buscar isso do banco depois
            route: "MinisterioCelulaAdmin",
            ...data
          });
        });
      } catch (error) {
        console.log("Erro ao buscar ministério de Células:", error);
      }

      // Buscar no ministério Kids (se existir)
      try {
        const kidsRef = collection(db, "churchBasico", "ministerios", "conteudo", "kids", "membros");
        const kidsQuery = query(kidsRef, where("userId", "==", user.uid));
        const kidsSnapshot = await getDocs(kidsQuery);
        
        kidsSnapshot.forEach((doc) => {
          const data = doc.data();
          ministeriosData.push({
            id: doc.id,
            ministerio: "Kids",
            ministerioId: "kids",
            icon: "happy",
            color: "#FF6B6B",
            role: data.role || "membro",
            lider: "Tia Maria", // Você pode buscar isso do banco depois
            route: "MinisterioKidsAdmin",
            ...data
          });
        });
      } catch (error) {
        console.log("Erro ao buscar ministério Kids:", error);
      }

      // Buscar no ministério de Louvor (se existir)
      try {
        const louvorRef = collection(db, "churchBasico", "ministerios", "conteudo", "louvor", "membros");
        const louvorQuery = query(louvorRef, where("userId", "==", user.uid));
        const louvorSnapshot = await getDocs(louvorQuery);
        
        louvorSnapshot.forEach((doc) => {
          const data = doc.data();
          ministeriosData.push({
            id: doc.id,
            ministerio: "Louvor",
            ministerioId: "louvor",
            icon: "musical-notes",
            color: "#9B59B6",
            role: data.role || "membro",
            lider: "Pr. Carlos", // Você pode buscar isso do banco depois
            route: "MinisterioLouvorAdmin",
            ...data
          });
        });
      } catch (error) {
        console.log("Erro ao buscar ministério de Louvor:", error);
      }

      setMinisterios(ministeriosData);
    } catch (error) {
      console.log("Erro ao carregar ministérios:", error);
      Alert.alert("Erro", "Não foi possível carregar seus ministérios");
    } finally {
      setLoading(false);
    }
  };

  const navigateToMinisterio = (ministerio) => {
    navigation.navigate(ministerio.route, {
      userRole: ministerio.role,
      ministerioData: ministerio
    });
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case "responsavel":
        return "Responsável";
      case "lider":
        return "Líder";
      case "coordenador":
        return "Coordenador";
      case "voluntario":
        return "Voluntário";
      default:
        return "Membro";
    }
  };

  const renderMinisterioCard = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.ministerioCard}
        onPress={() => navigateToMinisterio(item)}
        activeOpacity={0.7}
      >
        <View style={styles.ministerioHeader}>
          <View style={[styles.ministerioIcon, { backgroundColor: item.color }]}>
            <Ionicons name={item.icon} size={24} color="#fff" />
          </View>
          <View style={styles.ministerioInfo}>
            <Text style={styles.ministerioName}>{item.ministerio}</Text>
            <Text style={styles.ministerioLider}>Líder: {item.lider}</Text>
            <Text style={styles.ministerioRole}>
              Você é: {getRoleDisplayName(item.role)}
            </Text>
          </View>
          <View style={styles.ministerioArrow}>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meus Ministérios</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadUserMinisterios}>
          <Ionicons name="refresh" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* DisplayUser */}
      <View style={styles.userSection}>
        <DisplayUser userName={userName} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#B8986A" />
            <Text style={styles.loadingText}>Carregando seus ministérios...</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header da página */}
            <View style={styles.pageHeader}>
              <Text style={styles.pageTitle}>Seus Ministérios</Text>
              <Text style={styles.pageSubtitle}>
                Toque em um ministério para acessar
              </Text>
            </View>

            {/* Estatísticas */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Ionicons name="star" size={24} color="#B8986A" />
                <Text style={styles.statNumber}>{ministerios.length}</Text>
                <Text style={styles.statLabel}>
                  {ministerios.length === 1 ? "Ministério" : "Ministérios"}
                </Text>
              </View>
              
              <View style={styles.statCard}>
                <Ionicons name="trophy" size={24} color="#FFD700" />
                <Text style={styles.statNumber}>
                  {ministerios.filter(m => m.role === "responsavel" || m.role === "lider").length}
                </Text>
                <Text style={styles.statLabel}>Lideranças</Text>
              </View>
            </View>

            {/* Lista de Ministérios */}
            {ministerios.length > 0 ? (
              <View style={styles.ministeriosList}>
                <FlatList
                  data={ministerios}
                  keyExtractor={(item) => item.id}
                  renderItem={renderMinisterioCard}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="sad-outline" size={64} color="#ccc" />
                <Text style={styles.emptyTitle}>Nenhum Ministério Encontrado</Text>
                <Text style={styles.emptyText}>
                  Você ainda não faz parte de nenhum ministério.
                </Text>
                <Text style={styles.emptySubText}>
                  Entre em contato com os líderes para se juntar a um ministério!
                </Text>
                
                <TouchableOpacity 
                  style={styles.refreshButtonSmall}
                  onPress={loadUserMinisterios}
                >
                  <Ionicons name="refresh" size={16} color="#B8986A" />
                  <Text style={styles.refreshButtonText}>Atualizar</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Informações de contato */}
            {ministerios.length > 0 && (
              <View style={styles.infoCard}>
                <Ionicons name="information-circle" size={20} color="#B8986A" />
                <Text style={styles.infoText}>
                  Para mais informações sobre seus ministérios ou para reportar algum problema,
                  entre em contato com a liderança da igreja.
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
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
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  refreshButton: {
    padding: 5,
  },
  userSection: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
  },
  pageHeader: {
    padding: 20,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  pageSubtitle: {
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 15,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  ministeriosList: {
    paddingHorizontal: 20,
  },
  ministerioCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  ministerioHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  ministerioIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  ministerioInfo: {
    flex: 1,
  },
  ministerioName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  ministerioLider: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  ministerioRole: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B8986A",
  },
  ministerioArrow: {
    marginLeft: 10,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 5,
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  refreshButtonSmall: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    color: "#B8986A",
    fontWeight: "600",
  },
  infoCard: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  infoText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    marginLeft: 10,
    flex: 1,
  },
});