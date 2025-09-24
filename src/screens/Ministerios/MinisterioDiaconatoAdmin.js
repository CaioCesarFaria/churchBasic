// MinisterioDiaconatoAdmin.js - CORRIGIDO COM NAVEGAÇÃO INTELIGENTE E PERMISSÕES
import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../context/AuthContext";
import { db } from "../../Firebase/FirebaseConfig";
import {
  collection,
  doc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";

// Componentes
import DiaconatoTimes from "../../components/DiaconatoTimes";
import DiaconatoEscalas from "../../components/DiaconatoEscalas";
import DiaconatoMembros from "../../components/DiaconatoMembros";

export default function MinisterioDiaconatoAdmin({ navigation, route }) {
  const { user, userData } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  
  // Receber parâmetros da navegação
  const routeParams = route?.params || {};
  const initialTab = routeParams.initialTab || "escalas";
  const permissions = routeParams.permissions || {};
  const userRoleFromRoute = routeParams.userRole || "member";
  const ministerioData = routeParams.ministerioData || {};
  
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Estados gerais
  const [events, setEvents] = useState([]);
  const [teams, setTeams] = useState({ teamA: [], teamB: [] });
  const [teamLeaders, setTeamLeaders] = useState({ 
    teamA: null, 
    teamB: null,
    general: null
  });
  const [scales, setScales] = useState([]);
  const [members, setMembers] = useState([]);

  const userName = userData?.name || user?.displayName || "Usuário";
  
  // Sistema de Permissões mais inteligente
  const userType = userData?.userType || userRoleFromRoute || "member";
  const isAdminMaster = userType === "adminMaster";
  const isAdmin = userType === "admin" || isAdminMaster;
  const isLiderGeral = userRoleFromRoute === "responsavel" || ministerioData?.role === "responsavel";
  const isLiderTimeA = userRoleFromRoute === "liderTimeA" || ministerioData?.role === "liderTimeA";
  const isLiderTimeB = userRoleFromRoute === "liderTimeB" || ministerioData?.role === "liderTimeB";
  const isLiderTime = isLiderTimeA || isLiderTimeB;
  const isMember = !isAdmin && !isLiderGeral && !isLiderTime;

  // Definir permissões baseadas no contexto
  const userPermissions = {
    // Gerenciamento de membros
    canManageMembers: isAdminMaster || isAdmin || isLiderGeral,
    
    // Organização de times
    canManageTeams: isAdminMaster || isAdmin || isLiderGeral,
    
    // Criação de escalas
    canCreateScales: isAdminMaster || isAdmin || isLiderGeral || isLiderTime,
    
    // Visualização de escalas
    canViewAllScales: isAdminMaster || isAdmin || isLiderGeral,
    canViewOwnScales: isLiderTime || isMember,
    
    // Tabs disponíveis
    availableTabs: {
      membros: isAdminMaster || isAdmin || isLiderGeral,
      times: isAdminMaster || isAdmin || isLiderGeral,
      escalas: true // Todos podem ver escalas
    }
  };

  console.log("Permissões do usuário:", {
    userType,
    userRoleFromRoute,
    ministerioData,
    userPermissions,
    initialTab
  });

  // Carregar dados ao iniciar
  useEffect(() => {
    loadAllData();
  }, []);

  // Ajustar aba ativa se não tiver permissão
  useEffect(() => {
    if (activeTab === "times" && !userPermissions.availableTabs.times) {
      setActiveTab("escalas");
    }
    if (activeTab === "membros" && !userPermissions.availableTabs.membros) {
      setActiveTab("escalas");
    }
  }, [activeTab, userPermissions]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadEvents(),
        loadMembers(),
        userPermissions.canManageTeams ? loadTeams() : Promise.resolve(),
        loadScales(),
      ]);
    } catch (error) {
      console.log("Erro ao carregar dados:", error);
      Alert.alert("Erro", "Erro ao carregar dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Carregar eventos criados pelo AdminMaster
  const loadEvents = async () => {
    try {
      const eventsRef = collection(db, "churchBasico", "sistema", "eventos");
      const q = query(eventsRef, orderBy("criadoEm", "desc"));
      const querySnapshot = await getDocs(q);
      
      const eventsData = [];
      querySnapshot.forEach((doc) => {
        eventsData.push({ id: doc.id, ...doc.data() });
      });
      
      setEvents(eventsData);
    } catch (error) {
      console.log("Erro ao carregar eventos:", error);
    }
  };

  // Carregar membros do diaconato
  const loadMembers = async () => {
    try {
      const membersRef = collection(db, "churchBasico", "ministerios", "conteudo", "diaconato", "membros");
      const q = query(membersRef, orderBy("nome"));
      const querySnapshot = await getDocs(q);
      
      const membersData = [];
      querySnapshot.forEach((doc) => {
        membersData.push({ id: doc.id, ...doc.data() });
      });
      
      setMembers(membersData);
    } catch (error) {
      console.log("Erro ao carregar membros:", error);
    }
  };

  // Carregar times A e B
  const loadTeams = async () => {
    if (!userPermissions.canManageTeams) return;
    
    try {
      // Carregar Time A
      const teamARef = collection(db, "churchBasico", "ministerios", "conteudo", "diaconato", "times", "teamA", "membros");
      const teamASnapshot = await getDocs(teamARef);
      const teamAData = [];
      teamASnapshot.forEach((doc) => {
        teamAData.push({ id: doc.id, ...doc.data() });
      });

      // Carregar Time B
      const teamBRef = collection(db, "churchBasico", "ministerios", "conteudo", "diaconato", "times", "teamB", "membros");
      const teamBSnapshot = await getDocs(teamBRef);
      const teamBData = [];
      teamBSnapshot.forEach((doc) => {
        teamBData.push({ id: doc.id, ...doc.data() });
      });

      // Carregar líderes
      const leadersRef = collection(db, "churchBasico", "ministerios", "conteudo", "diaconato", "lideres");
      const leadersSnapshot = await getDocs(leadersRef);
      const leadersData = {};
      leadersSnapshot.forEach((doc) => {
        leadersData[doc.id] = doc.data();
      });

      setTeams({ teamA: teamAData, teamB: teamBData });
      setTeamLeaders({
        teamA: leadersData.teamA || null,
        teamB: leadersData.teamB || null,
        general: leadersData.general || null
      });
    } catch (error) {
      console.log("Erro ao carregar times:", error);
    }
  };

  // Carregar escalas do diaconato com filtros baseados em permissões
  const loadScales = async () => {
    try {
      const scalesData = [];
      
      for (const event of events) {
        try {
          const scalesRef = collection(db, "churchBasico", "sistema", "eventos", event.id, "escalas");
          const querySnapshot = await getDocs(scalesRef);
          
          querySnapshot.forEach((doc) => {
            const scaleData = doc.data();
            
            // Verificar se é escala de diaconato
            if (scaleData.ministerio === "diaconato") {
              let shouldInclude = false;

              // AdminMaster e Líder Geral veem todas as escalas
              if (userPermissions.canViewAllScales) {
                shouldInclude = true;
              }
              // Líderes de time veem suas próprias escalas
              else if (isLiderTime && scaleData.createdBy === user.uid) {
                shouldInclude = true;
              }
              // Membros veem escalas onde estão incluídos
              else if (isMember && scaleData.functions) {
                const isIncluded = Object.values(scaleData.functions).some(functionMembers =>
                  functionMembers.some(member => member.userId === user.uid)
                );
                shouldInclude = isIncluded;
              }

              if (shouldInclude) {
                scalesData.push({
                  id: doc.id,
                  eventId: event.id,
                  eventName: event.nome,
                  eventDate: event.data,
                  eventTime: event.horario,
                  ...scaleData
                });
              }
            }
          });
          
        } catch (error) {
          console.log(`Erro ao carregar escala do evento ${event.id}:`, error);
        }
      }
      
      // Ordenar por data do evento
      scalesData.sort((a, b) => {
        const dateA = new Date(a.eventDate.split('/').reverse().join('-'));
        const dateB = new Date(b.eventDate.split('/').reverse().join('-'));
        return dateB - dateA;
      });
      
      setScales(scalesData);
    } catch (error) {
      console.log("Erro ao carregar escalas:", error);
    }
  };

  // Função para atualizar dados após mudanças
  const refreshData = async () => {
    await loadAllData();
  };

  // Determinar texto do subtítulo baseado no papel
  const getSubtitleText = () => {
    if (isAdminMaster) return "Admin Master";
    if (isLiderGeral) return "Responsável Geral";
    if (isLiderTimeA) return "Líder do Time A";
    if (isLiderTimeB) return "Líder do Time B";
    if (isAdmin) return "Admin";
    return "Membro";
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
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Diaconato</Text>
          <Text style={styles.headerSubtitle}>{getSubtitleText()}</Text>
        </View>
        
        <Text style={styles.leaderName}>{userName}</Text>
      </View>

      {/* Tabs - Mostrar baseado nas permissões */}
      <View style={styles.tabsContainer}>
        {userPermissions.availableTabs.membros && (
          <TouchableOpacity
            style={[styles.tab, activeTab === "membros" && styles.activeTab]}
            onPress={() => setActiveTab("membros")}
          >
            <Ionicons 
              name="person" 
              size={18} 
              color={activeTab === "membros" ? "#B8986A" : "#666"} 
            />
            <Text style={[
              styles.tabText, 
              activeTab === "membros" && styles.activeTabText
            ]}>
              Membros
            </Text>
          </TouchableOpacity>
        )}

        {userPermissions.availableTabs.times && (
          <TouchableOpacity
            style={[styles.tab, activeTab === "times" && styles.activeTab]}
            onPress={() => setActiveTab("times")}
          >
            <Ionicons 
              name="people" 
              size={18} 
              color={activeTab === "times" ? "#B8986A" : "#666"} 
            />
            <Text style={[
              styles.tabText, 
              activeTab === "times" && styles.activeTabText
            ]}>
              Times
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.tab, activeTab === "escalas" && styles.activeTab]}
          onPress={() => setActiveTab("escalas")}
        >
          <Ionicons 
            name="list" 
            size={18} 
            color={activeTab === "escalas" ? "#B8986A" : "#666"} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === "escalas" && styles.activeTabText
          ]}>
            Escalas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Indicador de permissões (apenas em desenvolvimento) */}
      {__DEV__ && (
        <View style={styles.debugPermissions}>
          <Text style={styles.debugText}>
            Permissões: {userPermissions.canCreateScales ? "Criar ✓" : "Criar ✗"} | 
            {userPermissions.canViewAllScales ? " Ver Todas ✓" : " Ver Próprias"}
          </Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#B8986A" />
          </View>
        )}

        {/* Aba Membros - Apenas para Admin/Responsável */}
        {activeTab === "membros" && userPermissions.availableTabs.membros && (
          <DiaconatoMembros
            members={members}
            onRefresh={refreshData}
          />
        )}

        {/* Aba Times - Apenas para Admin/Responsável */}
        {activeTab === "times" && userPermissions.availableTabs.times && (
          <DiaconatoTimes
            members={members}
            teams={teams}
            teamLeaders={teamLeaders}
            onRefresh={refreshData}
          />
        )}

        {/* Aba Escalas - Para todos */}
        {activeTab === "escalas" && (
          <DiaconatoEscalas
            events={events}
            scales={scales}
            teams={teams}
            teamLeaders={teamLeaders}
            members={members}
            onRefresh={refreshData}
            canCreateScales={userPermissions.canCreateScales}
            canViewAllScales={userPermissions.canViewAllScales}
            userType={userType}
            currentUserId={user.uid}
            userRole={userRoleFromRoute}
            isLiderTimeA={isLiderTimeA}
            isLiderTimeB={isLiderTimeB}
          />
        )}

        {/* Mensagem de boas-vindas personalizada */}
        {!loading && (
          <View style={styles.welcomeMessage}>
            {isLiderGeral && (
              <Text style={styles.welcomeText}>
                Como Responsável Geral, você pode gerenciar todos os aspectos do Diaconato.
              </Text>
            )}
            {isLiderTimeA && (
              <Text style={styles.welcomeText}>
                Como Líder do Time A, você pode criar escalas para seu time.
              </Text>
            )}
            {isLiderTimeB && (
              <Text style={styles.welcomeText}>
                Como Líder do Time B, você pode criar escalas para seu time.
              </Text>
            )}
            {isMember && (
              <Text style={styles.welcomeText}>
                Aqui você pode visualizar suas escalas e atividades no Diaconato.
              </Text>
            )}
          </View>
        )}

        {/* Mensagem de acesso negado */}
        {!userPermissions.availableTabs.escalas && (
          <View style={styles.accessDeniedContainer}>
            <Ionicons name="lock-closed" size={48} color="#ccc" />
            <Text style={styles.accessDeniedTitle}>Acesso Restrito</Text>
            <Text style={styles.accessDeniedText}>
              Você não tem permissão para acessar esta área.
            </Text>
          </View>
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
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#B8986A",
    fontWeight: "500",
  },
  leaderName: {
    fontSize: 14,
    color: "#666",
  },
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
  debugPermissions: {
    backgroundColor: "#e3f2fd",
    padding: 8,
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 5,
  },
  debugText: {
    fontSize: 11,
    color: "#1976d2",
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    zIndex: 1000,
  },
  welcomeMessage: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#f8f4e6",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#B8986A",
  },
  welcomeText: {
    fontSize: 13,
    color: "#B8986A",
    textAlign: "center",
    lineHeight: 18,
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  accessDeniedTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 15,
    marginBottom: 8,
  },
  accessDeniedText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
});