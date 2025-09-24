// RelatoriosMinisterios.js - ATUALIZADO COM DIACONATO DINÂMICO
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
} from "firebase/firestore";

// Configuração dos ministérios com suas informações
const MINISTERIOS_CONFIG = {
  comunicacao: {
    nome: "Comunicação",
    descricao: "Som, Iluminação, Slides e Streaming",
    icon: "megaphone-outline",
    color: "#3498db",
    relatorio: "MinisterioComunicacaoRelatorio"
  },
  conexao: {
    nome: "Conexão",
    descricao: "Acolhimento e Visitantes",
    icon: "people-outline",
    color: "#e74c3c",
    relatorio: "MinisterioConexaoRelatorio"
  },
  louvor: {
    nome: "Louvor",
    descricao: "Ministério de Música e Adoração",
    icon: "musical-notes-outline",
    color: "#f39c12",
    relatorio: "MinisterioLouvorRelatorio"
  },
  kids: {
    nome: "Kids",
    descricao: "Ministério Infantil",
    icon: "happy-outline",
    color: "#9b59b6",
    relatorio: "MinisterioKidsRelatorio"
  },
  adolescentes: {
    nome: "Adolescentes",
    descricao: "Ministério com Teens",
    icon: "game-controller-outline",
    color: "#1abc9c",
    relatorio: "MinisterioAdolescentesRelatorio"
  },
  jovens: {
    nome: "Jovens",
    descricao: "Ministério com Jovens e Adultos",
    icon: "accessibility-outline",
    color: "#e67e22",
    relatorio: "MinisterioJovensRelatorio"
  },
  celula: {
    nome: "Células",
    descricao: "Grupos de Células",
    icon: "home-outline",
    color: "#B8986A",
    relatorio: "MinisterioCelulaRelatorio"
  },
  diaconato: {
    nome: "Diaconato",
    descricao: "Ministério de Serviço e Dízimos",
    icon: "shield-outline",
    color: "#8B4513",
    relatorio: "MinisterioDiaconatoRelatorio"
  }
};

