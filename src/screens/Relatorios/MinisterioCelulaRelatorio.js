// MinisterioCelulaRelatorio.js
import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../context/AuthContext";
import { db } from "../../Firebase/FirebaseConfig";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  orderBy,
  query,
} from "firebase/firestore";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function MinisterioCelulaRelatorio({ navigation }) {
  const { user, userData } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("celulas");
  const [relatorios, setRelatorios] = useState([]);
  const [celulas, setCelulas] = useState([]);
  const [expanded, setExpanded] = useState(null);

  const userName = userData?.name || user?.displayName || "Pastor";

  const loadCelulas = async () => {
    try {
      const celulasRef = collection(db, "churchBasico", "ministerios", "conteudo", "celula", "celulas");
      const querySnapshot = await getDocs(celulasRef);
      
      const celulasData = [];
      querySnapshot.forEach((doc) => {
        celulasData.push({ id: doc.id, ...doc.data() });
      });
      
      setCelulas(celulasData);
    } catch (error) {
      console.log("Erro ao carregar células:", error);
    }
  };

  const loadRelatorios = async () => {
    setLoading(true);
    try {
      const relatoriosRef = collection(
        db,
        "churchBasico",
        "ministerios",
        "conteudo",
        "celula",
        "relatorios"
      );
      const q = query(relatoriosRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      const relatoriosData = [];
      querySnapshot.forEach((doc) => {
        relatoriosData.push({ id: doc.id, ...doc.data() });
      });
      
      setRelatorios(relatoriosData);
    } catch (error) {
      console.log("Erro ao carregar relatórios:", error);
      Alert.alert("Erro", "Não foi possível carregar os relatórios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCelulas();
    loadRelatorios();
  }, []);

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(expanded === id ? null : id);
  };

  const marcarVerificado = async (relatorio) => {
    try {
      const relatorioRef = doc(
        db,
        "churchBasico",
        "ministerios",
        "conteudo",
        "celula",
        "relatorios",
        relatorio.id
      );
      await updateDoc(relatorioRef, {
        verificado: true,
        verificadoEm: new Date(),
        verificadoPor: userName,
      });
      Alert.alert("Sucesso", "Relatório marcado como verificado.");
      loadRelatorios();
    } catch (err) {
      console.log("Erro verificar:", err);
      Alert.alert("Erro", "Não foi possível marcar como verificado.");
    }
  };

  const renderCelulasOverview = () => {
    const celulaComRelatorios = relatorios.reduce((acc, relatorio) => {
      const celulaId = relatorio.celulaId;
      if (!acc[celulaId]) {
        acc[celulaId] = {
          celulaNome: relatorio.celulaNome,
          relatorios: []
        };
      }
      acc[celulaId].relatorios.push(relatorio);
      return acc;
    }, {});

    return (
      <ScrollView style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color="#B8986A" />
            <Text style={styles.statNumber}>{celulas.length}</Text>
            <Text style={styles.statLabel}>Total de Células</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="document-text" size={24} color="#4A90E2" />
            <Text style={styles.statNumber}>{relatorios.length}</Text>
            <Text style={styles.statLabel}>Relatórios Enviados</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color="#50C878" />
            <Text style={styles.statNumber}>
              {relatorios.filter(r => r.verificado).length}
            </Text>
            <Text style={styles.statLabel}>Verificados</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Células por Relatórios</Text>

        {Object.keys(celulaComRelatorios).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Nenhum Relatório Encontrado</Text>
            <Text style={styles.emptyText}>
              Os relatórios das células aparecerão aqui quando enviados.
            </Text>
          </View>
        ) : (
          Object.entries(celulaComRelatorios).map(([celulaId, dados]) => (
            <View key={celulaId} style={styles.celulaGroup}>
              <View style={styles.celulaGroupHeader}>
                <View style={styles.celulaGroupInfo}>
                  <Ionicons name="people" size={20} color="#B8986A" />
                  <Text style={styles.celulaGroupTitle}>
                    {dados.celulaNome} ({dados.relatorios.length} relatórios)
                  </Text>
                </View>
                <View style={styles.celulaGroupStats}>
                  <Text style={styles.celulaGroupStat}>
                    {dados.relatorios.filter(r => r.verificado).length} verificados
                  </Text>
                </View>
              </View>
              
              {dados.relatorios.slice(0, 3).map((relatorio) => {
                const dataEncontro = relatorio.dataEncontro || "Data não informada";
                const createdAt = relatorio.createdAt?.seconds
                  ? new Date(relatorio.createdAt.seconds * 1000).toLocaleDateString("pt-BR")
                  : relatorio.createdAt?.toDate
                  ? relatorio.createdAt.toDate().toLocaleDateString("pt-BR")
                  : "—";

                return (
                  <View key={relatorio.id} style={styles.relatorioMini}>
                    <View style={styles.relatorioMiniHeader}>
                      <Text style={styles.relatorioMiniDate}>📅 {dataEncontro}</Text>
                      <Text style={styles.relatorioMiniAuthor}>Por: {relatorio.createdByName}</Text>
                    </View>
                    <Text style={styles.relatorioMiniSummary}>
                      👥 {relatorio.quantidadeMembros} membros
                      {relatorio.quantidadeVisitantes > 0 && ` • 👋 ${relatorio.quantidadeVisitantes} visitantes`}
                    </Text>
                    {relatorio.verificado && (
                      <View style={styles.relatorioMiniVerified}>
                        <Ionicons name="checkmark-circle" size={12} color="#50C878" />
                        <Text style={styles.relatorioMiniVerifiedText}>Verificado</Text>
                      </View>
                    )}
                  </View>
                );
              })}

              {dados.relatorios.length > 3 && (
                <TouchableOpacity 
                  style={styles.verMaisButton}
                  onPress={() => setActiveTab("relatorios")}
                >
                  <Text style={styles.verMaisText}>
                    Ver todos os {dados.relatorios.length} relatórios
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color="#B8986A" />
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  const renderRelatorios = () => {
    const relatoriosGrouped = relatorios.reduce((acc, relatorio) => {
      const celulaId = relatorio.celulaId;
      if (!acc[celulaId]) {
        acc[celulaId] = {
          celulaNome: relatorio.celulaNome,
          relatorios: []
        };
      }
      acc[celulaId].relatorios.push(relatorio);
      return acc;
    }, {});

    return (
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Todos os Relatórios</Text>

        {Object.keys(relatoriosGrouped).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Nenhum Relatório Encontrado</Text>
            <Text style={styles.emptyText}>
              Os relatórios das células aparecerão aqui quando enviados.
            </Text>
          </View>
        ) : (
          Object.entries(relatoriosGrouped).map(([celulaId, grupo]) => (
            <View key={celulaId} style={styles.relatoriosGroup}>
              <View style={styles.relatoriosGroupHeader}>
                <Ionicons name="people" size={20} color="#B8986A" />
                <Text style={styles.relatoriosGroupTitle}>
                  {grupo.celulaNome} ({grupo.relatorios.length} relatórios)
                </Text>
              </View>
              
              {grupo.relatorios.map((relatorio) => {
                const dataEncontro = relatorio.dataEncontro || "Data não informada";
                const createdAt = relatorio.createdAt?.seconds
                  ? new Date(relatorio.createdAt.seconds * 1000).toLocaleString("pt-BR")
                  : relatorio.createdAt?.toDate
                  ? relatorio.createdAt.toDate().toLocaleString("pt-BR")
                  : "—";

                return (
                  <TouchableOpacity
                    key={relatorio.id}
                    style={styles.relatorioItem}
                    onPress={() => toggleExpand(relatorio.id)}
                  >
                    <View style={styles.relatorioHeader}>
                      <View style={styles.relatorioInfo}>
                        <Text style={styles.relatorioDate}>📅 {dataEncontro}</Text>
                        <Text style={styles.relatorioSummary}>
                          👥 {relatorio.quantidadeMembros} membros
                          {relatorio.quantidadeVisitantes > 0 && ` • 👋 ${relatorio.quantidadeVisitantes} visitantes`}
                        </Text>
                        <Text style={styles.relatorioAuthor}>Por: {relatorio.createdByName}</Text>
                      </View>
                      <Ionicons 
                        name={expanded === relatorio.id ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color="#666" 
                      />
                    </View>
                    
                    {expanded === relatorio.id && (
                      <View style={styles.relatorioDetails}>
                        {relatorio.problemas && (
                          <View style={styles.relatorioSection}>
                            <Text style={styles.relatorioSectionTitle}>⚠ Problemas/Dificuldades:</Text>
                            <Text style={styles.relatorioSectionText}>{relatorio.problemas}</Text>
                          </View>
                        )}
                        
                        {relatorio.motivosOracao && (
                          <View style={styles.relatorioSection}>
                            <Text style={styles.relatorioSectionTitle}>🙏 Motivos de Oração:</Text>
                            <Text style={styles.relatorioSectionText}>{relatorio.motivosOracao}</Text>
                          </View>
                        )}
                        
                        <View style={styles.relatorioFooter}>
                          <Text style={styles.relatorioCreateDate}>
                            Enviado em: {createdAt}
                          </Text>
                        </View>

                        {/* Verificado */}
                        <View style={{ marginTop: 12 }}>
                          {relatorio.verificado ? (
                            <View style={styles.verified}>
                              <Ionicons name="checkmark-circle" size={16} color="#50C878" />
                              <Text style={styles.verifiedText}>Verificado por {relatorio.verificadoPor}</Text>
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={styles.verifyBtn}
                              onPress={() => marcarVerificado(relatorio)}
                            >
                              <Ionicons name="checkmark" size={16} color="#fff" />
                              <Text style={styles.verifyText}>Marcar como Verificado</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#666" />
        </TouchableOpacity>
        <Text style={styles.title}>Relatórios — Células</Text>
        <Text style={styles.userName}>{userName}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "celulas" && styles.activeTab]}
          onPress={() => setActiveTab("celulas")}
        >
          <Ionicons 
            name="people" 
            size={18} 
            color={activeTab === "celulas" ? "#B8986A" : "#666"} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === "celulas" && styles.activeTabText
          ]}>
            Células
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "relatorios" && styles.activeTab]}
          onPress={() => setActiveTab("relatorios")}
        >
          <Ionicons 
            name="document-text" 
            size={18} 
            color={activeTab === "relatorios" ? "#4A90E2" : "#666"} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === "relatorios" && styles.activeTabText
          ]}>
            Relatórios
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#B8986A" />
          <Text style={{ marginTop: 8, color: "#666" }}>Carregando relatórios...</Text>
        </View>
      ) : (
        <>
          {activeTab === "celulas" && renderCelulasOverview()}
          {activeTab === "relatorios" && renderRelatorios()}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: { fontSize: 16, fontWeight: "600", color: "#333" },
  userName: { color: "#B8986A", fontWeight: "600" },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    gap: 5,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#B8986A",
  },
  tabText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#B8986A",
    fontWeight: "600",
  },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16, color: "#333" },
  
  // Stats Overview
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
  },

  // Células Overview
  celulaGroup: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  celulaGroupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  celulaGroupInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  celulaGroupTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  celulaGroupStats: {
    alignItems: "flex-end",
  },
  celulaGroupStat: {
    fontSize: 12,
    color: "#50C878",
    fontWeight: "600",
  },
  relatorioMini: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f9fa",
  },
  relatorioMiniHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  relatorioMiniDate: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  relatorioMiniAuthor: {
    fontSize: 11,
    color: "#999",
  },
  relatorioMiniSummary: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  relatorioMiniVerified: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  relatorioMiniVerifiedText: {
    fontSize: 11,
    color: "#50C878",
    fontWeight: "600",
  },
  verMaisButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    gap: 4,
  },
  verMaisText: {
    fontSize: 12,
    color: "#B8986A",
    fontWeight: "600",
  },

  // Relatórios Detalhados
  relatoriosGroup: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  relatoriosGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  relatoriosGroupTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 10,
  },
  relatorioItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#f8f9fa",
  },
  relatorioHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  relatorioInfo: {
    flex: 1,
  },
  relatorioDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  relatorioSummary: {
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
  },
  relatorioAuthor: {
    fontSize: 12,
    color: "#999",
  },
  relatorioDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#f8f9fa",
  },
  relatorioSection: {
    marginBottom: 12,
  },
  relatorioSectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  relatorioSectionText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  relatorioFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  relatorioCreateDate: {
    fontSize: 11,
    color: "#999",
    fontStyle: "italic",
  },

  // Empty State
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
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },

  // Verificação
  verifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#50C878",
    padding: 10,
    borderRadius: 8,
  },
  verifyText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
  },
  verified: {
    flexDirection: "row",
    alignItems: "center",
  },
  verifiedText: {
    color: "#50C878",
    marginLeft: 6,
    fontWeight: "600",
  },
});