// MinisterioMembros.js - CORRIGIDO - Sem duplicatas e com navegação inteligente
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
      
      console.log("Buscando ministérios para userId:", user.uid);

      // Lista de todos os ministérios para buscar
      const ministeriosConfig = [
        {
          collection: "comunicacao",
          name: "Comunicação",
          icon: "megaphone",
          color: "#4A90E2",
          lider: "Pastor João",
          route: "MinisterioComunicacaoAdmin"
        },
        {
          collection: "celula",
          name: "Células",
          icon: "people",
          color: "#B8986A",
          lider: "Pastor Pedro",
          route: "MinisterioCelulaAdmin"
        },
        {
          collection: "kids",
          name: "Kids",
          icon: "happy",
          color: "#FF6B6B",
          lider: "Tia Maria",
          route: "MinisterioKidsAdmin"
        },
        {
          collection: "louvor",
          name: "Louvor",
          icon: "musical-notes",
          color: "#9B59B6",
          lider: "Pr. Carlos",
          route: "MinisterioLouvorAdmin"
        },
        {
          collection: "diaconato",
          name: "Diaconato",
          icon: "shield",
          color: "#8B4513",
          lider: "Pr. Marcos",
          route: "MinisterioDiaconatoAdmin"
        }
      ];

      // Buscar em cada ministério
      for (const ministerioConfig of ministeriosConfig) {
        try {
          let ministerioInfo = null;

          // 1. PRIMEIRO: Buscar se é líder geral (para diaconato)
          if (ministerioConfig.collection === "diaconato") {
            try {
              const lideresRef = collection(
                db, 
                "churchBasico", 
                "ministerios", 
                "conteudo", 
                "diaconato", 
                "lideres"
              );
              
              const lideresSnapshot = await getDocs(lideresRef);
              
              lideresSnapshot.forEach((doc) => {
                const data = doc.data();
                
                if (data.userId === user.uid) {
                  const roleMapping = {
                    "general": "responsavel",
                    "teamA": "liderTimeA", 
                    "teamB": "liderTimeB"
                  };

                  ministerioInfo = {
                    id: `diaconato_leader_${doc.id}`,
                    ministerio: ministerioConfig.name,
                    ministerioId: ministerioConfig.collection,
                    icon: ministerioConfig.icon,
                    color: ministerioConfig.color,
                    role: roleMapping[doc.id] || "lider",
                    lider: ministerioConfig.lider,
                    route: ministerioConfig.route,
                    source: "lideres",
                    leadershipType: doc.id,
                    permissions: {
                      canCreateScales: true,
                      canViewAllScales: doc.id === "general",
                      defaultTab: doc.id === "general" ? "membros" : "escalas"
                    },
                    ...data
                  };

                  console.log(`Encontrado como líder: ${doc.id}`, ministerioInfo);
                }
              });
            } catch (error) {
              console.log("Erro ao buscar líderes do diaconato:", error);
            }
          }

          // 2. SE NÃO É LÍDER: Buscar como membro comum
          if (!ministerioInfo) {
            const membrosRef = collection(
              db, 
              "churchBasico", 
              "ministerios", 
              "conteudo", 
              ministerioConfig.collection, 
              "membros"
            );
            
            const membrosQuery = query(membrosRef, where("userId", "==", user.uid));
            const membrosSnapshot = await getDocs(membrosQuery);
            
            membrosSnapshot.forEach((doc) => {
              const data = doc.data();
              
              // Não adicionar se já foi encontrado como líder
              if (!ministerioInfo) {
                ministerioInfo = {
                  id: doc.id,
                  ministerio: ministerioConfig.name,
                  ministerioId: ministerioConfig.collection,
                  icon: ministerioConfig.icon,
                  color: ministerioConfig.color,
                  role: data.role || "membro",
                  lider: ministerioConfig.lider,
                  route: ministerioConfig.route,
                  source: "membros",
                  permissions: {
                    canCreateScales: false,
                    canViewAllScales: false,
                    defaultTab: "escalas"
                  },
                  ...data
                };

                console.log(`Encontrado como membro: ${ministerioConfig.name}`, ministerioInfo);
              }
            });
          }

          // 3. ADICIONAR À LISTA (apenas uma vez por ministério)
          if (ministerioInfo) {
            ministeriosData.push(ministerioInfo);
          }

        } catch (error) {
          console.log(`Erro ao buscar ministério ${ministerioConfig.name}:`, error);
        }
      }

      console.log("Total de ministérios encontrados (sem duplicatas):", ministeriosData.length);
      setMinisterios(ministeriosData);

    } catch (error) {
      console.log("Erro ao carregar ministérios:", error);
      Alert.alert("Erro", "Não foi possível carregar seus ministérios");
    } finally {
      setLoading(false);
    }
  };

  // Navegação inteligente baseada no papel do usuário
  const navigateToMinisterio = (ministerio) => {
    console.log("Navegando para ministério:", ministerio);

    // Para diaconato, navegar direto para a aba correta
    if (ministerio.ministerioId === "diaconato") {
      navigation.navigate(ministerio.route, {
        userRole: ministerio.role,
        ministerioData: ministerio,
        initialTab: ministerio.permissions?.defaultTab || "escalas",
        permissions: ministerio.permissions
      });
    } else {
      // Para outros ministérios, navegação padrão
      navigation.navigate(ministerio.route, {
        userRole: ministerio.role,
        ministerioData: ministerio
      });
    }
  };

  const getRoleDisplayName = (role, leadershipType) => {
    switch (role) {
      case "responsavel":
        return "Responsável Geral";
      case "liderTimeA":
        return "Líder do Time A";
      case "liderTimeB": 
        return "Líder do Time B";
      case "lider":
      case "liderTime":
        return "Líder";
      case "coordenador":
        return "Coordenador";
      case "voluntario":
        return "Voluntário";
      default:
        return "Membro";
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "responsavel":
        return "#FFD700";
      case "liderTimeA":
      case "liderTimeB":
        return "#FF6B35";
      case "lider":
      case "liderTime":
        return "#4CAF50";
      case "coordenador":
        return "#2196F3";
      default:
        return "#B8986A";
    }
  };

  const renderMinisterioCard = ({ item }) => {
    const roleDisplayName = getRoleDisplayName(item.role, item.leadershipType);
    const roleColor = getRoleColor(item.role);

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
            
            <View style={styles.roleContainer}>
              <View style={[styles.roleBadge, { backgroundColor: roleColor }]}>
                <Text style={styles.roleText}>{roleDisplayName}</Text>
              </View>
            </View>

            {/* Indicadores de permissões */}
            {item.permissions?.canCreateScales && (
              <View style={styles.permissionContainer}>
                <Ionicons name="create" size={12} color="#4CAF50" />
                <Text style={styles.permissionText}>Pode criar escalas</Text>
              </View>
            )}
          </View>
          
          <View style={styles.ministerioArrow}>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>
        </View>

        {/* Preview de funcionalidades */}
        <View style={styles.ministerioPreview}>
          {item.ministerioId === "diaconato" && (
            <Text style={styles.previewText}>
              {item.permissions?.canCreateScales 
                ? "Gerencie escalas e organize o ministério" 
                : "Visualize suas escalas e atividades"
              }
            </Text>
          )}
          
          {item.ministerioId !== "diaconato" && (
            <Text style={styles.previewText}>
              Acesse as atividades do ministério
            </Text>
          )}
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

      {/* Debug Info - Remover em produção */}
      {__DEV__ && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>Debug - User ID: {user?.uid}</Text>
          <Text style={styles.debugText}>User Email: {user?.email}</Text>
          <Text style={styles.debugText}>Ministérios encontrados: {ministerios.length}</Text>
        </View>
      )}

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
                Toque em um ministério para acessar suas funcionalidades
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
                  {ministerios.filter(m => 
                    m.role === "responsavel" || 
                    m.role === "lider" || 
                    m.role === "liderTime" ||
                    m.role === "liderTimeA" ||
                    m.role === "liderTimeB"
                  ).length}
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
  debugInfo: {
    backgroundColor: "#fff3cd",
    padding: 10,
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffeaa7",
  },
  debugText: {
    fontSize: 12,
    color: "#856404",
    marginBottom: 2,
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
    overflow: "hidden",
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
    marginBottom: 8,
  },
  roleContainer: {
    marginBottom: 6,
  },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },
  permissionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  permissionText: {
    fontSize: 11,
    color: "#4CAF50",
    fontWeight: "500",
  },
  ministerioArrow: {
    marginLeft: 10,
  },
  ministerioPreview: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  previewText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
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