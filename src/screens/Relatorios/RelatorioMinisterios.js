// RelatoriosMinisterios.js - Lista de Relatórios dos Ministérios
import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../context/AuthContext";
import { db } from "../../Firebase/FirebaseConfig";
import {
  collection,
  getDocs,
  query,
} from "firebase/firestore";

// Lista de ministérios disponíveis com suas informações
const MINISTERIOS_DISPONIVEIS = [
  {
    id: "comunicacao",
    nome: "Comunicação",
    descricao: "Som, Iluminação, Slides e Streaming",
    icon: "megaphone-outline",
    color: "#3498db",
    relatorio: "MinisterioComunicacaoRelatorio"
  },
  {
    id: "conexao", 
    nome: "Conexão",
    descricao: "Acolhimento e Visitantes",
    icon: "people-outline",
    color: "#e74c3c",
    relatorio: "MinisterioConexaoRelatorio"
  },
  {
    id: "louvor",
    nome: "Louvor",
    descricao: "Ministério de Música e Adoração",
    icon: "musical-notes-outline",
    color: "#f39c12",
    relatorio: "MinisterioLouvorRelatorio"
  },
  {
    id: "infantil",
    nome: "Infantil", 
    descricao: "Ministério com Crianças",
    icon: "happy-outline",
    color: "#9b59b6",
    relatorio: "MinisterioInfantilRelatorio"
  },
  {
    id: "adolescentes",
    nome: "Adolescentes",
    descricao: "Ministério com Teens", 
    icon: "game-controller-outline",
    color: "#1abc9c",
    relatorio: "MinisterioAdolescentesRelatorio"
  },
  {
    id: "jovens",
    nome: "Jovens",
    descricao: "Ministério com Jovens e Adultos",
    icon: "accessibility-outline",
    color: "#e67e22",
    relatorio: "MinisterioJovensRelatorio"
  }
];