export default function RelatoriosMinisterios({ navigation }) {
  const { user, userData } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [ministeriosAtivos, setMinisteriosAtivos] = useState([]);
  const [ministeriosStats, setMinisteriosStats] = useState({});

  const userName = userData?.name || user?.displayName || "Pastor";

  // Verificar quais ministérios existem no Firebase
  const verificarMinisteriosExistentes = async () => {
    setLoading(true);
    try {
      const ministeriosEncontrados = [];
      const stats = {};

      for (const [ministerioId, config] of Object.entries(MINISTERIOS_CONFIG)) {
        try {
          // Verificar se existe pasta do ministério
          const membrosRef = collection(db, "churchBasico", "ministerios", "conteudo", ministerioId, "membros");
          const membrosSnapshot = await getDocs(membrosRef);
          
          let dadosEspeciais = 0; // visitantes, celulas, dizimos, etc
          let relatoriosCount = 0;
          let lideresCount = 0;

          // Para conexão, buscar visitantes
          if (ministerioId === "conexao") {
            try {
              const visitantesRef = collection(db, "churchBasico", "ministerios", "conteudo", "conexao", "visitantes");
              const visitantesSnapshot = await getDocs(visitantesRef);
              dadosEspeciais = visitantesSnapshot.size;
            } catch (error) {
              console.log(`Erro ao carregar visitantes de ${ministerioId}:`, error);
            }

            // Buscar relatórios de conexão
            try {
              const relatoriosRef = collection(db, "churchBasico", "ministerios", "conteudo", "conexao", "RelatorioConexao");
              const relatoriosSnapshot = await getDocs(relatoriosRef);
              relatoriosCount = relatoriosSnapshot.size;
            } catch (error) {
              console.log(`Erro ao carregar relatórios de ${ministerioId}:`, error);
            }
          }

          // Para células, buscar células e relatórios
          if (ministerioId === "celula") {
            try {
              const celulasRef = collection(db, "churchBasico", "ministerios", "conteudo", "celula", "celulas");
              const celulasSnapshot = await getDocs(celulasRef);
              
              const relatoriosRef = collection(db, "churchBasico", "ministerios", "conteudo", "celula", "relatorios");
              const relatoriosSnapshot = await getDocs(relatoriosRef);
              relatoriosCount = relatoriosSnapshot.size;

              // Usar células como dados especiais
              dadosEspeciais = celulasSnapshot.size;
            } catch (error) {
              console.log(`Erro ao carregar dados de ${ministerioId}:`, error);
            }
          }

          // Para DIACONATO, buscar líderes, escalas e relatórios de dízimos
          if (ministerioId === "diaconato") {
            try {
              // Verificar líderes
              const lideresRef = collection(db, "churchBasico", "ministerios", "conteudo", "diaconato", "lideres");
              const lideresSnapshot = await getDocs(lideresRef);
              lideresCount = lideresSnapshot.size;

              // Verificar relatórios de dízimos
              const dizimosRef = collection(db, "churchBasico", "ministerios", "conteudo", "diaconato", "relatoriosDizimos");
              const dizimosSnapshot = await getDocs(dizimosRef);
              dadosEspeciais = dizimosSnapshot.size; // número de relatórios de dízimo

              // Contar escalas (buscar em eventos)
              try {
                const eventosRef = collection(db, "churchBasico", "sistema", "eventos");
                const eventosSnapshot = await getDocs(eventosRef);
                let escalasCount = 0;
                
                for (const eventoDoc of eventosSnapshot.docs) {
                  const eventoData = eventoDoc.data();
                  if (eventoData.escalaDiaconato) {
                    escalasCount++;
                  }
                }
                relatoriosCount = escalasCount;
              } catch (error) {
                console.log("Erro ao contar escalas do diaconato:", error);
              }

            } catch (error) {
              console.log(`Erro ao carregar dados de diaconato:`, error);
            }
          }

          const membrosCount = membrosSnapshot.size;
          const totalLideres = lideresCount > 0 ? lideresCount : 0;
          const temDados = membrosCount > 0 || dadosEspeciais > 0 || relatoriosCount > 0 || totalLideres > 0;

          if (temDados) {
            ministeriosEncontrados.push({
              id: ministerioId,
              ...config
            });

            stats[ministerioId] = {
              membros: membrosCount,
              lideres: totalLideres,
              dadosEspeciais: dadosEspeciais,
              relatorios: relatoriosCount,
              ativo: true
            };
          }

        } catch (error) {
          console.log(`Erro ao verificar ministério ${ministerioId}:`, error);
        }
      }

      setMinisteriosAtivos(ministeriosEncontrados);
      setMinisteriosStats(stats);
    } catch (error) {
      console.log("Erro ao verificar ministérios:", error);
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
    verificarMinisteriosExistentes();
  }, []);

  // Atualizar quando a tela recebe foco
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      verificarMinisteriosExistentes();
    });

    return unsubscribe;
  }, [navigation]);

  const renderMinisterioCard = ({ item }) => {
    const stats = ministeriosStats[item.id] || { 
      membros: 0, 
      lideres: 0, 
      dadosEspeciais: 0, 
      relatorios: 0, 
      ativo: false 
    };
    
    return (
      <TouchableOpacity
        style={styles.ministerioCard}
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
            <View style={styles.statusAtivo}>
              <View style={styles.statusIndicator} />
              <Text style={styles.statusText}>Ativo</Text>
            </View>
          </View>
        </View>

        <View style={styles.ministerioStats}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={16} color="#666" />
            <Text style={styles.statText}>{stats.membros} membros</Text>
          </View>
          
          {stats.lideres > 0 && (
            <View style={styles.statItem}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.statText}>{stats.lideres} líderes</Text>
            </View>
          )}

          {/* Stats específicos por ministério */}
          {item.id === "conexao" && (
            <View style={styles.statItem}>
              <Ionicons name="person-add" size={16} color="#666" />
              <Text style={styles.statText}>{stats.dadosEspeciais} visitantes</Text>
            </View>
          )}

          {item.id === "celula" && (
            <View style={styles.statItem}>
              <Ionicons name="home" size={16} color="#666" />
              <Text style={styles.statText}>{stats.dadosEspeciais} células</Text>
            </View>
          )}

          {item.id === "diaconato" && (
            <View style={styles.statItem}>
              <Ionicons name="cash" size={16} color="#666" />
              <Text style={styles.statText}>{stats.dadosEspeciais} dízimos</Text>
            </View>
          )}

          {stats.relatorios > 0 && (
            <View style={styles.statItem}>
              <Ionicons name="document-text" size={16} color="#666" />
              <Text style={styles.statText}>
                {stats.relatorios} {item.id === "diaconato" ? "escalas" : "relatórios"}
              </Text>
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

  const totalMembros = Object.values(ministeriosStats).reduce((total, m) => total + m.membros, 0);
  const totalLideres = Object.values(ministeriosStats).reduce((total, m) => total + (m.lideres || 0), 0);
  const totalRelatorios = Object.values(ministeriosStats).reduce((total, m) => total + m.relatorios, 0);

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
              <Text style={styles.overviewNumber}>{ministeriosAtivos.length}</Text>
              <Text style={styles.overviewLabel}>Ministérios Ativos</Text>
            </View>
            
            <View style={styles.overviewCard}>
              <Ionicons name="people-outline" size={24} color="#B8986A" />
              <Text style={styles.overviewNumber}>{totalMembros}</Text>
              <Text style={styles.overviewLabel}>Total de Membros</Text>
            </View>

            <View style={styles.overviewCard}>
              <Ionicons name="star-outline" size={24} color="#FFD700" />
              <Text style={styles.overviewNumber}>{totalLideres}</Text>
              <Text style={styles.overviewLabel}>Líderes Ativos</Text>
            </View>

            <View style={styles.overviewCard}>
              <Ionicons name="document-text-outline" size={24} color="#B8986A" />
              <Text style={styles.overviewNumber}>{totalRelatorios}</Text>
              <Text style={styles.overviewLabel}>Relatórios/Escalas</Text>
            </View>
          </View>
        </View>

        {/* Lista de Ministérios */}
        <View style={styles.ministeriosContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Relatórios por Ministério</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={verificarMinisteriosExistentes}
              disabled={loading}
            >
              <Ionicons name="refresh" size={16} color="#666" />
              <Text style={styles.refreshButtonText}>Atualizar</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#B8986A" />
              <Text style={styles.loadingText}>Carregando ministérios...</Text>
            </View>
          ) : ministeriosAtivos.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="business-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>Nenhum Ministério Ativo</Text>
              <Text style={styles.emptyText}>
                Os ministérios aparecerão aqui quando tiverem membros ou dados cadastrados.
              </Text>
            </View>
          ) : (
            <FlatList
              data={ministeriosAtivos}
              keyExtractor={(item) => item.id}
              renderItem={renderMinisterioCard}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Informações adicionais */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color="#B8986A" />
            <Text style={styles.infoText}>
              Os ministérios são criados automaticamente quando líderes são promovidos pelo Admin Master.
              Cada ministério com dados aparecerá na lista acima.
            </Text>
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
  overviewContainer: {
    marginVertical: 20,
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
    gap: 8,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  overviewNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 4,
  },
  overviewLabel: {
    fontSize: 10,
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
  emptyContainer: {
    alignItems: "center",
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
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
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
  ministerioStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
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
  infoSection: {
    marginBottom: 30,
  },
  infoCard: {
    backgroundColor: "#f8f4e6",
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 15,
    borderRadius: 8,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#B8986A",
    lineHeight: 18,
  },
});