// MinisterioDiaconatoRelatorio.js - Relatório completo do Diaconato para Pastor
import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
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
  query,
  orderBy,
  where,
} from "firebase/firestore";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function MinisterioDiaconatoRelatorio({ navigation }) {
  const { user, userData } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("resumo");
  const [membros, setMembros] = useState([]);
  const [escalas, setEscalas] = useState([]);
  const [relatoriosDizimos, setRelatoriosDizimos] = useState([]);
  const [lideres, setLideres] = useState([]);
  const [expanded, setExpanded] = useState(null);

  const userName = userData?.name || user?.displayName || "Pastor";

  // Carregar dados do diaconato
  const loadDiaconatoData = async () => {
    setLoading(true);
    try {
      // Carregar membros
      const membrosRef = collection(db, "churchBasico", "ministerios", "conteudo", "diaconato", "membros");
      const membrosSnapshot = await getDocs(membrosRef);
      const membrosData = [];
      membrosSnapshot.forEach((doc) => {
        membrosData.push({ id: doc.id, ...doc.data() });
      });
      setMembros(membrosData);

      // Carregar líderes
      const lideresRef = collection(db, "churchBasico", "ministerios", "conteudo", "diaconato", "lideres");
      const lideresSnapshot = await getDocs(lideresRef);
      const lideresData = [];
      lideresSnapshot.forEach((doc) => {
        lideresData.push({ id: doc.id, ...doc.data() });
      });
      setLideres(lideresData);

      // Carregar relatórios de dízimos
      const dizimosRef = collection(db, "churchBasico", "ministerios", "conteudo", "diaconato", "relatoriosDizimos");
      const dizimosQuery = query(dizimosRef, orderBy("createdAt", "desc"));
      const dizimosSnapshot = await getDocs(dizimosQuery);
      const dizimosData = [];
      dizimosSnapshot.forEach((doc) => {
        dizimosData.push({ id: doc.id, ...doc.data() });
      });
      setRelatoriosDizimos(dizimosData);

      // Carregar escalas (buscar em eventos)
      await loadEscalas();

    } catch (error) {
      console.log("Erro ao carregar dados do diaconato:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadEscalas = async () => {
    try {
      // Buscar eventos que têm escalas do diaconato
      const eventosRef = collection(db, "churchBasico", "sistema", "eventos");
      const eventosSnapshot = await getDocs(eventosRef);
      
      const escalasData = [];
      
      for (const eventoDoc of eventosSnapshot.docs) {
        const eventoData = eventoDoc.data();
        
        if (eventoData.escalaDiaconato) {
          try {
            const escalaRef = collection(db, "churchBasico", "sistema", "eventos", eventoDoc.id, "escalas");
            const escalaSnapshot = await getDocs(escalaRef);
            
            escalaSnapshot.forEach((escalaDoc) => {
              if (escalaDoc.id === "diaconato") {
                escalasData.push({
                  id: `${eventoDoc.id}_${escalaDoc.id}`,
                  eventId: eventoDoc.id,
                  eventoNome: eventoData.nome,
                  eventoData: eventoData.data,
                  eventoHorario: eventoData.horario,
                  ...escalaDoc.data()
                });
              }
            });
          } catch (error) {
            console.log(`Erro ao carregar escala do evento ${eventoDoc.id}:`, error);
          }
        }
      }
      
      // Ordenar por data mais recente
      escalasData.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.seconds - a.createdAt.seconds;
        }
        return 0;
      });
      
      setEscalas(escalasData);
    } catch (error) {
      console.log("Erro ao carregar escalas:", error);
    }
  };

  useEffect(() => {
    loadDiaconatoData();
  }, []);

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(expanded === id ? null : id);
  };

  // Formatação de valores
  const formatarValor = (valor) => {
    const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
    if (isNaN(numero)) return "R$ 0,00";
    return `R$ ${numero.toFixed(2).replace('.', ',')}`;
  };

  // Calcular estatísticas
  const calcularEstatisticas = () => {
    const totalMembros = membros.length + lideres.length;
    const totalEscalas = escalas.length;
    const escalasConfirmadas = escalas.filter(e => e.scaleConfirmed).length;
    const totalArrecadado = relatoriosDizimos.reduce((total, r) => total + (r.valorTotal || 0), 0);
    
    return {
      totalMembros,
      totalEscalas,
      escalasConfirmadas,
      totalArrecadado,
      percentualConfirmacao: totalEscalas > 0 ? Math.round((escalasConfirmadas / totalEscalas) * 100) : 0
    };
  };

  const stats = calcularEstatisticas();

  // Renderizar resumo geral
  const renderResumo = () => (
    <ScrollView style={styles.content}>
      {/* Estatísticas principais */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="people" size={24} color="#B8986A" />
          <Text style={styles.statNumber}>{stats.totalMembros}</Text>
          <Text style={styles.statLabel}>Membros Total</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="calendar" size={24} color="#4A90E2" />
          <Text style={styles.statNumber}>{stats.totalEscalas}</Text>
          <Text style={styles.statLabel}>Escalas Criadas</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color="#50C878" />
          <Text style={styles.statNumber}>{stats.escalasConfirmadas}</Text>
          <Text style={styles.statLabel}>Confirmadas</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="cash" size={24} color="#FFD700" />
          <Text style={styles.statNumber}>{formatarValor(stats.totalArrecadado)}</Text>
          <Text style={styles.statLabel}>Dízimos</Text>
        </View>
      </View>

      {/* Progresso de confirmações */}
      <View style={styles.progressSection}>
        <Text style={styles.sectionTitle}>Taxa de Confirmação das Escalas</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[styles.progressFill, { width: `${stats.percentualConfirmacao}%` }]} 
            />
          </View>
          <Text style={styles.progressText}>{stats.percentualConfirmacao}% confirmadas</Text>
        </View>
      </View>

      {/* Últimas atividades */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Últimas Atividades</Text>
        
        {escalas.slice(0, 3).map((escala) => (
          <View key={escala.id} style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <Ionicons name="calendar" size={16} color="#B8986A" />
              <Text style={styles.activityTitle}>{escala.eventoNome}</Text>
              <View style={[
                styles.activityStatus,
                escala.scaleConfirmed ? styles.statusConfirmed : styles.statusPending
              ]}>
                <Text style={styles.activityStatusText}>
                  {escala.scaleConfirmed ? "Confirmada" : "Pendente"}
                </Text>
              </View>
            </View>
            <Text style={styles.activityDate}>{escala.eventoData} - {escala.eventoHorario}</Text>
            <Text style={styles.activityCreator}>Criada por: {escala.createdByName}</Text>
          </View>
        ))}
      </View>

      {/* Últimos relatórios de dízimo */}
      {relatoriosDizimos.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Últimos Relatórios de Dízimos</Text>
          
          {relatoriosDizimos.slice(0, 3).map((relatorio) => (
            <View key={relatorio.id} style={styles.dizimoPreviewCard}>
              <View style={styles.dizimoPreviewHeader}>
                <Text style={styles.dizimoPreviewEvent}>{relatorio.eventName}</Text>
                <Text style={styles.dizimoPreviewValue}>{formatarValor(relatorio.valorTotal)}</Text>
              </View>
              <View style={styles.dizimoPreviewDetails}>
                <Text style={styles.dizimoPreviewBreakdown}>
                  PIX: {formatarValor(relatorio.valorPix)} | Dinheiro: {formatarValor(relatorio.valorDinheiro)}
                </Text>
                <Text style={styles.dizimoPreviewResponsavel}>Por: {relatorio.responsavelNome}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  // Renderizar escalas detalhadas
  const renderEscalas = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.sectionTitle}>Escalas do Diaconato</Text>

      {escalas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>Nenhuma Escala Encontrada</Text>
          <Text style={styles.emptyText}>
            As escalas do diaconato aparecerão aqui quando criadas.
          </Text>
        </View>
      ) : (
        <FlatList
          data={escalas}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const totalConfirmacoes = Object.keys(item.confirmations || {}).length;
            const confirmadas = Object.values(item.confirmations || {}).filter(c => c.confirmed).length;
            const percentualConfirmacao = totalConfirmacoes > 0 ? Math.round((confirmadas / totalConfirmacoes) * 100) : 0;

            return (
              <TouchableOpacity
                style={styles.escalaCard}
                onPress={() => toggleExpand(item.id)}
              >
                <View style={styles.escalaHeader}>
                  <View style={styles.escalaInfo}>
                    <Text style={styles.escalaTitle}>{item.eventoNome}</Text>
                    <Text style={styles.escalaDate}>{item.eventoData} - {item.eventoHorario}</Text>
                    <Text style={styles.escalaTeam}>
                      Time: {item.selectedTeam === 'teamA' ? 'Time A' : 'Time B'}
                    </Text>
                  </View>
                  
                  <View style={styles.escalaStats}>
                    <View style={[
                      styles.escalaStatus,
                      item.scaleConfirmed ? styles.statusConfirmed : styles.statusPending
                    ]}>
                      <Text style={styles.escalaStatusText}>
                        {item.scaleConfirmed ? "CONFIRMADA" : "PENDENTE"}
                      </Text>
                    </View>
                    
                    <View style={styles.confirmationMini}>
                      <Text style={styles.confirmationMiniText}>
                        {confirmadas}/{totalConfirmacoes} ({percentualConfirmacao}%)
                      </Text>
                    </View>
                  </View>
                  
                  <Ionicons 
                    name={expanded === item.id ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#666" 
                  />
                </View>

                {expanded === item.id && (
                  <View style={styles.escalaDetails}>
                    {/* Funções e membros */}
                    {Object.entries(item.functions || {}).map(([funcKey, members]) => {
                      if (!members || members.length === 0) return null;
                      
                      const funcNames = {
                        recepcao: 'Recepção',
                        oferta: 'Oferta',
                        ceia: 'Ceia',
                        ordem: 'Ordem',
                        portaria: 'Portaria',
                        estacionamento: 'Estacionamento'
                      };

                      return (
                        <View key={funcKey} style={styles.functionDetail}>
                          <Text style={styles.functionDetailTitle}>
                            {funcNames[funcKey] || funcKey}:
                          </Text>
                          {members.map((member) => {
                            const confirmation = item.confirmations?.[member.userId];
                            return (
                              <Text key={member.userId} style={styles.functionDetailMember}>
                                • {member.nome} {confirmation?.confirmed ? '✅' : '⏳'}
                                {confirmation?.autoConfirmed && ' (Auto)'}
                              </Text>
                            );
                          })}
                        </View>
                      );
                    })}

                    {/* Observações */}
                    {item.observations && (
                      <View style={styles.observationsDetail}>
                        <Text style={styles.observationsDetailTitle}>Observações:</Text>
                        <Text style={styles.observationsDetailText}>{item.observations}</Text>
                      </View>
                    )}

                    {/* Info de criação */}
                    <View style={styles.creationInfo}>
                      <Text style={styles.creationInfoText}>
                        Criada por: {item.createdByName}
                      </Text>
                      <Text style={styles.creationInfoText}>
                        Em: {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString("pt-BR") : "—"}
                      </Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </ScrollView>
  );

  // Renderizar relatórios de dízimos
  const renderDizimos = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.sectionTitle}>Relatórios de Dízimos</Text>

      {/* Resumo financeiro */}
      <View style={styles.dizimoSummary}>
        <View style={styles.dizimoSummaryCard}>
          <Ionicons name="cash" size={20} color="#50C878" />
          <Text style={styles.dizimoSummaryLabel}>Total Arrecadado</Text>
          <Text style={styles.dizimoSummaryValue}>{formatarValor(stats.totalArrecadado)}</Text>
        </View>
        
        <View style={styles.dizimoSummaryCard}>
          <Ionicons name="document-text" size={20} color="#4A90E2" />
          <Text style={styles.dizimoSummaryLabel}>Relatórios</Text>
          <Text style={styles.dizimoSummaryValue}>{relatoriosDizimos.length}</Text>
        </View>
      </View>

      {relatoriosDizimos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>Nenhum Relatório Encontrado</Text>
          <Text style={styles.emptyText}>
            Os relatórios de dízimos aparecerão aqui quando preenchidos pelos responsáveis da oferta.
          </Text>
        </View>
      ) : (
        <FlatList
          data={relatoriosDizimos}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.dizimoCard}>
              <View style={styles.dizimoCardHeader}>
                <View style={styles.dizimoCardInfo}>
                  <Text style={styles.dizimoCardTitle}>{item.eventName}</Text>
                  <Text style={styles.dizimoCardDate}>{item.eventDate} - {item.eventTime}</Text>
                  <Text style={styles.dizimoCardResponsavel}>
                    Responsável: {item.responsavelNome}
                  </Text>
                </View>
                
                <View style={styles.dizimoCardValues}>
                  <Text style={styles.dizimoCardTotal}>{formatarValor(item.valorTotal)}</Text>
                </View>
              </View>

              <View style={styles.dizimoCardDetails}>
                <View style={styles.dizimoBreakdown}>
                  <View style={styles.dizimoBreakdownItem}>
                    <View style={styles.dizimoBreakdownIcon}>
                      <Ionicons name="card" size={16} color="#4A90E2" />
                    </View>
                    <Text style={styles.dizimoBreakdownLabel}>PIX:</Text>
                    <Text style={styles.dizimoBreakdownValue}>{formatarValor(item.valorPix)}</Text>
                  </View>
                  
                  <View style={styles.dizimoBreakdownItem}>
                    <View style={styles.dizimoBreakdownIcon}>
                      <Ionicons name="cash" size={16} color="#50C878" />
                    </View>
                    <Text style={styles.dizimoBreakdownLabel}>Dinheiro:</Text>
                    <Text style={styles.dizimoBreakdownValue}>{formatarValor(item.valorDinheiro)}</Text>
                  </View>
                </View>

                {item.observacoes && (
                  <View style={styles.dizimoObservacoes}>
                    <Text style={styles.dizimoObservacoesTitle}>Observações:</Text>
                    <Text style={styles.dizimoObservacoesText}>{item.observacoes}</Text>
                  </View>
                )}

                <View style={styles.dizimoFooter}>
                  <Text style={styles.dizimoFooterText}>
                    Enviado em: {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString("pt-BR") : "—"}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#666" />
        </TouchableOpacity>
        <Text style={styles.title}>Relatório — Diaconato</Text>
        <Text style={styles.userName}>{userName}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "resumo" && styles.activeTab]}
          onPress={() => setActiveTab("resumo")}
        >
          <Ionicons 
            name="analytics" 
            size={18} 
            color={activeTab === "resumo" ? "#B8986A" : "#666"} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === "resumo" && styles.activeTabText
          ]}>
            Resumo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "escalas" && styles.activeTab]}
          onPress={() => setActiveTab("escalas")}
        >
          <Ionicons 
            name="calendar" 
            size={18} 
            color={activeTab === "escalas" ? "#4A90E2" : "#666"} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === "escalas" && styles.activeTabText
          ]}>
            Escalas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "dizimos" && styles.activeTab]}
          onPress={() => setActiveTab("dizimos")}
        >
          <Ionicons 
            name="cash" 
            size={18} 
            color={activeTab === "dizimos" ? "#FFD700" : "#666"} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === "dizimos" && styles.activeTabText
          ]}>
            Dízimos
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#B8986A" />
          <Text style={styles.loadingText}>Carregando relatórios...</Text>
        </View>
      ) : (
        <>
          {activeTab === "resumo" && renderResumo()}
          {activeTab === "escalas" && renderEscalas()}
          {activeTab === "dizimos" && renderDizimos()}
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
  loadingContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  loadingText: { 
    marginTop: 8, 
    color: "#666" 
  },
  content: { flex: 1, padding: 16 },
  
  // Estatísticas
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 8,
  },
  statCard: {
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
  statNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
  },

  // Progresso
  progressSection: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  progressContainer: {
    alignItems: "center",
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
  },
  progressText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },

  // Seções
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },

  // Cards de atividade
  activityCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  activityHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginLeft: 8,
  },
  activityStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusConfirmed: {
    backgroundColor: "#e8f5e8",
  },
  statusPending: {
    backgroundColor: "#fff3cd",
  },
  activityStatusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  activityDate: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  activityCreator: {
    fontSize: 11,
    color: "#999",
  },

  // Preview dízimos
  dizimoPreviewCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  dizimoPreviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  dizimoPreviewEvent: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  dizimoPreviewValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#50C878",
  },
  dizimoPreviewDetails: {
    gap: 2,
  },
  dizimoPreviewBreakdown: {
    fontSize: 11,
    color: "#666",
  },
  dizimoPreviewResponsavel: {
    fontSize: 11,
    color: "#999",
  },

  // Empty states
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

  // Escalas detalhadas
  escalaCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    overflow: "hidden",
  },
  escalaHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  escalaInfo: {
    flex: 1,
  },
  escalaTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  escalaDate: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  escalaTeam: {
    fontSize: 13,
    color: "#B8986A",
    fontWeight: "600",
    marginTop: 4,
  },
  escalaStats: {
    alignItems: "flex-end",
    gap: 4,
  },
  escalaStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  escalaStatusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  confirmationMini: {
    alignItems: "center",
  },
  confirmationMiniText: {
    fontSize: 11,
    color: "#666",
  },
  escalaDetails: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  functionDetail: {
    marginBottom: 12,
  },
  functionDetailTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  functionDetailMember: {
    fontSize: 13,
    color: "#555",
    paddingLeft: 8,
    marginBottom: 2,
  },
  observationsDetail: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  observationsDetailTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  observationsDetailText: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
  },
  creationInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  creationInfoText: {
    fontSize: 11,
    color: "#999",
    marginBottom: 2,
  },

  // Dízimos Summary
  dizimoSummary: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  dizimoSummaryCard: {
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
  dizimoSummaryLabel: {
    fontSize: 12,
    color: "#666",
    marginVertical: 4,
    textAlign: "center",
  },
  dizimoSummaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },

  // Dízimos Cards
  dizimoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    overflow: "hidden",
  },
  dizimoCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dizimoCardInfo: {
    flex: 1,
  },
  dizimoCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  dizimoCardDate: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  dizimoCardResponsavel: {
    fontSize: 12,
    color: "#B8986A",
    marginTop: 4,
    fontWeight: "500",
  },
  dizimoCardValues: {
    alignItems: "flex-end",
  },
  dizimoCardTotal: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#50C878",
  },
  dizimoCardDetails: {
    padding: 16,
  },
  dizimoBreakdown: {
    gap: 8,
    marginBottom: 12,
  },
  dizimoBreakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dizimoBreakdownIcon: {
    width: 24,
    alignItems: "center",
  },
  dizimoBreakdownLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    minWidth: 70,
  },
  dizimoBreakdownValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  dizimoObservacoes: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  dizimoObservacoesTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  dizimoObservacoesText: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
  },
  dizimoFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  dizimoFooterText: {
    fontSize: 11,
    color: "#999",
    textAlign: "right",
  },
});