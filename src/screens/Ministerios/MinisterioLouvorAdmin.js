// MinisterioLouvorAdmin.js - VERSÃO COMPLETA COM ABAS
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

export default function MinisterioLouvorAdmin({ navigation }) {
  const { user, userData } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("members");
  
  // Estados dos Membros
  const [members, setMembers] = useState([]);
  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [searchUsers, setSearchUsers] = useState([]);
  const [userSearchText, setUserSearchText] = useState("");
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Estados das Bandas
  const [bandas, setBandas] = useState([]);
  const [bandaModalVisible, setBandaModalVisible] = useState(false);
  const [editingBanda, setEditingBanda] = useState(null);
  const [bandaForm, setBandaForm] = useState({
    nome: "",
    responsavel: null
  });
  const [responsavelSearch, setResponsavelSearch] = useState("");
  const [responsavelResults, setResponsavelResults] = useState([]);

  // Estados dos Eventos
  const [events, setEvents] = useState([]);

  // Estados das Escalas
  const [scales, setScales] = useState([]);
  const [scaleModalVisible, setScaleModalVisible] = useState(false);
  const [eventSelectionModalVisible, setEventSelectionModalVisible] = useState(false);
  const [bandaSelectionModalVisible, setBandaSelectionModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedBanda, setSelectedBanda] = useState(null);
  const [editingScale, setEditingScale] = useState(null);
  const [scaleForm, setScaleForm] = useState({
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
        loadBandas(),
        loadEvents(),
      ]);
      await loadScales();
    } catch (error) {
      console.log("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar membros do ministério
  const loadMembers = async () => {
    try {
      const membersRef = collection(db, "churchBasico", "ministerios", "conteudo", "louvor", "membros");
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

  // Carregar bandas do ministério
  const loadBandas = async () => {
    try {
      const bandasRef = collection(db, "churchBasico", "ministerios", "conteudo", "louvor", "bandas");
      const q = query(bandasRef, orderBy("nome"));
      const querySnapshot = await getDocs(q);
      
      const bandasData = [];
      querySnapshot.forEach((doc) => {
        bandasData.push({ id: doc.id, ...doc.data() });
      });
      
      setBandas(bandasData);
    } catch (error) {
      console.log("Erro ao carregar bandas:", error);
    }
  };

  // Carregar eventos
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

  // Carregar escalas existentes
  const loadScales = async () => {
    try {
      const scalesData = [];
      for (const event of events) {
        try {
          const scaleDoc = await getDocs(collection(db, "churchBasico", "sistema", "eventos", event.id, "escalas"));
          
          scaleDoc.forEach((doc) => {
            if (doc.data().ministerio === "louvor") {
              scalesData.push({
                id: doc.id,
                eventId: event.id,
                eventName: event.nome,
                eventDate: event.data,
                eventTime: event.horario,
                ...doc.data()
              });
            }
          });
        } catch (error) {
          console.log(`Erro ao carregar escala do evento ${event.id}:`, error);
        }
      }
      
      setScales(scalesData);
    } catch (error) {
      console.log("Erro ao carregar escalas:", error);
    }
  };

  // Buscar usuários no banco de dados
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

  // Buscar responsável para banda
  const searchResponsavel = (searchText) => {
    setResponsavelSearch(searchText);
    
    if (!searchText.trim() || searchText.length < 2) {
      setResponsavelResults([]);
      return;
    }

    const filteredMembers = members.filter(member =>
      member.nome.toLowerCase().includes(searchText.toLowerCase())
    );

    setResponsavelResults(filteredMembers);
  };

  // Debounce para busca de usuários
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsersInDatabase(userSearchText);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [userSearchText]);

  // Funções dos Membros
  const openAddMemberModal = () => {
    setUserSearchText("");
    setSearchUsers([]);
    setMemberModalVisible(true);
  };

  const addMemberFromUser = async (selectedUser) => {
    try {
      setLoading(true);
      
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
        registeredBy: user.uid,
        registeredByName: userName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const memberId = `member_${selectedUser.id}`;
      const memberRef = doc(db, "churchBasico", "ministerios", "conteudo", "louvor", "membros", memberId);

      await setDoc(memberRef, memberData);
      Alert.alert("Sucesso", "Membro adicionado com sucesso!");

      setMemberModalVisible(false);
      setUserSearchText("");
      setSearchUsers([]);
      await loadMembers();

    } catch (error) {
      console.log("Erro ao adicionar membro:", error);
      Alert.alert("Erro", `Não foi possível adicionar o membro: ${error.message}`);
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
              await deleteDoc(doc(db, "churchBasico", "ministerios", "conteudo", "louvor", "membros", member.id));
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

  // Funções das Bandas
  const openAddBandaModal = () => {
    setBandaForm({ nome: "", responsavel: null });
    setResponsavelSearch("");
    setResponsavelResults([]);
    setEditingBanda(null);
    setBandaModalVisible(true);
  };

  const openEditBandaModal = (banda) => {
    setBandaForm({
      nome: banda.nome,
      responsavel: banda.responsavel
    });
    setResponsavelSearch("");
    setResponsavelResults([]);
    setEditingBanda(banda);
    setBandaModalVisible(true);
  };

  const selectResponsavel = (member) => {
    setBandaForm(prev => ({ ...prev, responsavel: member }));
    setResponsavelSearch("");
    setResponsavelResults([]);
  };

  const saveBanda = async () => {
    if (!bandaForm.nome.trim()) {
      Alert.alert("Erro", "Por favor, preencha o nome da banda");
      return;
    }

    if (!bandaForm.responsavel) {
      Alert.alert("Erro", "Por favor, selecione um responsável");
      return;
    }

    try {
      setLoading(true);

      const bandaData = {
        nome: bandaForm.nome.trim(),
        responsavel: {
          id: bandaForm.responsavel.id,
          nome: bandaForm.responsavel.nome,
          userId: bandaForm.responsavel.userId
        },
        createdBy: user.uid,
        createdByName: userName,
        createdAt: editingBanda ? editingBanda.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (editingBanda) {
        // Editando banda existente
        const bandaRef = doc(db, "churchBasico", "ministerios", "conteudo", "louvor", "bandas", editingBanda.id);
        await setDoc(bandaRef, bandaData);
        Alert.alert("Sucesso", "Banda atualizada com sucesso!");
      } else {
        // Criando nova banda - precisa gerar um ID
        const bandaId = `banda_${Date.now()}`;
        const bandaRef = doc(db, "churchBasico", "ministerios", "conteudo", "louvor", "bandas", bandaId);
        await setDoc(bandaRef, bandaData);
        Alert.alert("Sucesso", "Banda criada com sucesso!");
      }

      setBandaModalVisible(false);
      await loadBandas();

    } catch (error) {
      console.log("Erro ao salvar banda:", error);
      Alert.alert("Erro", `Não foi possível salvar a banda: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteBanda = (banda) => {
    Alert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja excluir a banda "${banda.nome}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await deleteDoc(doc(db, "churchBasico", "ministerios", "conteudo", "louvor", "bandas", banda.id));
              Alert.alert("Sucesso", "Banda excluída com sucesso!");
              await loadBandas();
            } catch (error) {
              console.log("Erro ao excluir banda:", error);
              Alert.alert("Erro", "Não foi possível excluir. Tente novamente.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Funções das Escalas
  const resetScaleForm = () => {
    setScaleForm({ observations: "" });
    setEditingScale(null);
  };

  const resetCompletely = () => {
    resetScaleForm();
    setSelectedEvent(null);
    setSelectedBanda(null);
  };

  const openCreateScaleModal = () => {
    setEventSelectionModalVisible(true);
  };

  const selectEventForScale = (event) => {
    setSelectedEvent(event);
    setEventSelectionModalVisible(false);
    setBandaSelectionModalVisible(true);
  };

  const selectBandaForScale = (banda) => {
    setSelectedBanda(banda);
    setBandaSelectionModalVisible(false);
    resetScaleForm();
    setScaleModalVisible(true);
  };

  const openEditScaleModal = (scale) => {
    setEditingScale(scale);
    setSelectedEvent({
      id: scale.eventId,
      nome: scale.eventName,
      data: scale.eventDate,
      horario: scale.eventTime
    });
    setSelectedBanda(scale.banda);
    setScaleForm({
      observations: scale.observations || ""
    });
    setScaleModalVisible(true);
  };

  const saveScale = async () => {
    if (!selectedEvent || !selectedEvent.id) {
      Alert.alert("Erro", "Evento não selecionado. Feche o modal e tente novamente.");
      return;
    }

    if (!selectedBanda) {
      Alert.alert("Erro", "Banda não selecionada. Feche o modal e tente novamente.");
      return;
    }

    try {
      setLoading(true);

      // Gerar ID único para a escala (permitir múltiplas bandas por evento)
      const scaleId = editingScale ? editingScale.id : `louvor_${selectedBanda.id}_${Date.now()}`;

      const scaleData = {
        ministerio: "louvor",
        eventId: selectedEvent.id,
        eventName: selectedEvent.nome,
        eventDate: selectedEvent.data,
        eventTime: selectedEvent.horario,
        banda: {
          id: selectedBanda.id,
          nome: selectedBanda.nome,
          responsavel: selectedBanda.responsavel
        },
        observations: scaleForm.observations.trim(),
        createdBy: user.uid,
        createdByName: userName,
        createdAt: editingScale ? editingScale.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true
      };

      const scaleRef = doc(db, "churchBasico", "sistema", "eventos", selectedEvent.id, "escalas", scaleId);
      await setDoc(scaleRef, scaleData);

      // Atualizar contador de escalas do evento
      const eventRef = doc(db, "churchBasico", "sistema", "eventos", selectedEvent.id);
      const currentEvent = events.find(e => e.id === selectedEvent.id);
      const isNewScale = !editingScale;

      await updateDoc(eventRef, {
        escalaLouvor: "OK",
        totalEscalas: isNewScale ? (currentEvent?.totalEscalas || 0) + 1 : currentEvent?.totalEscalas || 1,
        updatedAt: serverTimestamp()
      });

      Alert.alert("Sucesso", editingScale ? "Escala atualizada com sucesso!" : "Escala do Louvor criada com sucesso!");
      setScaleModalVisible(false);
      resetCompletely();

      await loadEvents();
      await loadScales();

    } catch (error) {
      console.error("Erro ao salvar escala:", error);
      Alert.alert("Erro", `Não foi possível salvar a escala: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteScale = (scale) => {
    Alert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja excluir a escala da banda "${scale.banda.nome}" no evento "${scale.eventName}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);

              const scaleRef = doc(db, "churchBasico", "sistema", "eventos", scale.eventId, "escalas", scale.id);
              await deleteDoc(scaleRef);

              // Decrementar contador de escalas do evento
              const eventRef = doc(db, "churchBasico", "sistema", "eventos", scale.eventId);
              const currentEvent = events.find(e => e.id === scale.eventId);
              const newTotalEscalas = Math.max(0, (currentEvent?.totalEscalas || 1) - 1);

              await updateDoc(eventRef, {
                escalaLouvor: newTotalEscalas > 0 ? "OK" : null,
                totalEscalas: newTotalEscalas,
                updatedAt: serverTimestamp()
              });

              Alert.alert("Sucesso", "Escala excluída com sucesso!");
              await loadEvents();
              await loadScales();
            } catch (error) {
              console.log("Erro ao excluir escala:", error);
              Alert.alert("Erro", "Não foi possível excluir. Tente novamente.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getMembersStats = () => {
    return { total: members.length };
  };

  const getBandasStats = () => {
    return { total: bandas.length };
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
        </View>

        <TouchableOpacity style={styles.addMemberButton} onPress={openAddMemberModal}>
          <Ionicons name="person-add" size={20} color="#fff" />
          <Text style={styles.addMemberButtonText}>Adicionar Membro</Text>
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
                {item.telefone && (
                  <Text style={styles.memberContact}>📞 {item.telefone}</Text>
                )}
                {item.email && (
                  <Text style={styles.memberContact}>📧 {item.email}</Text>
                )}
              </View>
              <View style={styles.memberActions}>
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

  const renderBandas = () => {
    const stats = getBandasStats();

    return (
      <View style={styles.tabContent}>
        <Text style={styles.tabTitle}>Bandas do Ministério</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="musical-notes" size={24} color="#B8986A" />
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total de Bandas</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.addMemberButton} onPress={openAddBandaModal}>
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.addMemberButtonText}>Adicionar Banda</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Lista de Bandas</Text>

        <FlatList
          data={bandas}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>Nenhuma banda cadastrada ainda</Text>
          )}
          renderItem={({ item }) => (
            <View style={styles.memberItem}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.nome}</Text>
                <Text style={styles.memberContact}>
                  👤 Responsável: {item.responsavel?.nome}
                </Text>
              </View>
              <View style={styles.memberActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => openEditBandaModal(item)}
                >
                  <Ionicons name="pencil" size={16} color="#B8986A" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => deleteBanda(item)}
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
              {item.escalaLouvor === "OK" && (
                <View style={styles.scaleStatus}>
                  <Ionicons name="checkmark-circle" size={16} color="#50C878" />
                  <Text style={styles.scaleStatusText}>Escala Louvor OK</Text>
                </View>
              )}
              {item.totalEscalas > 0 && (
                <Text style={styles.totalScalesText}>Total de escalas: {item.totalEscalas}</Text>
              )}
            </View>
          </View>
        </View>
      )}
      showsVerticalScrollIndicator={false}
    />
  );

  const renderScales = () => (
    <FlatList
      style={styles.tabContent}
      data={scales}
      keyExtractor={(item) => `${item.eventId}_${item.id}`}
      ListHeaderComponent={() => (
        <View style={styles.scalesHeader}>
          <Text style={styles.tabTitle}>Escalas do Louvor</Text>
          <TouchableOpacity style={styles.createScaleButton} onPress={openCreateScaleModal}>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.createScaleButtonText}>Criar Escala</Text>
          </TouchableOpacity>
        </View>
      )}
      ListEmptyComponent={() => (
        <Text style={styles.emptyText}>Nenhuma escala criada ainda</Text>
      )}
      renderItem={({ item }) => (
        <View style={styles.scaleItem}>
          <View style={styles.scaleContent}>
            <Text style={styles.scaleTitle}>{item.eventName}</Text>
            <Text style={styles.scaleDate}>{item.eventDate} - {item.eventTime}</Text>
            <View style={styles.scaleRoles}>
              <Text style={styles.roleText}>🎵 Banda: {item.banda.nome}</Text>
              <Text style={styles.roleText}>👤 Responsável: {item.banda.responsavel.nome}</Text>
            </View>
            {item.observations && (
              <Text style={styles.observationsText}>📝 {item.observations}</Text>
            )}
          </View>
          <View style={styles.scaleActions}>
            <TouchableOpacity
              style={styles.editScaleButton}
              onPress={() => openEditScaleModal(item)}
            >
              <Ionicons name="pencil" size={16} color="#B8986A" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteScaleButton}
              onPress={() => deleteScale(item)}
            >
              <Ionicons name="trash" size={16} color="#ff4444" />
            </TouchableOpacity>
          </View>
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
        <Text style={styles.headerTitle}>Louvor - Admin</Text>
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
            size={16}
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
          style={[styles.tab, activeTab === "bandas" && styles.activeTab]}
          onPress={() => setActiveTab("bandas")}
        >
          <Ionicons
            name="musical-notes"
            size={16}
            color={activeTab === "bandas" ? "#B8986A" : "#666"}
          />
          <Text style={[
            styles.tabText,
            activeTab === "bandas" && styles.activeTabText
          ]}>
            Bandas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "events" && styles.activeTab]}
          onPress={() => setActiveTab("events")}
        >
          <Ionicons
            name="calendar"
            size={16}
            color={activeTab === "events" ? "#B8986A" : "#666"}
          />
          <Text style={[
            styles.tabText,
            activeTab === "events" && styles.activeTabText
          ]}>
            Eventos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "scales" && styles.activeTab]}
          onPress={() => setActiveTab("scales")}
        >
          <Ionicons
            name="list"
            size={16}
            color={activeTab === "scales" ? "#B8986A" : "#666"}
          />
          <Text style={[
            styles.tabText,
            activeTab === "scales" && styles.activeTabText
          ]}>
            Escalas
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
        {activeTab === "bandas" && renderBandas()}
        {activeTab === "events" && renderEvents()}
        {activeTab === "scales" && renderScales()}
      </View>

      {/* Modal de Buscar e Adicionar Membro */}
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
              <Text style={styles.modalTitle}>Adicionar Membro</Text>
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

      {/* Modal de Adicionar/Editar Banda */}
      <Modal
        visible={bandaModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setBandaModalVisible(false);
          setBandaForm({ nome: "", responsavel: null });
          setResponsavelSearch("");
          setResponsavelResults([]);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingBanda ? "Editar Banda" : "Adicionar Banda"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setBandaModalVisible(false);
                  setBandaForm({ nome: "", responsavel: null });
                  setResponsavelSearch("");
                  setResponsavelResults([]);
                }}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome da Banda:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite o nome da banda"
                  value={bandaForm.nome}
                  onChangeText={(text) => setBandaForm(prev => ({ ...prev, nome: text }))}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Responsável:</Text>
                <View style={styles.memberSelectorContainer}>
                  {bandaForm.responsavel ? (
                    <View style={styles.selectedMember}>
                      <Text style={styles.selectedMemberName}>{bandaForm.responsavel.nome}</Text>
                      <TouchableOpacity
                        onPress={() => setBandaForm(prev => ({ ...prev, responsavel: null }))}
                        style={styles.removeMemberButton}
                      >
                        <Ionicons name="close" size={16} color="#ff4444" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View>
                      <TextInput
                        style={styles.roleSearchInput}
                        placeholder="Buscar responsável..."
                        value={responsavelSearch}
                        onChangeText={searchResponsavel}
                      />
                      
                      {responsavelResults.length > 0 && (
                        <View style={styles.searchResultsContainer}>
                          {responsavelResults.map((member) => (
                            <TouchableOpacity
                              key={member.id}
                              style={styles.memberSearchResult}
                              onPress={() => selectResponsavel(member)}
                            >
                              <Text style={styles.memberSearchResultText}>{member.nome}</Text>
                              <Ionicons name="add-circle-outline" size={20} color="#B8986A" />
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                      
                      {responsavelSearch.length >= 2 && responsavelResults.length === 0 && (
                        <Text style={styles.noResultsText}>Nenhum membro encontrado</Text>
                      )}
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setBandaModalVisible(false);
                    setBandaForm({ nome: "", responsavel: null });
                    setResponsavelSearch("");
                    setResponsavelResults([]);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={saveBanda}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {editingBanda ? "Atualizar" : "Salvar"} Banda
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Seleção de Evento */}
      <Modal
        visible={eventSelectionModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEventSelectionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Evento</Text>
              <TouchableOpacity onPress={() => setEventSelectionModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={events}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={() => (
                <Text style={styles.emptyText}>Nenhum evento disponível</Text>
              )}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.eventSelectionItem}
                  onPress={() => selectEventForScale(item)}
                >
                  <View style={styles.eventSelectionContent}>
                    <Text style={styles.eventSelectionTitle}>{item.nome}</Text>
                    <Text style={styles.eventSelectionDate}>{item.data} - {item.horario}</Text>
                    {item.escalaLouvor === "OK" && (
                      <View style={styles.eventHasScale}>
                        <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
                        <Text style={styles.eventHasScaleText}>Já tem escala</Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#B8986A" />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Modal de Seleção de Banda */}
      <Modal
        visible={bandaSelectionModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setBandaSelectionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Banda</Text>
              <TouchableOpacity onPress={() => setBandaSelectionModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={bandas}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={() => (
                <Text style={styles.emptyText}>Nenhuma banda disponível</Text>
              )}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.eventSelectionItem}
                  onPress={() => selectBandaForScale(item)}
                >
                  <View style={styles.eventSelectionContent}>
                    <Text style={styles.eventSelectionTitle}>{item.nome}</Text>
                    <Text style={styles.eventSelectionDate}>
                      Responsável: {item.responsavel.nome}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#B8986A" />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Modal de Criar/Editar Escala */}
      <Modal
        visible={scaleModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setScaleModalVisible(false);
          resetCompletely();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingScale ? "Editar Escala" : "Criar Escala"} - Louvor
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setScaleModalVisible(false);
                  resetCompletely();
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

              {selectedBanda && (
                <View style={styles.eventInfo}>
                  <Text style={styles.eventInfoTitle}>Banda: {selectedBanda.nome}</Text>
                  <Text style={styles.eventInfoDetail}>
                    Responsável: {selectedBanda.responsavel.nome}
                  </Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Observações:</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Observações especiais para esta escala"
                  value={scaleForm.observations}
                  onChangeText={(text) => setScaleForm({ observations: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setScaleModalVisible(false);
                    resetCompletely();
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
                    <Text style={styles.saveButtonText}>
                      {editingScale ? "Atualizar" : "Salvar"} Escala
                    </Text>
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
    gap: 3,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#B8986A",
  },
  tabText: {
    fontSize: 11,
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
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#f8f8f8",
  },
  editButton: {
    backgroundColor: "#f0f8ff",
  },
  deleteButton: {
    backgroundColor: "#ffe6e6",
  },
  eventsHeader: {
    marginBottom: 20,
  },
  eventItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
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
  scaleStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
  },
  scaleStatusText: {
    fontSize: 12,
    color: "#50C878",
    fontWeight: "600",
  },
  totalScalesText: {
    fontSize: 12,
    color: "#999",
    marginTop: 3,
    fontStyle: "italic",
  },
  scalesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  createScaleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#B8986A",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 5,
  },
  createScaleButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  scaleItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  scaleContent: {
    flex: 1,
  },
  scaleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  scaleDate: {
    fontSize: 12,
    color: "#666",
    marginBottom: 10,
  },
  scaleRoles: {
    gap: 3,
  },
  roleText: {
    fontSize: 12,
    color: "#555",
  },
  observationsText: {
    fontSize: 12,
    color: "#777",
    marginTop: 5,
    fontStyle: "italic",
  },
  scaleActions: {
    flexDirection: "row",
    gap: 8,
  },
  editScaleButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#f0f8ff",
  },
  deleteScaleButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#ffe6e6",
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
  eventSelectionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  eventSelectionContent: {
    flex: 1,
  },
  eventSelectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  eventSelectionDate: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  eventHasScale: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
  },
  eventHasScaleText: {
    fontSize: 12,
    color: "#FFD700",
    fontWeight: "500",
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
  memberSelectorContainer: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
  },
  selectedMember: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#B8986A",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  selectedMemberName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  removeMemberButton: {
    padding: 2,
  },
  roleSearchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#fff",
    marginBottom: 5,
  },
  searchResultsContainer: {
    maxHeight: 150,
    backgroundColor: "#f8f9fa",
    borderRadius: 6,
    paddingVertical: 5,
  },
  memberSearchResult: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  memberSearchResultText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  noResultsText: {
    textAlign: "center",
    color: "#999",
    fontSize: 12,
    fontStyle: "italic",
    paddingVertical: 10,
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


