// MinisterioComunicacaoAdmin.js
// MinisterioComunicacaoAdmin.js
import React, { useState, useEffect, useContext } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../context/AuthContext";
import { db } from "../../Firebase/FirebaseConfig";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

export default function MinisterioComunicacaoAdmin({ navigation }) {
  const { user, userData } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("members");
  
  // Estados dos Membros
  const [members, setMembers] = useState([]);
  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberForm, setMemberForm] = useState({
    nome: "",
    funcao: "",
    telefone: "",
    email: "",
    disponibilidade: "",
    especialidade: ""
  });

  // Estados dos Eventos
  const [events, setEvents] = useState([]);
  const [scaleModalVisible, setScaleModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [scaleForm, setScaleForm] = useState({
    responsavelSom: "",
    responsavelIluminacao: "",
    operadorSlides: "",
    cinegrafista: "",
    fotografo: "",
    streamingOperator: "",
    observations: ""
  });

  const userName = userData?.name || user?.displayName || "Líder";

  // Carregar dados ao iniciar
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadMembers(),
        loadEvents()
      ]);
    } catch (error) {
      console.log("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar membros do ministério
  const loadMembers = async () => {
    try {
      const membersRef = collection(db, "churchBasico", "ministerios", "conteudo", "comunicacao", "membros");
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

  // Funções dos Membros
  const resetMemberForm = () => {
    setMemberForm({
      nome: "",
      funcao: "",
      telefone: "",
      email: "",
      disponibilidade: "",
      especialidade: ""
    });
    setEditingMember(null);
  };

  const openAddMemberModal = () => {
    resetMemberForm();
    setMemberModalVisible(true);
  };

  const openEditMemberModal = (member) => {
    setMemberForm({
      nome: member.nome || "",
      funcao: member.funcao || "",
      telefone: member.telefone || "",
      email: member.email || "",
      disponibilidade: member.disponibilidade || "",
      especialidade: member.especialidade || ""
    });
    setEditingMember(member);
    setMemberModalVisible(true);
  };

  const saveMember = async () => {
    if (!memberForm.nome.trim() || !memberForm.funcao.trim()) {
      Alert.alert("Erro", "Por favor, preencha pelo menos o nome e a função");
      return;
    }

    try {
      setLoading(true);
      
      const memberData = {
        nome: memberForm.nome.trim(),
        funcao: memberForm.funcao.trim(),
        telefone: memberForm.telefone.trim(),
        email: memberForm.email.trim(),
        disponibilidade: memberForm.disponibilidade.trim(),
        especialidade: memberForm.especialidade.trim(),
        registeredBy: user.uid,
        registeredByName: userName,
        createdAt: editingMember ? editingMember.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const memberId = editingMember ? editingMember.id : `member_${Date.now()}`;
      const memberRef = doc(db, "churchBasico", "ministerios", "conteudo", "comunicacao", "membros", memberId);

      if (editingMember) {
        await updateDoc(memberRef, memberData);
        Alert.alert("Sucesso", "Dados do membro atualizados com sucesso!");
      } else {
        await setDoc(memberRef, memberData);
        Alert.alert("Sucesso", "Membro cadastrado com sucesso!");
      }

      setMemberModalVisible(false);
      resetMemberForm();
      await loadMembers();

    } catch (error) {
      console.log("Erro ao salvar membro:", error);
      Alert.alert("Erro", `Não foi possível salvar os dados: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteMember = (member) => {
    Alert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja remover ${member.nome}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await deleteDoc(doc(db, "churchBasico", "ministerios", "conteudo", "comunicacao", "membros", member.id));
              Alert.alert("Sucesso", "Membro removido com sucesso!");
              await loadMembers();
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

  // Funções da Escala
  const openScaleModal = (event) => {
    setSelectedEvent(event);
    setScaleModalVisible(true);
  };

  const resetScaleForm = () => {
    setScaleForm({
      responsavelSom: "",
      responsavelIluminacao: "",
      operadorSlides: "",
      cinegrafista: "",
      fotografo: "",
      streamingOperator: "",
      observations: ""
    });
    setSelectedEvent(null);
  };

  const saveScale = async () => {
    if (!scaleForm.responsavelSom.trim() && !scaleForm.responsavelIluminacao.trim()) {
      Alert.alert("Erro", "Por favor, preencha pelo menos um responsável");
      return;
    }

    try {
      setLoading(true);
      
      const scaleData = {
        eventId: selectedEvent.id,
        eventName: selectedEvent.nome,
        ministry: "comunicacao",
        responsavelSom: scaleForm.responsavelSom.trim(),
        responsavelIluminacao: scaleForm.responsavelIluminacao.trim(),
        operadorSlides: scaleForm.operadorSlides.trim(),
        cinegrafista: scaleForm.cinegrafista.trim(),
        fotografo: scaleForm.fotografo.trim(),
        streamingOperator: scaleForm.streamingOperator.trim(),
        observations: scaleForm.observations.trim(),
        createdBy: user.uid,
        createdByName: userName,
        createdAt: serverTimestamp(),
        isActive: true
      };

      const scaleId = `comunicacao_${selectedEvent.id}_${Date.now()}`;
      await setDoc(doc(db, "churchBasico", "sistema", "escalas", scaleId), scaleData);
      
      Alert.alert("Sucesso", "Escala da Comunicação criada com sucesso!");
      setScaleModalVisible(false);
      resetScaleForm();
    } catch (error) {
      console.log("Erro ao salvar escala:", error);
      Alert.alert("Erro", "Não foi possível salvar a escala");
    } finally {
      setLoading(false);
    }
  };

  const getMembersStats = () => {
    const funcoes = {};
    members.forEach(member => {
      if (member.funcao) {
        funcoes[member.funcao] = (funcoes[member.funcao] || 0) + 1;
      }
    });
    return { total: members.length, funcoes };
  };

  const renderMembers = () => {
    const stats = getMembersStats();
    
    return (
      <View style={styles.tabContent}>
        <Text style={styles.tabTitle}>Membros do Ministério</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color="#B8986A" />
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total de Membros</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="mic" size={24} color="#4A90E2" />
            <Text style={styles.statNumber}>{stats.funcoes["Som"] || 0}</Text>
            <Text style={styles.statLabel}>Equipe de Som</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="bulb" size={24} color="#FFD700" />
            <Text style={styles.statNumber}>{stats.funcoes["Iluminação"] || 0}</Text>
            <Text style={styles.statLabel}>Equipe de Iluminação</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="videocam" size={24} color="#E24A90" />
            <Text style={styles.statNumber}>{stats.funcoes["Audiovisual"] || 0}</Text>
            <Text style={styles.statLabel}>Audiovisual</Text>
          </View>
        </View>

        {/* Botão Cadastrar Membro */}
        <TouchableOpacity style={styles.addMemberButton} onPress={openAddMemberModal}>
          <Ionicons name="person-add" size={20} color="#fff" />
          <Text style={styles.addMemberButtonText}>Cadastrar Membro</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Lista de Membros</Text>
        
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>Nenhum membro cadastrado ainda</Text>
          )}
          renderItem={({ item }) => (
            <View style={styles.memberItem}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.nome}</Text>
                <Text style={styles.memberFunction}>{item.funcao}</Text>
                {item.telefone && (
                  <Text style={styles.memberContact}>📞 {item.telefone}</Text>
                )}
                {item.email && (
                  <Text style={styles.memberContact}>📧 {item.email}</Text>
                )}
                {item.especialidade && (
                  <Text style={styles.memberSpecialty}>Especialidade: {item.especialidade}</Text>
                )}
              </View>
              <View style={styles.memberActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openEditMemberModal(item)}
                >
                  <Ionicons name="pencil" size={16} color="#B8986A" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => deleteMember(item)}
                >
                  <Ionicons name="trash" size={16} color="#ff4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

  const renderEvents = () => (
    <FlatList
      style={styles.tabContent}
      data={events}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={() => (
        <View style={styles.eventsHeader}>
          <Text style={styles.tabTitle}>Eventos Cadastrados</Text>
        </View>
      )}
      ListEmptyComponent={() => (
        <Text style={styles.emptyText}>Nenhum evento cadastrado ainda</Text>
      )}
      renderItem={({ item }) => (
        <View style={styles.eventItem}>
          <View style={styles.eventContent}>
            <Text style={styles.eventTitle}>{item.nome}</Text>
            <View style={styles.eventDetails}>
              <Text style={styles.eventDetail}>📅 {item.data}</Text>
              <Text style={styles.eventDetail}>⏰ {item.horario}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.scaleButton}
            onPress={() => openScaleModal(item)}
          >
            <Ionicons name="people" size={16} color="#fff" />
            <Text style={styles.scaleButtonText}>Criar Escala</Text>
          </TouchableOpacity>
        </View>
      )}
      showsVerticalScrollIndicator={false}
    />
  );

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
        <Text style={styles.headerTitle}>Comunicação - Admin</Text>
        <Text style={styles.leaderName}>{userName}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "members" && styles.activeTab]}
          onPress={() => setActiveTab("members")}
        >
          <Ionicons 
            name="people" 
            size={20} 
            color={activeTab === "members" ? "#B8986A" : "#666"} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === "members" && styles.activeTabText
          ]}>
            Membros
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "events" && styles.activeTab]}
          onPress={() => setActiveTab("events")}
        >
          <Ionicons 
            name="calendar" 
            size={20} 
            color={activeTab === "events" ? "#B8986A" : "#666"} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === "events" && styles.activeTabText
          ]}>
            Eventos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#B8986A" />
          </View>
        )}

        {activeTab === "members" && renderMembers()}
        {activeTab === "events" && renderEvents()}
      </View>

      {/* Modal de Cadastro/Edição de Membro */}
      <Modal
        visible={memberModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setMemberModalVisible(false);
          resetMemberForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingMember ? "Editar Membro" : "Cadastrar Membro"}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setMemberModalVisible(false);
                    resetMemberForm();
                  }}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Nome */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome: *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite o nome completo"
                  value={memberForm.nome}
                  onChangeText={(text) => setMemberForm({ ...memberForm, nome: text })}
                />
              </View>

              {/* Função */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Função: *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Som, Iluminação, Audiovisual, etc."
                  value={memberForm.funcao}
                  onChangeText={(text) => setMemberForm({ ...memberForm, funcao: text })}
                />
              </View>

              {/* Telefone */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Telefone:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="(11) 99999-9999"
                  value={memberForm.telefone}
                  onChangeText={(text) => setMemberForm({ ...memberForm, telefone: text })}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="email@exemplo.com"
                  value={memberForm.email}
                  onChangeText={(text) => setMemberForm({ ...memberForm, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Disponibilidade */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Disponibilidade:</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Ex: Domingos manhã, quartas à noite"
                  value={memberForm.disponibilidade}
                  onChangeText={(text) => setMemberForm({ ...memberForm, disponibilidade: text })}
                  multiline
                  numberOfLines={2}
                />
              </View>

              {/* Especialidade */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Especialidade/Observações:</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Ex: Mesa de som digital, Live streaming, etc."
                  value={memberForm.especialidade}
                  onChangeText={(text) => setMemberForm({ ...memberForm, especialidade: text })}
                  multiline
                  numberOfLines={2}
                />
              </View>

              {/* Botões */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setMemberModalVisible(false);
                    resetMemberForm();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={saveMember}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {editingMember ? "Atualizar" : "Salvar"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Criar Escala */}
      <Modal
        visible={scaleModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setScaleModalVisible(false);
          resetScaleForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Criar Escala - Comunicação</Text>
              <TouchableOpacity
                onPress={() => {
                  setScaleModalVisible(false);
                  resetScaleForm();
                }}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedEvent && (
                <View style={styles.eventInfo}>
                  <Text style={styles.eventInfoTitle}>Evento: {selectedEvent.nome}</Text>
                  <Text style={styles.eventInfoDetail}>Data: {selectedEvent.data}</Text>
                  <Text style={styles.eventInfoDetail}>Horário: {selectedEvent.horario}</Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Responsável pelo Som:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nome do responsável pelo som"
                  value={scaleForm.responsavelSom}
                  onChangeText={(text) => setScaleForm({ ...scaleForm, responsavelSom: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Responsável pela Iluminação:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nome do responsável pela iluminação"
                  value={scaleForm.responsavelIluminacao}
                  onChangeText={(text) => setScaleForm({ ...scaleForm, responsavelIluminacao: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Operador de Slides:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nome do operador de slides"
                  value={scaleForm.operadorSlides}
                  onChangeText={(text) => setScaleForm({ ...scaleForm, operadorSlides: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cinegrafista:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nome do cinegrafista"
                  value={scaleForm.cinegrafista}
                  onChangeText={(text) => setScaleForm({ ...scaleForm, cinegrafista: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Fotógrafo:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nome do fotógrafo"
                  value={scaleForm.fotografo}
                  onChangeText={(text) => setScaleForm({ ...scaleForm, fotografo: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Operador de Streaming:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nome do operador de streaming"
                  value={scaleForm.streamingOperator}
                  onChangeText={(text) => setScaleForm({ ...scaleForm, streamingOperator: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Observações:</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Observações especiais para este evento"
                  value={scaleForm.observations}
                  onChangeText={(text) => setScaleForm({ ...scaleForm, observations: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setScaleModalVisible(false);
                    resetScaleForm();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={saveScale}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Salvar Escala</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  tabTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
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
    marginBottom: 15,
    gap: 8,
  },
  addMemberButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  memberItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  memberFunction: {
    fontSize: 14,
    color: "#B8986A",
    marginTop: 2,
    fontWeight: "500",
  },
  memberContact: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  memberSpecialty: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
    fontStyle: "italic",
  },
  memberActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#f8f8f8",
  },
  deleteButton: {
    backgroundColor: "#ffe6e6",
  },
  eventsHeader: {
    marginBottom: 20,
  },
  eventItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    alignItems: "center",
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  eventDetails: {
    gap: 5,
  },
  eventDetail: {
    fontSize: 14,
    color: "#666",
  },
  scaleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#B8986A",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 5,
  },
  scaleButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    paddingVertical: 20,
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
  eventInfo: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#B8986A",
  },
  eventInfoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  eventInfoDetail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
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
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  saveButton: {
    backgroundColor: "#B8986A",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
