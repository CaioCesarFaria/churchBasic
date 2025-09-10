// MinisterioComunicacaoAdmin.js - VERSÃO CORRIGIDA
// CORREÇÕES: Lista de membros com scroll infinito + Escalas aparecendo corretamente
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
  const [searchUsers, setSearchUsers] = useState([]);
  const [userSearchText, setUserSearchText] = useState("");
  const [searchingUsers, setSearchingUsers] = useState(false);
  // NOVO: Estado para controlar expansão da lista de membros
  const [membersExpanded, setMembersExpanded] = useState(false);

  // Estados dos Eventos
  const [events, setEvents] = useState([]);
  
  // Estados para expansão de escalas nos eventos
  const [expandedEvents, setExpandedEvents] = useState({});
  const [eventScales, setEventScales] = useState({});

  // Estados das Escalas
  const [scales, setScales] = useState([]);
  const [scaleModalVisible, setScaleModalVisible] = useState(false);
  const [eventSelectionModalVisible, setEventSelectionModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingScale, setEditingScale] = useState(null);
  const [scaleForm, setScaleForm] = useState({
    responsavelSom: null,
    responsavelIluminacao: null,
    operadorSlides: null,
    cinegrafista: null,
    fotografo: null,
    streamingOperator: null,
    observations: ""
  });

  // Estados para busca de membros na escala
  const [roleSearches, setRoleSearches] = useState({
    responsavelSom: "",
    responsavelIluminacao: "",
    operadorSlides: "",
    cinegrafista: "",
    fotografo: "",
    streamingOperator: ""
  });

  const [roleSearchResults, setRoleSearchResults] = useState({
    responsavelSom: [],
    responsavelIluminacao: [],
    operadorSlides: [],
    cinegrafista: [],
    fotografo: [],
    streamingOperator: []
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

  // NOVA FUNÇÃO - Carregar todas as escalas de todos os ministérios para um evento
  const loadEventScales = async (eventId) => {
    try {
      const scalesData = {
        comunicacao: [],
        louvor: []
      };

      const scalesRef = collection(db, "churchBasico", "sistema", "eventos", eventId, "escalas");
      const querySnapshot = await getDocs(scalesRef);
      
      querySnapshot.forEach((doc) => {
        const scaleData = doc.data();
        
        // Verificar se é placeholder
        if (doc.id === "_placeholder") return;
        
        // Classificar por ministério
        if (scaleData.ministerio === "comunicacao") {
          scalesData.comunicacao.push({
            id: doc.id,
            ...scaleData
          });
        } else if (scaleData.ministerio === "louvor") {
          scalesData.louvor.push({
            id: doc.id,
            ...scaleData
          });
        }
      });

      setEventScales(prev => ({
        ...prev,
        [eventId]: scalesData
      }));

    } catch (error) {
      console.log(`Erro ao carregar escalas do evento ${eventId}:`, error);
    }
  };

  // FUNÇÃO para expandir/recolher evento
  const toggleEventExpansion = async (eventId) => {
    const isExpanded = expandedEvents[eventId];
    
    setExpandedEvents(prev => ({
      ...prev,
      [eventId]: !isExpanded
    }));

    // Se está expandindo e ainda não carregou as escalas, carregar
    if (!isExpanded && !eventScales[eventId]) {
      await loadEventScales(eventId);
    }
  };

  // FUNÇÃO CORRIGIDA - Carregar escalas existentes
  const loadScales = async () => {
    try {
      const scalesData = [];
      
      for (const event of events) {
        try {
          // CORREÇÃO: Buscar na coleção escalas do evento
          const scalesRef = collection(db, "churchBasico", "sistema", "eventos", event.id, "escalas");
          const querySnapshot = await getDocs(scalesRef);
          
          querySnapshot.forEach((doc) => {
            const scaleData = doc.data();
            
            // Verificar se é escala de comunicação
            if (scaleData.ministerio === "comunicacao") {
              scalesData.push({
                id: doc.id,
                eventId: event.id,
                eventName: event.nome,
                eventDate: event.data,
                eventTime: event.horario,
                ...scaleData
              });
            }
          });
          
        } catch (error) {
          console.log(`Erro ao carregar escala do evento ${event.id}:`, error);
        }
      }
      
      // Ordenar por data do evento (mais recentes primeiro)
      scalesData.sort((a, b) => {
        const dateA = new Date(a.eventDate.split('/').reverse().join('-'));
        const dateB = new Date(b.eventDate.split('/').reverse().join('-'));
        return dateB - dateA;
      });
      
      setScales(scalesData);
      console.log(`Escalas carregadas: ${scalesData.length}`);
      
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
      const memberRef = doc(db, "churchBasico", "ministerios", "conteudo", "comunicacao", "membros", memberId);

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

  // Reset funções
  const resetScaleForm = () => {
    setScaleForm({
      responsavelSom: null,
      responsavelIluminacao: null,
      operadorSlides: null,
      cinegrafista: null,
      fotografo: null,
      streamingOperator: null,
      observations: ""
    });
    
    setRoleSearches({
      responsavelSom: "",
      responsavelIluminacao: "",
      operadorSlides: "",
      cinegrafista: "",
      fotografo: "",
      streamingOperator: ""
    });
    
    setRoleSearchResults({
      responsavelSom: [],
      responsavelIluminacao: [],
      operadorSlides: [],
      cinegrafista: [],
      fotografo: [],
      streamingOperator: []
    });
    
    setEditingScale(null);
  };

  const resetCompletely = () => {
    resetScaleForm();
    setSelectedEvent(null);
  };

  // Funções das Escalas
  const openCreateScaleModal = () => {
    setEventSelectionModalVisible(true);
  };

  const selectEventForScale = (event) => {
    setSelectedEvent(event);
    setEventSelectionModalVisible(false);
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
    setScaleForm({
      responsavelSom: scale.responsavelSom || null,
      responsavelIluminacao: scale.responsavelIluminacao || null,
      operadorSlides: scale.operadorSlides || null,
      cinegrafista: scale.cinegrafista || null,
      fotografo: scale.fotografo || null,
      streamingOperator: scale.streamingOperator || null,
      observations: scale.observations || ""
    });
    setScaleModalVisible(true);
  };

  const searchMembersForRole = (role, searchText) => {
    setRoleSearches(prev => ({
      ...prev,
      [role]: searchText
    }));

    if (!searchText.trim() || searchText.length < 2) {
      setRoleSearchResults(prev => ({
        ...prev,
        [role]: []
      }));
      return;
    }

    const filteredMembers = members.filter(member =>
      member.nome.toLowerCase().includes(searchText.toLowerCase())
    );

    setRoleSearchResults(prev => ({
      ...prev,
      [role]: filteredMembers
    }));
  };

  const selectMemberForRole = (role, member) => {
    setScaleForm(prev => ({
      ...prev,
      [role]: member
    }));
    
    setRoleSearches(prev => ({
      ...prev,
      [role]: ""
    }));
    
    setRoleSearchResults(prev => ({
      ...prev,
      [role]: []
    }));
  };

  const saveScale = async () => {
    if (!selectedEvent || !selectedEvent.id) {
      Alert.alert("Erro", "Evento não selecionado. Feche o modal e tente novamente.");
      return;
    }

    if (!scaleForm.responsavelSom && !scaleForm.responsavelIluminacao) {
      Alert.alert("Erro", "Por favor, selecione pelo menos um responsável");
      return;
    }

    try {
      setLoading(true);
      
      const createMemberObject = (member) => {
        if (!member) return null;
        return {
          id: member.id || "",
          nome: member.nome || "",
          userId: member.userId || ""
        };
      };
      
      const scaleData = {
        ministerio: "comunicacao",
        eventId: selectedEvent.id,
        eventName: selectedEvent.nome,
        eventDate: selectedEvent.data,
        eventTime: selectedEvent.horario,
        responsavelSom: createMemberObject(scaleForm.responsavelSom),
        responsavelIluminacao: createMemberObject(scaleForm.responsavelIluminacao),
        operadorSlides: createMemberObject(scaleForm.operadorSlides),
        cinegrafista: createMemberObject(scaleForm.cinegrafista),
        fotografo: createMemberObject(scaleForm.fotografo),
        streamingOperator: createMemberObject(scaleForm.streamingOperator),
        observations: scaleForm.observations.trim(),
        createdBy: user.uid,
        createdByName: userName,
        createdAt: editingScale ? editingScale.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true
      };

      const scaleRef = doc(db, "churchBasico", "sistema", "eventos", selectedEvent.id, "escalas", "comunicacao");
      await setDoc(scaleRef, scaleData);
      
      const eventRef = doc(db, "churchBasico", "sistema", "eventos", selectedEvent.id);
      const currentEvent = events.find(e => e.id === selectedEvent.id);
      const isNewScale = !editingScale;
      
      await updateDoc(eventRef, {
        escalaComunicacao: "OK",
        totalEscalas: isNewScale ? (currentEvent?.totalEscalas || 0) + 1 : currentEvent?.totalEscalas || 1,
        updatedAt: serverTimestamp()
      });
      
      Alert.alert("Sucesso", editingScale ? "Escala atualizada com sucesso!" : "Escala da Comunicação criada com sucesso!");
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
      `Tem certeza que deseja excluir a escala do evento "${scale.eventName}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              
              const scaleRef = doc(db, "churchBasico", "sistema", "eventos", scale.eventId, "escalas", "comunicacao");
              await deleteDoc(scaleRef);
              
              const eventRef = doc(db, "churchBasico", "sistema", "eventos", scale.eventId);
              const currentEvent = events.find(e => e.id === scale.eventId);
              const newTotalEscalas = Math.max(0, (currentEvent?.totalEscalas || 1) - 1);
              
              await updateDoc(eventRef, {
                escalaComunicacao: null,
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

  const renderMemberSelector = (role, selectedMember, placeholder) => {
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{placeholder}:</Text>
        <View style={styles.memberSelectorContainer}>
          {selectedMember ? (
            <View style={styles.selectedMember}>
              <Text style={styles.selectedMemberName}>{selectedMember.nome}</Text>
              <TouchableOpacity
                onPress={() => selectMemberForRole(role, null)}
                style={styles.removeMemberButton}
              >
                <Ionicons name="close" size={16} color="#ff4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <TextInput
                style={styles.roleSearchInput}
                placeholder={`Buscar membro para ${placeholder}...`}
                value={roleSearches[role]}
                onChangeText={(text) => searchMembersForRole(role, text)}
              />
              
              {roleSearchResults[role].length > 0 && (
                <View style={styles.searchResultsContainer}>
                  {roleSearchResults[role].map((member) => (
                    <TouchableOpacity
                      key={member.id}
                      style={styles.memberSearchResult}
                      onPress={() => selectMemberForRole(role, member)}
                    >
                      <Text style={styles.memberSearchResultText}>{member.nome}</Text>
                      <Ionicons name="add-circle-outline" size={20} color="#B8986A" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              {roleSearches[role].length >= 2 && roleSearchResults[role].length === 0 && (
                <Text style={styles.noResultsText}>Nenhum membro encontrado</Text>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  // RENDERIZAÇÃO CORRIGIDA - Membros com card expansível
  const renderMembers = () => {
    const stats = getMembersStats();
    const membersToShow = membersExpanded ? members : members.slice(0, 3);
    
    return (
      <ScrollView style={styles.container}>
        <View style={styles.membersHeader}>
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
        </View>

        {/* CARD EXPANSÍVEL DE MEMBROS */}
        <View style={styles.membersExpandableCard}>
          <View style={styles.membersCardHeader}>
            <Text style={styles.membersCardTitle}>
              Lista de Membros ({members.length})
            </Text>
            
            {members.length > 3 && (
              <TouchableOpacity 
                style={styles.membersExpandButton}
                onPress={() => setMembersExpanded(!membersExpanded)}
              >
                <Text style={styles.membersExpandText}>
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
          
          <View style={styles.membersExpandedContent}>
            {membersToShow.length > 0 ? (
              <FlatList
                data={membersToShow}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.memberCard}>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{item.nome}</Text>
                      {item.telefone && (
                        <Text style={styles.memberContact}>📞 {item.telefone}</Text>
                      )}
                      {item.email && (
                        <Text style={styles.memberContact}>📧 {item.email}</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.deleteMemberButton}
                      onPress={() => deleteMember(item)}
                    >
                      <Ionicons name="trash" size={18} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                )}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <Text style={styles.emptyText}>Nenhum membro cadastrado ainda</Text>
            )}
          </View>
        </View>
      </ScrollView>
    );
  };

  // FUNÇÃO ATUALIZADA - renderEvents com eventos expansíveis
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
            <View style={styles.eventMainInfo}>
              <View style={styles.eventBasicInfo}>
                <Text style={styles.eventTitle}>{item.nome}</Text>
                <View style={styles.eventDetails}>
                  <Text style={styles.eventDetail}>📅 {item.data}</Text>
                  <Text style={styles.eventDetail}>⏰ {item.horario}</Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.expandButton}
                onPress={() => toggleEventExpansion(item.id)}
              >
                <Text style={styles.expandButtonText}>
                  {expandedEvents[item.id] ? "Ocultar detalhes" : "Ver detalhes"}
                </Text>
                <Ionicons 
                  name={expandedEvents[item.id] ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#B8986A" 
                />
              </TouchableOpacity>
            </View>

            {/* Status das Escalas */}
            <View style={styles.scalesStatusContainer}>
              {item.escalaComunicacao === "OK" && (
                <View style={styles.scaleStatus}>
                  <Ionicons name="checkmark-circle" size={16} color="#50C878" />
                  <Text style={styles.scaleStatusText}>Escala Comunicação OK</Text>
                </View>
              )}
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

            {/* Escalas Expandidas */}
            {expandedEvents[item.id] && eventScales[item.id] && (
              <View style={styles.expandedScalesContainer}>
                
                {/* Escalas de Comunicação */}
                {eventScales[item.id].comunicacao.length > 0 && (
                  <View style={styles.ministryScalesSection}>
                    <Text style={styles.ministryScalesTitle}>📢 Comunicação</Text>
                    {eventScales[item.id].comunicacao.map((scale) => (
                      <View key={scale.id} style={styles.scaleDetailItem}>
                        <View style={styles.scaleRoles}>
                          {scale.responsavelSom && (
                            <Text style={styles.roleDetailText}>Som: {scale.responsavelSom.nome}</Text>
                          )}
                          {scale.responsavelIluminacao && (
                            <Text style={styles.roleDetailText}>Iluminação: {scale.responsavelIluminacao.nome}</Text>
                          )}
                          {scale.operadorSlides && (
                            <Text style={styles.roleDetailText}>Slides: {scale.operadorSlides.nome}</Text>
                          )}
                          {scale.cinegrafista && (
                            <Text style={styles.roleDetailText}>Cinegrafista: {scale.cinegrafista.nome}</Text>
                          )}
                          {scale.fotografo && (
                            <Text style={styles.roleDetailText}>Fotógrafo: {scale.fotografo.nome}</Text>
                          )}
                          {scale.streamingOperator && (
                            <Text style={styles.roleDetailText}>Streaming: {scale.streamingOperator.nome}</Text>
                          )}
                        </View>
                        {scale.observations && (
                          <Text style={styles.observationsDetailText}>📝 {scale.observations}</Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Escalas de Louvor */}
                {eventScales[item.id].louvor.length > 0 && (
                  <View style={styles.ministryScalesSection}>
                    <Text style={styles.ministryScalesTitle}>🎵 Louvor</Text>
                    {eventScales[item.id].louvor.map((scale) => (
                      <View key={scale.id} style={styles.scaleDetailItem}>
                        <Text style={styles.roleDetailText}>Banda: {scale.banda?.nome || "N/A"}</Text>
                        <Text style={styles.roleDetailText}>Responsável: {scale.banda?.responsavel?.nome || "N/A"}</Text>
                        {scale.observations && (
                          <Text style={styles.observationsDetailText}>📝 {scale.observations}</Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Caso não tenha escalas */}
                {eventScales[item.id].comunicacao.length === 0 && eventScales[item.id].louvor.length === 0 && (
                  <Text style={styles.noScalesText}>Nenhuma escala cadastrada para este evento</Text>
                )}
              </View>
            )}
          </View>
        </View>
      )}
      showsVerticalScrollIndicator={false}
    />
  );

  const renderScales = () => (
    <View style={styles.container}>
      <View style={styles.scalesHeader}>
        <Text style={styles.tabTitle}>Escalas da Comunicação</Text>
        <View style={styles.scalesButtonsContainer}>
          <TouchableOpacity 
            style={styles.refreshScalesButton} 
            onPress={() => {
              setLoading(true);
              loadScales().finally(() => setLoading(false));
            }}
          >
            <Ionicons name="refresh" size={16} color="#666" />
            <Text style={styles.refreshScalesButtonText}>Atualizar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.createScaleButton} onPress={openCreateScaleModal}>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.createScaleButtonText}>Criar Escala</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={scales}
        keyExtractor={(item) => `${item.eventId}_${item.id}`}
        contentContainerStyle={styles.scalesList}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma escala criada ainda</Text>
            <Text style={styles.emptySubText}>Crie escalas para organizar os eventos do ministério</Text>
            
            <TouchableOpacity 
              style={styles.refreshEmptyButton} 
              onPress={() => {
                console.log("Recarregando escalas...");
                setLoading(true);
                loadScales().finally(() => setLoading(false));
              }}
            >
              <Ionicons name="refresh" size={16} color="#B8986A" />
              <Text style={styles.refreshEmptyButtonText}>Recarregar escalas</Text>
            </TouchableOpacity>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.scaleCard}>
            <View style={styles.scaleContent}>
              <View style={styles.scaleHeader}>
                <Text style={styles.scaleTitle}>{item.eventName}</Text>
                <Text style={styles.scaleDate}>{item.eventDate} - {item.eventTime}</Text>
              </View>
              
              <View style={styles.scaleRoles}>
                {item.responsavelSom && (
                  <Text style={styles.roleText}>🔊 Som: {item.responsavelSom.nome}</Text>
                )}
                {item.responsavelIluminacao && (
                  <Text style={styles.roleText}>💡 Iluminação: {item.responsavelIluminacao.nome}</Text>
                )}
                {item.operadorSlides && (
                  <Text style={styles.roleText}>💻 Slides: {item.operadorSlides.nome}</Text>
                )}
                {item.cinegrafista && (
                  <Text style={styles.roleText}>🎬 Cinegrafista: {item.cinegrafista.nome}</Text>
                )}
                {item.fotografo && (
                  <Text style={styles.roleText}>📷 Fotógrafo: {item.fotografo.nome}</Text>
                )}
                {item.streamingOperator && (
                  <Text style={styles.roleText}>📡 Streaming: {item.streamingOperator.nome}</Text>
                )}
              </View>

              {item.observations && (
                <View style={styles.observationsContainer}>
                  <Text style={styles.observationsText}>📝 {item.observations}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.scaleActions}>
              <TouchableOpacity
                style={styles.editScaleButton}
                onPress={() => openEditScaleModal(item)}
              >
                <Ionicons name="pencil" size={18} color="#B8986A" />
                <Text style={styles.actionButtonText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteScaleButton}
                onPress={() => deleteScale(item)}
              >
                <Ionicons name="trash" size={18} color="#ff4444" />
                <Text style={styles.actionButtonText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
            size={18} 
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
            size={18} 
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
            size={18} 
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
                    {item.escalaComunicacao === "OK" && (
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
                {editingScale ? "Editar Escala" : "Criar Escala"} - Comunicação
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

              {renderMemberSelector("responsavelSom", scaleForm.responsavelSom, "Responsável pelo Som")}
              {renderMemberSelector("responsavelIluminacao", scaleForm.responsavelIluminacao, "Responsável pela Iluminação")}
              {renderMemberSelector("operadorSlides", scaleForm.operadorSlides, "Operador de Slides")}
              {renderMemberSelector("cinegrafista", scaleForm.cinegrafista, "Cinegrafista")}
              {renderMemberSelector("fotografo", scaleForm.fotografo, "Fotógrafo")}
              {renderMemberSelector("streamingOperator", scaleForm.streamingOperator, "Operador de Streaming")}

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
  // ESTILOS SIMPLIFICADOS E FUNCIONAIS
  membersScrollContainer: {
    maxHeight: 300,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
  },
  scalesHeaderContent: {
    width: '100%',
  },
  allMembersContainer: {
    width: '100%',
  },
  emptyMembersContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  scalesButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  refreshScalesButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  refreshScalesButtonText: {
    color: "#666",
    fontSize: 12,
    fontWeight: "600",
  },
  refreshEmptyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    marginTop: 15,
  },
  refreshEmptyButtonText: {
    color: "#B8986A",
    fontSize: 14,
    fontWeight: "600",
  },
  membersExpandableCard: {
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
  membersExpandButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  membersExpandText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B8986A",
  },
  membersExpandedContent: {
    padding: 16,
  },
  container: {
    flex: 1,
  },
  membersHeader: {
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  membersListContainer: {
    paddingBottom: 20,
  },
  memberCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  deleteMemberButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#ffe6e6",
  },
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#f8f9fa",
    gap: 6,
  },
  expandButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B8986A",
  },
  scalesHeader: {
    padding: 20,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    gap: 15,
  },
  scalesList: {
    padding: 20,
  },
  scaleCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  scaleHeader: {
    marginBottom: 12,
  },
  observationsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  observationsText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    lineHeight: 16,
  },
  scaleActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    gap: 10,
  },
  editScaleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f0f8ff",
    gap: 5,
    flex: 1,
    justifyContent: "center",
  },
  deleteScaleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#ffe6e6",
    gap: 5,
    flex: 1,
    justifyContent: "center",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptySubText: {
    textAlign: "center",
    color: "#aaa",
    fontSize: 12,
    marginTop: 5,
    maxWidth: 250,
  },
  // ESTILOS PRINCIPAIS CONTINUAM
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
  eventMainInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  eventBasicInfo: {
    flex: 1,
  },
  scalesStatusContainer: {
    gap: 5,
    marginBottom: 10,
  },
  expandedScalesContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#B8986A",
  },
  ministryScalesSection: {
    marginBottom: 15,
  },
  ministryScalesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  scaleDetailItem: {
    backgroundColor: "#fff",
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#B8986A",
  },
  roleDetailText: {
    fontSize: 12,
    color: "#555",
    marginBottom: 2,
  },
  observationsDetailText: {
    fontSize: 11,
    color: "#777",
    marginTop: 5,
    fontStyle: "italic",
  },
  noScalesText: {
    textAlign: "center",
    color: "#999",
    fontSize: 12,
    fontStyle: "italic",
    paddingVertical: 10,
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
  membersList: {
    flex: 1,
    marginTop: 10,
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

// Fim do arquivo
