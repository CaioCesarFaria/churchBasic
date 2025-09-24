// DiaconatoTimes.js - CORRIGIDO - Líderes só podem ser escolhidos entre os membros do Diaconato
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
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

export default function DiaconatoTimes({ 
  members, 
  teams, 
  teamLeaders, 
  onRefresh 
}) {
  const { user, userData } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  
  // Estados para modais
  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [leaderModalVisible, setLeaderModalVisible] = useState(false);
  const [currentTeam, setCurrentTeam] = useState(null); // 'teamA' ou 'teamB'
  const [leaderType, setLeaderType] = useState(null); // 'teamA', 'teamB' ou 'general'
  
  // Estados para busca de USUÁRIOS (para adicionar como membros)
  const [searchUsers, setSearchUsers] = useState([]);
  const [userSearchText, setUserSearchText] = useState("");
  const [searchingUsers, setSearchingUsers] = useState(false);
  
  // Estados para busca de MEMBROS (para definir como líderes)
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [memberSearchText, setMemberSearchText] = useState("");

  const userName = userData?.name || user?.displayName || "Admin";

  // Buscar usuários no banco de dados (para adicionar novos membros)
  const searchUsersInDatabase = async (searchText) => {
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

  // Filtrar membros do diaconato (para definir como líderes)
  const searchMembersInMinistry = (searchText) => {
    if (!searchText.trim() || searchText.length < 2) {
      setFilteredMembers([]);
      return;
    }

    const filtered = members.filter(member =>
      member.nome.toLowerCase().includes(searchText.toLowerCase()) &&
      member.role !== "liderTimeA" && member.role !== "liderTimeB" // Não mostrar quem já é líder
    );
    
    setFilteredMembers(filtered);
  };

  // Debounce para busca de usuários
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsersInDatabase(userSearchText);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [userSearchText]);

  // Effect para filtrar membros quando o texto de busca muda
  React.useEffect(() => {
    searchMembersInMinistry(memberSearchText);
  }, [memberSearchText, members]);

  // Adicionar membro ao time
  const addMemberToTeam = async (selectedUser, team) => {
    try {
      setLoading(true);
      
      // Verificar se já é membro do ministério
      const isAlreadyInMinistry = members.find(member => member.userId === selectedUser.id);
      if (!isAlreadyInMinistry) {
        Alert.alert("Erro", "Esta pessoa precisa primeiro ser adicionada como membro do Diaconato na aba 'Membros'!");
        return;
      }
      
      // Verificar se já é membro do time
      const isAlreadyInTeam = teams[team].find(member => member.userId === selectedUser.id);
      if (isAlreadyInTeam) {
        Alert.alert("Aviso", `Esta pessoa já está no ${team === 'teamA' ? 'Time A' : 'Time B'}!`);
        return;
      }

      // Verificar se está no outro time
      const otherTeam = team === 'teamA' ? 'teamB' : 'teamA';
      const isInOtherTeam = teams[otherTeam].find(member => member.userId === selectedUser.id);
      if (isInOtherTeam) {
        Alert.alert("Aviso", `Esta pessoa já está no ${otherTeam === 'teamA' ? 'Time A' : 'Time B'}!`);
        return;
      }

      // Buscar dados completos do membro
      const memberData = members.find(m => m.userId === selectedUser.id);
      
      const teamMemberData = {
        userId: selectedUser.id,
        nome: memberData.nome,
        email: memberData.email,
        telefone: memberData.telefone || "",
        team: team,
        role: memberData.role || "membro",
        registeredBy: user.uid,
        registeredByName: userName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const memberId = `member_${selectedUser.id}`;
      const memberRef = doc(db, "churchBasico", "ministerios", "conteudo", "diaconato", "times", team, "membros", memberId);

      await setDoc(memberRef, teamMemberData);
      
      Alert.alert("Sucesso", `Membro adicionado ao ${team === 'teamA' ? 'Time A' : 'Time B'} com sucesso!`);

      setMemberModalVisible(false);
      setUserSearchText("");
      setSearchUsers([]);
      setCurrentTeam(null);
      await onRefresh();

    } catch (error) {
      console.log("Erro ao adicionar membro ao time:", error);
      Alert.alert("Erro", "Não foi possível adicionar o membro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Remover membro do time
  const removeMemberFromTeam = (member, team) => {
    Alert.alert(
      "Confirmar Remoção",
      `Tem certeza que deseja remover ${member.nome} do ${team === 'teamA' ? 'Time A' : 'Time B'}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              
              // Remover do time
              await deleteDoc(doc(db, "churchBasico", "ministerios", "conteudo", "diaconato", "times", team, "membros", member.id));
              
              // Se era líder do time, remover a liderança também
              if (member.role === "liderTimeA" || member.role === "liderTimeB") {
                const leaderType = member.role === "liderTimeA" ? "teamA" : "teamB";
                await deleteDoc(doc(db, "churchBasico", "ministerios", "conteudo", "diaconato", "lideres", leaderType));
                
                // Atualizar o membro no ministério removendo a liderança
                const memberRef = doc(db, "churchBasico", "ministerios", "conteudo", "diaconato", "membros", `member_${member.userId}`);
                await setDoc(memberRef, {
                  role: "membro",
                  userType: "member",
                  demotedAt: serverTimestamp(),
                  demotedBy: user.uid,
                  demotedByName: userName,
                  updatedAt: serverTimestamp(),
                }, { merge: true });
              }
              
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

  // Definir líder - CORRIGIDO: Agora só aceita membros do diaconato
  const setTeamLeader = async (selectedMember, type) => {
    try {
      setLoading(true);
      
      // Verificar se é membro do diaconato
      const isDiaconatoMember = members.find(member => member.userId === selectedMember.userId);
      if (!isDiaconatoMember) {
        Alert.alert("Erro", "Apenas membros do Diaconato podem ser líderes de time!");
        return;
      }

      // Verificar se já é líder de outro time
      if (selectedMember.role === "liderTimeA" || selectedMember.role === "liderTimeB") {
        Alert.alert("Aviso", "Esta pessoa já é líder de um time!");
        return;
      }

      const leaderData = {
        userId: selectedMember.userId,
        nome: selectedMember.nome,
        email: selectedMember.email,
        telefone: selectedMember.telefone || "",
        type: type,
        setBy: user.uid,
        setByName: userName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Salvar líder
      const leaderRef = doc(db, "churchBasico", "ministerios", "conteudo", "diaconato", "lideres", type);
      await setDoc(leaderRef, leaderData);
      
      // Atualizar o papel do membro no ministério
      const newRole = type === "teamA" ? "liderTimeA" : 
                    type === "teamB" ? "liderTimeB" : "liderGeral";
      
      const memberRef = doc(db, "churchBasico", "ministerios", "conteudo", "diaconato", "membros", `member_${selectedMember.userId}`);
      await setDoc(memberRef, {
        role: newRole,
        userType: type === "general" ? "admin" : "liderTime",
        promotedAt: serverTimestamp(),
        promotedBy: user.uid,
        promotedByName: userName,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Se for líder de time, adicionar automaticamente ao time (se não estiver)
      if (type === "teamA" || type === "teamB") {
        const isInTeam = teams[type].find(member => member.userId === selectedMember.userId);
        if (!isInTeam) {
          const teamMemberData = {
            userId: selectedMember.userId,
            nome: selectedMember.nome,
            email: selectedMember.email,
            telefone: selectedMember.telefone || "",
            team: type,
            role: newRole,
            registeredBy: user.uid,
            registeredByName: userName,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          const teamMemberRef = doc(db, "churchBasico", "ministerios", "conteudo", "diaconato", "times", type, "membros", `member_${selectedMember.userId}`);
          await setDoc(teamMemberRef, teamMemberData);
        }
      }
      
      const typeNames = {
        teamA: "Time A",
        teamB: "Time B",
        general: "Diaconato (Líder Geral)"
      };
      
      Alert.alert("Sucesso", `Líder do ${typeNames[type]} definido com sucesso!`);

      setLeaderModalVisible(false);
      setMemberSearchText("");
      setFilteredMembers([]);
      setLeaderType(null);
      await onRefresh();

    } catch (error) {
      console.log("Erro ao definir líder:", error);
      Alert.alert("Erro", "Não foi possível definir o líder. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Remover liderança
  const removeTeamLeader = (type) => {
    const typeNames = {
      teamA: "Time A",
      teamB: "Time B", 
      general: "Diaconato (Líder Geral)"
    };

    Alert.alert(
      "Remover Liderança",
      `Deseja remover a liderança do ${typeNames[type]}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              
              const currentLeader = teamLeaders[type];
              if (!currentLeader) return;

              // Remover documento de liderança
              await deleteDoc(doc(db, "churchBasico", "ministerios", "conteudo", "diaconato", "lideres", type));
              
              // Atualizar o membro removendo o papel de líder
              const memberRef = doc(db, "churchBasico", "ministerios", "conteudo", "diaconato", "membros", `member_${currentLeader.userId}`);
              await setDoc(memberRef, {
                role: "membro",
                userType: "member",
                demotedAt: serverTimestamp(),
                demotedBy: user.uid,
                demotedByName: userName,
                updatedAt: serverTimestamp(),
              }, { merge: true });

              Alert.alert("Sucesso", `Liderança do ${typeNames[type]} removida!`);
              await onRefresh();
            } catch (error) {
              console.log("Erro ao remover liderança:", error);
              Alert.alert("Erro", "Não foi possível remover a liderança.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Abrir modal para adicionar membro ao time
  const openAddMemberModal = (team) => {
    setCurrentTeam(team);
    setUserSearchText("");
    setSearchUsers([]);
    setMemberModalVisible(true);
  };

  // Abrir modal para definir líder
  const openSetLeaderModal = (type) => {
    setLeaderType(type);
    setMemberSearchText("");
    setFilteredMembers([]);
    setLeaderModalVisible(true);
  };

  // Renderizar card de time
  const renderTeamCard = (team, teamKey) => {
    const teamName = teamKey === 'teamA' ? 'Time A' : 'Time B';
    const leader = teamLeaders[teamKey];
    
    return (
      <View key={teamKey} style={styles.teamCard}>
        <View style={styles.teamHeader}>
          <View style={styles.teamTitleContainer}>
            <Text style={styles.teamTitle}>{teamName}</Text>
            <Text style={styles.teamMemberCount}>{team.length} membros</Text>
          </View>
          
          <View style={styles.teamActions}>
            <TouchableOpacity
              style={styles.setLeaderButton}
              onPress={() => openSetLeaderModal(teamKey)}
            >
              <Ionicons name="star" size={16} color="#B8986A" />
              <Text style={styles.setLeaderButtonText}>
                {leader ? "Alterar Líder" : "Definir Líder"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.addMemberButton}
              onPress={() => openAddMemberModal(teamKey)}
            >
              <Ionicons name="person-add" size={16} color="#B8986A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Líder do Time */}
        {leader && (
          <View style={styles.leaderContainer}>
            <View style={styles.leaderInfo}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.leaderName}>{leader.nome}</Text>
              <TouchableOpacity
                style={styles.removeLeaderButton}
                onPress={() => removeTeamLeader(teamKey)}
              >
                <Ionicons name="close-circle" size={16} color="#ff4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Lista de Membros */}
        <View style={styles.membersList}>
          {team.length > 0 ? (
            <FlatList
              data={team}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.memberItem}>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{item.nome}</Text>
                    {item.telefone && (
                      <Text style={styles.memberContact}>📞 {item.telefone}</Text>
                    )}
                    {(item.role === "liderTimeA" || item.role === "liderTimeB") && (
                      <View style={styles.leaderBadge}>
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Text style={styles.leaderBadgeText}>Líder</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.removeMemberButton}
                    onPress={() => removeMemberFromTeam(item, teamKey)}
                  >
                    <Ionicons name="trash" size={16} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              )}
            />
          ) : (
            <Text style={styles.emptyTeamText}>Nenhum membro no {teamName} ainda</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header com stats gerais */}
      <View style={styles.header}>
        <Text style={styles.title}>Organização dos Times</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color="#B8986A" />
            <Text style={styles.statNumber}>{teams.teamA.length + teams.teamB.length}</Text>
            <Text style={styles.statLabel}>Total em Times</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="star" size={24} color="#FFD700" />
            <Text style={styles.statNumber}>
              {Object.values(teamLeaders).filter(leader => leader !== null).length}
            </Text>
            <Text style={styles.statLabel}>Líderes Definidos</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="person" size={24} color="#4CAF50" />
            <Text style={styles.statNumber}>{members.length}</Text>
            <Text style={styles.statLabel}>Total de Membros</Text>
          </View>
        </View>

        {/* Líder Geral do Diaconato */}
        <View style={styles.generalLeaderContainer}>
          <View style={styles.generalLeaderHeader}>
            <Text style={styles.generalLeaderTitle}>Líder Geral do Diaconato</Text>
            <View style={styles.generalLeaderActions}>
              <TouchableOpacity
                style={styles.setGeneralLeaderButton}
                onPress={() => openSetLeaderModal('general')}
              >
                <Ionicons name="crown" size={16} color="#B8986A" />
                <Text style={styles.setLeaderButtonText}>
                  {teamLeaders.general ? "Alterar" : "Definir"}
                </Text>
              </TouchableOpacity>
              
              {teamLeaders.general && (
                <TouchableOpacity
                  style={styles.removeGeneralLeaderButton}
                  onPress={() => removeTeamLeader('general')}
                >
                  <Ionicons name="close-circle" size={16} color="#ff4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {teamLeaders.general ? (
            <View style={styles.generalLeaderInfo}>
              <Ionicons name="crown" size={20} color="#FFD700" />
              <Text style={styles.generalLeaderName}>{teamLeaders.general.nome}</Text>
            </View>
          ) : (
            <Text style={styles.noGeneralLeaderText}>Nenhum líder geral definido</Text>
          )}
        </View>
      </View>

      {/* Times A e B */}
      <View style={styles.teamsContainer}>
        {renderTeamCard(teams.teamA, 'teamA')}
        {renderTeamCard(teams.teamB, 'teamB')}
      </View>

      {/* Modal para Adicionar Membro ao Time */}
      <Modal
        visible={memberModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setMemberModalVisible(false);
          setUserSearchText("");
          setSearchUsers([]);
          setCurrentTeam(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Adicionar ao {currentTeam === 'teamA' ? 'Time A' : 'Time B'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setMemberModalVisible(false);
                  setUserSearchText("");
                  setSearchUsers([]);
                  setCurrentTeam(null);
                }}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={20} color="#B8986A" />
              <Text style={styles.infoText}>
                Apenas membros já cadastrados no Diaconato podem ser adicionados aos times.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Buscar entre os membros do Diaconato:</Text>
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
                <Text style={styles.searchingText}>Buscando membros...</Text>
              </View>
            )}

            <FlatList
              data={searchUsers}
              keyExtractor={(item) => item.id}
              style={styles.usersList}
              ListEmptyComponent={() => {
                if (searchingUsers) return null;
                if (userSearchText.length >= 2 && searchUsers.length === 0) {
                  return <Text style={styles.emptyText}>Nenhum membro encontrado</Text>;
                }
                if (userSearchText.length < 2) {
                  return <Text style={styles.emptyText}>Digite pelo menos 2 caracteres para buscar</Text>;
                }
                return null;
              }}
              renderItem={({ item }) => {
                const isMember = members.find(m => m.userId === item.id);
                const isInTeamA = teams.teamA.find(m => m.userId === item.id);
                const isInTeamB = teams.teamB.find(m => m.userId === item.id);
                
                return (
                  <TouchableOpacity
                    style={[
                      styles.userItem,
                      !isMember && styles.userItemDisabled
                    ]}
                    onPress={() => isMember ? addMemberToTeam(item, currentTeam) : null}
                    disabled={!isMember}
                  >
                    <View style={styles.userInfo}>
                      <Text style={[
                        styles.userName,
                        !isMember && styles.userNameDisabled
                      ]}>
                        {item.name}
                      </Text>
                      {item.email && (
                        <Text style={styles.userEmail}>{item.email}</Text>
                      )}
                      
                      {!isMember && (
                        <Text style={styles.notMemberText}>Não é membro do Diaconato</Text>
                      )}
                      
                      {isInTeamA && (
                        <Text style={styles.alreadyInTeamText}>Já está no Time A</Text>
                      )}
                      
                      {isInTeamB && (
                        <Text style={styles.alreadyInTeamText}>Já está no Time B</Text>
                      )}
                    </View>
                    
                    <Ionicons 
                      name={isMember ? "add-circle" : "ban"} 
                      size={24} 
                      color={isMember ? "#B8986A" : "#ccc"} 
                    />
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Modal para Definir Líder */}
      <Modal
        visible={leaderModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setLeaderModalVisible(false);
          setMemberSearchText("");
          setFilteredMembers([]);
          setLeaderType(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Definir Líder {leaderType === 'general' ? 'Geral' : 
                  leaderType === 'teamA' ? 'do Time A' : 'do Time B'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setLeaderModalVisible(false);
                  setMemberSearchText("");
                  setFilteredMembers([]);
                  setLeaderType(null);
                }}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <Ionicons name="star" size={20} color="#FFD700" />
              <Text style={styles.infoText}>
                Apenas membros do Diaconato podem ser líderes. Busque entre os membros cadastrados.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Buscar membro do Diaconato:</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite o nome do membro..."
                value={memberSearchText}
                onChangeText={setMemberSearchText}
                autoFocus
              />
            </View>

            <FlatList
              data={filteredMembers}
              keyExtractor={(item) => item.id}
              style={styles.usersList}
              ListEmptyComponent={() => {
                if (memberSearchText.length >= 2 && filteredMembers.length === 0) {
                  return <Text style={styles.emptyText}>Nenhum membro encontrado</Text>;
                }
                if (memberSearchText.length < 2) {
                  return <Text style={styles.emptyText}>Digite pelo menos 2 caracteres para buscar entre os membros do Diaconato</Text>;
                }
                return null;
              }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.userItem}
                  onPress={() => setTeamLeader(item, leaderType)}
                >
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.nome}</Text>
                    {item.email && (
                      <Text style={styles.userEmail}>{item.email}</Text>
                    )}
                    <Text style={styles.memberRoleText}>
                      Membro do Diaconato - {item.role === "membro" ? "Pode ser líder" : item.role}
                    </Text>
                  </View>
                  <Ionicons name="star" size={24} color="#B8986A" />
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
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
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
  generalLeaderContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    borderLeftWidth: 4,
    borderLeftColor: "#B8986A",
  },
  generalLeaderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  generalLeaderTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  generalLeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  setGeneralLeaderButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 5,
  },
  removeGeneralLeaderButton: {
    padding: 8,
    backgroundColor: "#ffe6e6",
    borderRadius: 6,
  },
  generalLeaderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  generalLeaderName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  noGeneralLeaderText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
  teamsContainer: {
    padding: 20,
    gap: 20,
  },
  teamCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  teamHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  teamTitleContainer: {
    flex: 1,
  },
  teamTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  teamMemberCount: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  teamActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  setLeaderButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  setLeaderButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B8986A",
  },
  addMemberButton: {
    padding: 8,
    backgroundColor: "#f8f9fa",
    borderRadius: 6,
  },
  leaderContainer: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  leaderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  leaderName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  removeLeaderButton: {
    padding: 4,
  },
  leaderBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff9c4",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
    marginTop: 4,
  },
  leaderBadgeText: {
    fontSize: 10,
    color: "#b8860b",
    fontWeight: "600",
  },
  membersList: {
    maxHeight: 300,
  },
  memberItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 8,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  memberContact: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  removeMemberButton: {
    padding: 8,
    backgroundColor: "#ffe6e6",
    borderRadius: 6,
  },
  emptyTeamText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    fontStyle: "italic",
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
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f8f4e6",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#B8986A",
    lineHeight: 18,
    flex: 1,
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
  userItemDisabled: {
    backgroundColor: "#f5f5f5",
    opacity: 0.6,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  userNameDisabled: {
    color: "#999",
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  memberRoleText: {
    fontSize: 12,
    color: "#B8986A",
    marginTop: 2,
    fontStyle: "italic",
  },
  notMemberText: {
    fontSize: 12,
    color: "#ff6b6b",
    marginTop: 2,
    fontWeight: "600",
  },
  alreadyInTeamText: {
    fontSize: 12,
    color: "#ffa500",
    marginTop: 2,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    paddingVertical: 20,
    lineHeight: 20,
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