export default function RelatoriosMinisterios({ navigation }) {
  const { user, userData } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [ministeriosStats, setMinisteriosStats] = useState({});

  const userName = userData?.name || user?.displayName || "Pastor";

  // Carregar estatísticas básicas dos ministérios
  const loadMinisteriosStats = async () => {
    setLoading(true);
    try {
      const stats = {};
      
      // Para cada ministério, buscar dados básicos
      for (const ministerio of MINISTERIOS_DISPONIVEIS) {
        try {
          // Buscar membros do ministério
          const membrosRef = collection(db, "churchBasico", "ministerios", "conteudo", ministerio.id, "membros");
          const membrosSnapshot = await getDocs(membrosRef);
          
          // Buscar visitantes (só para conexão)
          let visitantesCount = 0;
          if (ministerio.id === "conexao") {
            const visitantesRef = collection(db, "churchBasico", "ministerios", "conteudo", "conexao", "visitantes");
            const visitantesSnapshot = await getDocs(visitantesRef);
            visitantesCount = visitantesSnapshot.size;
          }

          stats[ministerio.id] = {
            membros: membrosSnapshot.size,
            visitantes: visitantesCount,
            ativo: membrosSnapshot.size > 0 || visitantesCount > 0
          };
          
        } catch (error) {
          console.log(`Erro ao carregar stats do ${ministerio.nome}:`, error);
          stats[ministerio.id] = {
            membros: 0,
            visitantes: 0,
            ativo: false
          };
        }
      }
      
      setMinisteriosStats(stats);
    } catch (error) {
      console.log("Erro ao carregar estatísticas dos ministérios:", error);
    } finally {
      setLoading(false);
    }
  };

  // Navegar para relatório específico do ministério
  const navigateToRelatorio = (ministerio) => {
    navigation.navigate(ministerio.relatorio, {
      ministerioId: ministerio.id,
      ministerioNome: ministerio.nome
    });
  };

  useEffect(() => {
    loadMinisteriosStats();
  }, []);

  // Atualizar quando a tela recebe foco
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadMinisteriosStats();
    });

    return unsubscribe;
  }, [navigation]);

  const renderMinisterioCard = ({ item }) => {
    const stats = ministeriosStats[item.id] || { membros: 0, visitantes: 0, ativo: false };
    
    return (
      <TouchableOpacity
        style={[styles.ministerioCard, !stats.ativo && styles.ministerioInativo]}
        onPress={() => navigateToRelatorio(item)}
        activeOpacity={0.7}
      >
        <View style={styles.ministerioHeader}>
          <View style={[styles.ministerioIconContainer, { backgroundColor: `${item.color}20` }]}>
            <Ionicons name={item.icon} size={32} color={item.color} />
          </View>
          
          <View style={styles.ministerioInfo}>
            <Text style={styles.ministerioNome}>{item.nome}</Text>
            <Text style={styles.ministerioDescricao}>{item.descricao}</Text>
          </View>

          <View style={styles.ministerioStatus}>
            {stats.ativo ? (
              <View style={styles.statusAtivo}>
                <View style={styles.statusIndicator} />
                <Text style={styles.statusText}>Ativo</Text>
              </View>
            ) : (
              <View style={styles.statusInativo}>
                <View style={styles.statusIndicatorInativo} />
                <Text style={styles.statusTextInativo}>Inativo</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.ministerioStats}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={16} color="#666" />
            <Text style={styles.statText}>{stats.membros} membros</Text>
          </View>
          
          {item.id === "conexao" && (
            <View style={styles.statItem}>
              <Ionicons name="person-add" size={16} color="#666" />
              <Text style={styles.statText}>{stats.visitantes} visitantes</Text>
            </View>
          )}

          <View style={styles.statItem}>
            <Ionicons name="chevron-forward" size={16} color={item.color} />
            <Text style={[styles.statText, { color: item.color }]}>Ver relatório</Text>
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
        <Text style={styles.headerTitle}>Relatórios dos Ministérios</Text>
        <Text style={styles.pastorName}>{userName}</Text>
      </View>

      <ScrollView style={styles.content}>
        

        {/* Estatísticas Gerais */}
        <View style={styles.overviewContainer}>
          <Text style={styles.sectionTitle}>Resumo Geral</Text>
          <View style={styles.overviewStats}>
            <View style={styles.overviewCard}>
              <Ionicons name="business-outline" size={24} color="#B8986A" />
              <Text style={styles.overviewNumber}>
                {Object.values(ministeriosStats).filter(m => m.ativo).length}
              </Text>
              <Text style={styles.overviewLabel}>Ministérios Ativos</Text>
            </View>
            
            <View style={styles.overviewCard}>
              <Ionicons name="people-outline" size={24} color="#B8986A" />
              <Text style={styles.overviewNumber}>
                {Object.values(ministeriosStats).reduce((total, m) => total + m.membros, 0)}
              </Text>
              <Text style={styles.overviewLabel}>Total de Membros</Text>
            </View>

            <View style={styles.overviewCard}>
              <Ionicons name="person-add-outline" size={24} color="#B8986A" />
              <Text style={styles.overviewNumber}>
                {ministeriosStats.conexao?.visitantes || 0}
              </Text>
              <Text style={styles.overviewLabel}>Visitantes</Text>
            </View>
          </View>
        </View>

        {/* Lista de Ministérios */}
        <View style={styles.ministeriosContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Relatórios por Ministério</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={loadMinisteriosStats}
              disabled={loading}
            >
              <Ionicons name="refresh" size={16} color="#666" />
              <Text style={styles.refreshButtonText}>Atualizar</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#B8986A" />
              <Text style={styles.loadingText}>Carregando relatórios...</Text>
            </View>
          ) : (
            <FlatList
              data={MINISTERIOS_DISPONIVEIS}
              keyExtractor={(item) => item.id}
              renderItem={renderMinisterioCard}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
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
  pastorName: {
    fontSize: 14,
    color: "#B8986A",
    fontWeight: "500",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeSection: {
    paddingVertical: 20,
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
  overviewContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  overviewStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  overviewNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 5,
  },
  overviewLabel: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
  },
  ministeriosContainer: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  refreshButtonText: {
    color: "#666",
    fontSize: 12,
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
  },
  ministerioCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  ministerioInativo: {
    opacity: 0.7,
    backgroundColor: "#f8f9fa",
  },
  ministerioHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  ministerioIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  ministerioInfo: {
    flex: 1,
  },
  ministerioNome: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  ministerioDescricao: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
  },
  ministerioStatus: {
    alignItems: "flex-end",
  },
  statusAtivo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#50C878",
  },
  statusText: {
    fontSize: 12,
    color: "#50C878",
    fontWeight: "600",
  },
  statusInativo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusIndicatorInativo: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ff6b6b",
  },
  statusTextInativo: {
    fontSize: 12,
    color: "#ff6b6b",
    fontWeight: "600",
  },
  ministerioStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
});