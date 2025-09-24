// DiaconatoMembros.js - Componente para Gerenciar Membros do Diaconato
import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { db } from "../Firebase/FirebaseConfig";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function DiaconatoMembros({ 
  members, 
  onRefresh 
}) {
  const { user, userData } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  
  // Estados para modal de adicionar membro
  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [searchUsers, setSearchUsers] = useState([]);
  const [userSearchText, setUserSearchText] = useState("");
  const [searchingUsers, setSearchingUsers] = useState(false);
  
  // Estados para expansão da lista
  const [membersExpanded, setMembersExpanded] = useState(false);

  const userName = userData?.name || user?.displayName || "Admin";

  // Verificar se é admin (apenas admin pode gerenciar membros)
  const userType = userData?.userType || "member";
  const isAdmin = userType === "admin" || userType === "adminMaster";
  const canManageMembers = isAdmin;

  // Buscar usuários no banco de dados
  const searchUsersInDatabase = async (searchText) => {
    if (!canManageMembers) return;
    
    if (!searchText.trim() || searchText.length < 2) {
      setSearchUsers([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const usersRef = collection(db, "churchBasico", "users", "members");
      const querySnapshot = await getDocs(usersRef);
      
      const usersData = [];
      querySnapshot.forEach((doc) => {
        const userData = { id: doc.id, ...doc.data() };
        if (userData.name && userData.name.toLowerCase().includes(searchText.toLowerCase())) {
          usersData.push(userData);
        }
      });
      
      setSearchUsers(usersData);
    } catch (error) {
      console.log("Erro ao buscar usuários:", error);
    } finally {
      setSearchingUsers(false);
    }
  };

  // Debounce para busca de usuários
  React.useEffect(() => {
    if (!canManageMembers) return;
    
    const timeoutId = setTimeout(() => {
      searchUsersInDatabase(userSearchText);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [userSearchText, canManageMembers]);

  // Abrir modal para adicionar membro
  const openAddMemberModal = () => {
    if (!canManageMembers) {
      Alert.alert("Acesso Negado", "Apenas o líder do ministério pode adicionar membros.");
      return;
    }
    setUserSearchText("");
    setSearchUsers([]);
    setMemberModalVisible(true);
  };

  // Adicionar membro ao ministério
  const addMemberFromUser = async (selectedUser) => {
    if (!canManageMembers) return;
    
    try {
      setLoading(true);
      
      // Verificar se já é membro
      const isAlreadyMember = members.find(member => member.userId === selectedUser.id);
      if (isAlreadyMember) {
        Alert.alert("Aviso", "Este usuário já é membro do ministério!");
        return;
      }

      const memberData = {
        userId: selectedUser.id,
        nome: selectedUser.name,
        email: selectedUser.email,
        telefone: selectedUser.phone || "",
        ministerio: "diaconato",
        role: "membro", // Papel padrão
        registeredBy: user.uid,
        registeredByName: userName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const memberId = `member_${selectedUser.id}`;
      const memberRef = doc(db, "churchBasico", "ministerios", "conteudo", "diaconato", "membros", memberId);

      await setDoc(memberRef, memberData);
      Alert.alert("Sucesso", "Membro adicionado ao Diaconato com sucesso!");

      setMemberModalVisible(false);
      setUserSearchText("");
      setSearchUsers([]);
      await onRefresh();

    } catch (error) {
      console.log("Erro ao adicionar membro:", error);
      Alert.alert("Erro", `Não foi possível adicionar o membro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Remover membro do ministério
  const deleteMember = (member) => {
    if (!canManageMembers) {
      Alert.alert("Acesso Negado", "Apenas o líder do ministério pode remover membros.");
      return;
    }

    Alert.alert(
      "Confirmar Remoção",
      `Tem certeza que deseja remover ${member.nome}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await deleteDoc(doc(db, "churchBasico", "ministerios", "conteudo", "diaconato", "membros", member.id));
              Alert.alert("Sucesso", "Membro removido com sucesso!");
              await onRefresh();
            } catch (error) {
              console.log("Erro ao remover membro:", error);
              Alert.alert("Erro", "Não foi possível remover. Tente novamente.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Promover membro a líder de time
  const promoteToTeamLeader = (member) => {
    if (!canManageMembers) return;

    Alert.alert(
      "Promover a Líder de Time",
      `Deseja promover ${member.nome} a líder de time?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Time A",
          onPress: () => setTeamLeaderRole(member, "liderTimeA")
        },
        {
          text: "Time B", 
          onPress: () => setTeamLeaderRole(member, "liderTimeB")
        }
      ]
    );
  };

  // Definir papel de líder de time
  const setTeamLeaderRole = async (member, newRole) => {
    try {
      setLoading(true);
      
      const memberRef = doc(db, "churchBasico", "ministerios", "conteudo", "diaconato", "membros", member.id);
      await setDoc(memberRef, {
        ...member,
        role: newRole,
        userType: "liderTime", // Nova classificação
        promotedAt: serverTimestamp(),
        promotedBy: user.uid,
        promotedByName: userName,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      const teamName = newRole === "liderTimeA" ? "Time A" : "Time B";
      Alert.alert("Sucesso", `${member.nome} promovido a Líder do ${teamName}!`);
      
      await onRefresh();
    } catch (error) {
      console.log("Erro ao promover:", error);
      Alert.alert("Erro", "Não foi possível promover o membro.");
    } finally {
      setLoading(false);
    }
  };

  // Rebaixar líder de time
  const demoteTeamLeader = (member) => {
    if (!canManageMembers) return;

    Alert.alert(
      "Remover Liderança",
      `Deseja remover a liderança de ${member.nome}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              
              const memberRef = doc(db, "churchBasico", "ministerios", "conteudo", "diaconato", "membros", member.id);
              await setDoc(memberRef, {
                ...member,
                role: "membro",
                userType: "member",
                demotedAt: serverTimestamp(),
                demotedBy: user.uid,
                demotedByName: userName,
                updatedAt: serverTimestamp(),
              }, { merge: true });

              Alert.alert("Sucesso", `${member.nome} não é mais líder de time.`);
              await onRefresh();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível alterar o status.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Obter estatísticas
  const getMembersStats = () => {
    const totalMembers = members.length;
    const teamLeaders = members.filter(m => 
      m.role === "liderTimeA" || m.role === "liderTimeB"
    ).length;
    const regularMembers = totalMembers - teamLeaders;

    return { totalMembers, teamLeaders, regularMembers };
  };

  const stats = getMembersStats();
  const membersToShow = membersExpanded ? members : members.slice(0, 3);

  return (
    <ScrollView style={styles.container}>
      {/* Header com estatísticas */}
      <View style={styles.header}>
        <Text style={styles.title}>Membros do Diaconato</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color="#B8986A" />
            <Text style={styles.statNumber}>{stats.totalMembers}</Text>
            <Text style={styles.statLabel}>Total de Membros</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="star" size={24} color="#FFD700" />
            <Text style={styles.statNumber}>{stats.teamLeaders}</Text>
            <Text style={styles.statLabel}>Líderes de Times</Text>
          </View>
        </View>

        {/* Botão adicionar membro (apenas para admin) */}
        {canManageMembers && (
          <TouchableOpacity style={styles.addMemberButton} onPress={openAddMemberModal}>
            <Ionicons name="person-add" size={20} color="#fff" />
            <Text style={styles.addMemberButtonText}>Adicionar Membro</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Lista de Membros */}
      <View style={styles.membersCard}>
        <View style={styles.membersCardHeader}>
          <Text style={styles.membersCardTitle}>
            Lista de Membros ({members.length})
          </Text>
          
          {members.length > 3 && (
            <TouchableOpacity 
              style={styles.expandButton}
              onPress={() => setMembersExpanded(!membersExpanded)}
            >
              <Text style={styles.expandText}>
                {membersExpanded ? "Mostrar menos" : `Ver todos (${members.length})`}
              </Text>
              <Ionicons 
                name={membersExpanded ? "chevron-up" : "chevron-down"} 
                size={16} 
                color="#B8986A" 
              />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.membersContent}>
          {membersToShow.length > 0 ? (
            <FlatList
              data={membersToShow}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.memberCard}>
                  <View style={styles.memberInfo}>
                    <View style={styles.memberMainInfo}>
                      <Text style={styles.memberName}>{item.nome}</Text>
                      <View style={styles.memberRoleBadge}>
                        <Text style={styles.memberRoleText}>
                          {item.role === "liderTimeA" ? "Líder Time A" :
                           item.role === "liderTimeB" ? "Líder Time B" : "Membro"}
                        </Text>
                        {(item.role === "liderTimeA" || item.role === "liderTimeB") && (
                          <Ionicons name="star" size={12} color="#FFD700" />
                        )}
                      </View>
                    </View>
                    
                    {item.telefone && (
                      <Text style={styles.memberContact}>📞 {item.telefone}</Text>
                    )}
                    {item.email && (
                      <Text style={styles.memberContact}>📧 {item.email}</Text>
                    )}
                  </View>
                  
                  {canManageMembers && (
                    <View style={styles.memberActions}>
                      {/* Botão de promover/rebaixar */}
                      {item.role === "membro" ? (
                        <TouchableOpacity
                          style={styles.promoteButton}
                          onPress={() => promoteToTeamLeader(item)}
                        >
                          <Ionicons name="arrow-up-circle" size={16} color="#50C878" />
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.demoteButton}
                          onPress={() => demoteTeamLeader(item)}
                        >
                          <Ionicons name="arrow-down-circle" size={16} color="#FFA500" />
                        </TouchableOpacity>
                      )}
                      
                      {/* Botão de remover */}
                      <TouchableOpacity
                        style={styles.deleteMemberButton}
                        onPress={() => deleteMember(item)}
                      >
                        <Ionicons name="trash" size={16} color="#ff4444" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <Text style={styles.emptyText}>Nenhum membro cadastrado ainda</Text>
          )}
        </View>
      </View>

      {/* Modal para Adicionar Membro */}
      <Modal
        visible={memberModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setMemberModalVisible(false);
          setUserSearchText("");
          setSearchUsers([]);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar Membro ao Diaconato</Text>
              <TouchableOpacity
                onPress={() => {
                  setMemberModalVisible(false);
                  setUserSearchText("");
                  setSearchUsers([]);
                }}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Procurar Membro:</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite o nome para buscar..."
                value={userSearchText}
                onChangeText={setUserSearchText}
                autoFocus
              />
            </View>

            {searchingUsers && (
              <View style={styles.searchingContainer}>
                <ActivityIndicator size="small" color="#B8986A" />
                <Text style={styles.searchingText}>Buscando usuários...</Text>
              </View>
            )}

            <FlatList
              data={searchUsers}
              keyExtractor={(item) => item.id}
              style={styles.usersList}
              ListEmptyComponent={() => {
                if (searchingUsers) return null;
                if (userSearchText.length >= 2 && searchUsers.length === 0) {
                  return <Text style={styles.emptyText}>Nenhum usuário encontrado</Text>;
                }
                if (userSearchText.length < 2) {
                  return <Text style={styles.emptyText}>Digite pelo menos 2 caracteres para buscar</Text>;
                }
                return null;
              }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.userItem}
                  onPress={() => addMemberFromUser(item)}
                >
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.name}</Text>
                    {item.email && (
                      <Text style={styles.userEmail}>{item.email}</Text>
                    )}
                  </View>
                  <Ionicons name="add-circle" size={24} color="#B8986A" />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#B8986A" />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
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
  addMemberButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#B8986A",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    gap: 8,
  },
  addMemberButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  membersCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  membersCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  membersCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  expandText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B8986A",
  },
  membersContent: {
    padding: 16,
  },
  memberCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  memberInfo: {
    flex: 1,
  },
  memberMainInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginRight: 8,
  },
  memberRoleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  memberRoleText: {
    fontSize: 10,
    color: "#1976d2",
    fontWeight: "600",
  },
  memberContact: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  memberActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  promoteButton: {
    padding: 8,
    backgroundColor: "#e8f5e8",
    borderRadius: 6,
  },
  demoteButton: {
    padding: 8,
    backgroundColor: "#fff3cd",
    borderRadius: 6,
  },
  deleteMemberButton: {
    padding: 8,
    backgroundColor: "#ffe6e6",
    borderRadius: 6,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    paddingVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 15,
    width: "90%",
    maxHeight: "85%",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  searchingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 10,
  },
  searchingText: {
    fontSize: 14,
    color: "#666",
  },
  usersList: {
    maxHeight: 300,
    marginTop: 10,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
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
});