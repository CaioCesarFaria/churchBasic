// DiaconatoEscalas.js - ARQUIVO COMPLETO COM TODAS AS CORREÇÕES
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
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import DiaconatoDizimos from "../components/DiaconatoDizimos";

export default function DiaconatoEscalas({
  events,
  scales,
  teams,
  teamLeaders,
  members,
  onRefresh,
  canCreateScales,
  canViewAllScales,
  userType,
  currentUserId,
  userRole,
  isLiderTimeA,
  isLiderTimeB
}) {
  const { user, userData } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("escalas");
  
  // Estados para modais
  const [scaleModalVisible, setScaleModalVisible] = useState(false);
  const [eventSelectionModalVisible, setEventSelectionModalVisible] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedScale, setSelectedScale] = useState(null);
  const [editingScale, setEditingScale] = useState(null);
  
  // Estados do formulário da escala
  const [scaleForm, setScaleForm] = useState({
    selectedTeam: null,
    functions: {
      recepcao: [],
      oferta: [],
      ceia: [],
      ordem: [],
      portaria: [],
      estacionamento: []
    },
    observations: ""
  });

  // Estados para busca de membros por função
  const [functionSearches, setFunctionSearches] = useState({});
  const [functionSearchResults, setFunctionSearchResults] = useState({});

  const userName = userData?.name || user?.displayName || "Usuario";
  
  // Verificar se é membro do diaconato (qualquer membro pode preencher dízimos)
  const isMemberOfDiaconato = members.some(member => 
    member.userId === user.uid || member.id === user.uid
  );
  
  // Determinar qual time o líder pode escalar
  const allowedTeam = isLiderTimeA ? 'teamA' : isLiderTimeB ? 'teamB' : null;
  const isResponsavelGeral = userRole === "responsavel";
  const isLiderTime = isLiderTimeA || isLiderTimeB;
  const isMember = !isResponsavelGeral && !isLiderTime;

  // Qualquer membro do diaconato pode acessar a aba de dízimos
  const canAccessDizimos = isMemberOfDiaconato || isResponsavelGeral || isLiderTime;

  // Funções disponíveis para o diaconato
  const availableFunctions = [
    { key: 'recepcao', name: 'Recepção', icon: 'hand-left' },
    { key: 'oferta', name: 'Oferta', icon: 'gift' },
    { key: 'ceia', name: 'Ceia', icon: 'restaurant' },
    { key: 'ordem', name: 'Ordem', icon: 'shield-checkmark' },
    { key: 'portaria', name: 'Portaria', icon: 'lock-closed' },
    { key: 'estacionamento', name: 'Estacionamento', icon: 'car' }
  ];

  // Reset do formulário
  const resetScaleForm = () => {
    const initialTeam = allowedTeam || null;
    
    setScaleForm({
      selectedTeam: initialTeam,
      functions: {
        recepcao: [],
        oferta: [],
        ceia: [],
        ordem: [],
        portaria: [],
        estacionamento: []
      },
      observations: ""
    });
    setFunctionSearches({});
    setFunctionSearchResults({});
    setEditingScale(null);
  };

  const resetCompletely = () => {
    resetScaleForm();
    setSelectedEvent(null);
  };

  // Abrir modal de criação de escala (apenas para líderes)
  const openCreateScaleModal = () => {
    if (!canCreateScales) {
      Alert.alert("Sem Permissão", "Apenas líderes podem criar escalas.");
      return;
    }
    setEventSelectionModalVisible(true);
  };

  // Selecionar evento para escala
  const selectEventForScale = (event) => {
    setSelectedEvent(event);
    setEventSelectionModalVisible(false);
    resetScaleForm();
    setScaleModalVisible(true);
  };

  // Abrir modal de edição (apenas para quem criou ou responsável geral)
  const openEditScaleModal = (scale) => {
    if (!canCreateScales) {
      Alert.alert("Sem Permissão", "Você não pode editar escalas.");
      return;
    }
    
    if (scale.createdBy !== user.uid && !isResponsavelGeral) {
      Alert.alert("Sem Permissão", "Você só pode editar escalas criadas por você.");
      return;
    }

    setEditingScale(scale);
    setSelectedEvent({
      id: scale.eventId,
      nome: scale.eventName,
      data: scale.eventDate,
      horario: scale.eventTime
    });
    
    setScaleForm({
      selectedTeam: scale.selectedTeam,
      functions: scale.functions || {
        recepcao: [],
        oferta: [],
        ceia: [],
        ordem: [],
        portaria: [],
        estacionamento: []
      },
      observations: scale.observations || ""
    });
    setScaleModalVisible(true);
  };

  // Selecionar team
  const selectTeam = (teamKey) => {
    if (allowedTeam && teamKey !== allowedTeam) {
      Alert.alert("Aviso", `Você só pode criar escalas para o ${allowedTeam === 'teamA' ? 'Time A' : 'Time B'}.`);
      return;
    }

    setScaleForm(prev => ({
      ...prev,
      selectedTeam: teamKey,
      functions: {
        recepcao: [],
        oferta: [],
        ceia: [],
        ordem: [],
        portaria: [],
        estacionamento: []
      }
    }));
  };

  // CORREÇÃO: Buscar membros para função - Busca nos MEMBROS do diaconato
  const searchMembersForFunction = (functionKey, searchText) => {
    setFunctionSearches(prev => ({
      ...prev,
      [functionKey]: searchText
    }));

    if (!searchText.trim() || searchText.length < 2) {
      setFunctionSearchResults(prev => ({
        ...prev,
        [functionKey]: []
      }));
      return;
    }

    const selectedTeam = scaleForm.selectedTeam;
    if (!selectedTeam) return;

    // CORREÇÃO: Buscar nos MEMBROS do diaconato filtrados pelo team selecionado
    const teamMembers = members.filter(member => {
      // Filtrar pelo team selecionado
      const memberTeam = member.team || member.time; // pode ser 'team' ou 'time' dependendo da estrutura
      const isInSelectedTeam = memberTeam === selectedTeam || 
                               (selectedTeam === 'teamA' && (memberTeam === 'teamA' || memberTeam === 'A')) ||
                               (selectedTeam === 'teamB' && (memberTeam === 'teamB' || memberTeam === 'B'));
      
      // Filtrar pelo texto de busca
      const memberName = member.name || member.nome || '';
      const matchesSearch = memberName.toLowerCase().includes(searchText.toLowerCase());
      
      return isInSelectedTeam && matchesSearch;
    });

    setFunctionSearchResults(prev => ({
      ...prev,
      [functionKey]: teamMembers
    }));
  };

  // Adicionar membro à função
  const addMemberToFunction = (functionKey, member) => {
    const memberId = member.id || member.userId;
    const memberName = member.name || member.nome;
    
    const isAlreadyInFunction = scaleForm.functions[functionKey].some(
      m => m.id === memberId || m.userId === memberId
    );

    if (isAlreadyInFunction) {
      Alert.alert("Aviso", "Este membro já está nesta função!");
      return;
    }

    const memberToAdd = {
      id: memberId,
      userId: member.userId || memberId,
      nome: memberName,
      name: memberName
    };

    setScaleForm(prev => ({
      ...prev,
      functions: {
        ...prev.functions,
        [functionKey]: [...prev.functions[functionKey], memberToAdd]
      }
    }));

    setFunctionSearches(prev => ({
      ...prev,
      [functionKey]: ""
    }));

    setFunctionSearchResults(prev => ({
      ...prev,
      [functionKey]: []
    }));
  };

  // Remover membro da função
  const removeMemberFromFunction = (functionKey, memberId) => {
    setScaleForm(prev => ({
      ...prev,
      functions: {
        ...prev.functions,
        [functionKey]: prev.functions[functionKey].filter(m => 
          m.id !== memberId && m.userId !== memberId
        )
      }
    }));
  };

  // Salvar escala
  const saveScale = async () => {
    if (!selectedEvent || !selectedEvent.id) {
      Alert.alert("Erro", "Evento não selecionado!");
      return;
    }

    if (!scaleForm.selectedTeam) {
      Alert.alert("Erro", "Por favor, selecione um time!");
      return;
    }

    const totalMembers = Object.values(scaleForm.functions)
      .reduce((total, func) => total + func.length, 0);

    if (totalMembers === 0) {
      Alert.alert("Erro", "Por favor, adicione pelo menos um membro!");
      return;
    }

    try {
      setLoading(true);

      const confirmationsNeeded = {};
      Object.keys(scaleForm.functions).forEach(functionKey => {
        scaleForm.functions[functionKey].forEach(member => {
          const userId = member.userId || member.id;
          if (functionKey !== 'oferta') {
            confirmationsNeeded[userId] = {
              memberName: member.nome || member.name,
              functionName: availableFunctions.find(f => f.key === functionKey)?.name || functionKey,
              confirmed: false,
              confirmedAt: null
            };
          } else {
            confirmationsNeeded[userId] = {
              memberName: member.nome || member.name,
              functionName: 'Oferta',
              confirmed: true,
              confirmedAt: serverTimestamp(),
              autoConfirmed: true
            };
          }
        });
      });

      const scaleData = {
        ministerio: "diaconato",
        eventId: selectedEvent.id,
        eventName: selectedEvent.nome,
        eventDate: selectedEvent.data,
        eventTime: selectedEvent.horario,
        selectedTeam: scaleForm.selectedTeam,
        functions: scaleForm.functions,
        observations: scaleForm.observations.trim(),
        confirmations: confirmationsNeeded,
        scaleConfirmed: false,
        createdBy: user.uid,
        createdByName: userName,
        createdAt: editingScale ? editingScale.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true
      };

      const scaleRef = doc(db, "churchBasico", "sistema", "eventos", selectedEvent.id, "escalas", "diaconato");
      await setDoc(scaleRef, scaleData);

      const eventRef = doc(db, "churchBasico", "sistema", "eventos", selectedEvent.id);
      const currentEvent = events.find(e => e.id === selectedEvent.id);
      const isNewScale = !editingScale;

      await updateDoc(eventRef, {
        escalaDiaconato: "PENDENTE",
        totalEscalas: isNewScale ? (currentEvent?.totalEscalas || 0) + 1 : currentEvent?.totalEscalas || 1,
        updatedAt: serverTimestamp()
      });

      Alert.alert("Sucesso", editingScale ? "Escala atualizada!" : "Escala do Diaconato criada! Os membros agora podem confirmar presença.");
      setScaleModalVisible(false);
      resetCompletely();
      await onRefresh();

    } catch (error) {
      console.error("Erro ao salvar escala:", error);
      Alert.alert("Erro", "Não foi possível salvar a escala. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Confirmar presença do membro
  const confirmPresence = async (scale) => {
    if (!scale.confirmations || !scale.confirmations[user.uid]) {
      Alert.alert("Erro", "Você não está escalado neste evento.");
      return;
    }

    if (scale.confirmations[user.uid].confirmed) {
      Alert.alert("Aviso", "Você já confirmou sua presença!");
      return;
    }

    try {
      setLoading(true);

      const updatedConfirmations = {
        ...scale.confirmations,
        [user.uid]: {
          ...scale.confirmations[user.uid],
          confirmed: true,
          confirmedAt: serverTimestamp()
        }
      };

      const scaleRef = doc(db, "churchBasico", "sistema", "eventos", scale.eventId, "escalas", "diaconato");
      await updateDoc(scaleRef, {
        confirmations: updatedConfirmations,
        updatedAt: serverTimestamp()
      });

      Alert.alert("Sucesso", "Presença confirmada com sucesso!");
      await onRefresh();

    } catch (error) {
      console.error("Erro ao confirmar presença:", error);
      Alert.alert("Erro", "Não foi possível confirmar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Confirmar escala final (apenas para líderes)
  const confirmFinalScale = async (scale) => {
    if (!canCreateScales) {
      Alert.alert("Sem Permissão", "Apenas líderes podem confirmar escalas.");
      return;
    }

    const totalMembers = Object.keys(scale.confirmations || {}).length;
    const confirmedMembers = Object.values(scale.confirmations || {}).filter(c => c.confirmed).length;

    Alert.alert(
      "Confirmar Escala",
      `Confirmar escala do evento "${scale.eventName}"?\n\n${confirmedMembers}/${totalMembers} membros confirmaram presença.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              setLoading(true);

              const scaleRef = doc(db, "churchBasico", "sistema", "eventos", scale.eventId, "escalas", "diaconato");
              await updateDoc(scaleRef, {
                scaleConfirmed: true,
                confirmedBy: user.uid,
                confirmedByName: userName,
                confirmedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });

              const eventRef = doc(db, "churchBasico", "sistema", "eventos", scale.eventId);
              await updateDoc(eventRef, {
                escalaDiaconato: "CONFIRMADA",
                updatedAt: serverTimestamp()
              });

              Alert.alert("Sucesso", "Escala confirmada com sucesso!");
              await onRefresh();

            } catch (error) {
              console.error("Erro ao confirmar escala:", error);
              Alert.alert("Erro", "Não foi possível confirmar a escala.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Deletar escala
  const deleteScale = (scale) => {
    if (!canCreateScales) {
      Alert.alert("Sem Permissão", "Você não pode excluir escalas.");
      return;
    }

    if (scale.createdBy !== user.uid && !isResponsavelGeral) {
      Alert.alert("Sem Permissão", "Você só pode excluir escalas criadas por você.");
      return;
    }

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

              const scaleRef = doc(db, "churchBasico", "sistema", "eventos", scale.eventId, "escalas", "diaconato");
              await deleteDoc(scaleRef);

              const eventRef = doc(db, "churchBasico", "sistema", "eventos", scale.eventId);
              const currentEvent = events.find(e => e.id === scale.eventId);
              const newTotalEscalas = Math.max(0, (currentEvent?.totalEscalas || 1) - 1);

              await updateDoc(eventRef, {
                escalaDiaconato: null,
                totalEscalas: newTotalEscalas,
                updatedAt: serverTimestamp()
              });

              Alert.alert("Sucesso", "Escala excluída com sucesso!");
              await onRefresh();
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

  // Abrir modal de confirmações
  const openConfirmationsModal = (scale) => {
    setSelectedScale(scale);
    setConfirmationModalVisible(true);
  };

  // Verificar se o usuário atual está escalado
  const isUserScaled = (scale) => {
    return scale.confirmations && scale.confirmations[user.uid];
  };

  // Verificar se o usuário já confirmou
  const hasUserConfirmed = (scale) => {
    return scale.confirmations && scale.confirmations[user.uid]?.confirmed;
  };

  // Renderizar seletor de função
  const renderFunctionSelector = (func) => {
    const members = scaleForm.functions[func.key] || [];
    const searchText = functionSearches[func.key] || "";
    const searchResults = functionSearchResults[func.key] || [];

    return (
      <View key={func.key} style={styles.functionContainer}>
        <Text style={styles.functionTitle}>
          <Ionicons name={func.icon} size={16} color="#B8986A" /> {func.name}
          {func.key === 'oferta' && <Text style={styles.autoConfirmNote}> (Confirmação automática)</Text>}
        </Text>

        {members.length > 0 && (
          <View style={styles.selectedMembersContainer}>
            {members.map((member) => (
              <View key={member.id || member.userId} style={styles.selectedMemberChip}>
                <Text style={styles.selectedMemberName}>{member.nome || member.name}</Text>
                <TouchableOpacity
                  onPress={() => removeMemberFromFunction(func.key, member.id || member.userId)}
                  style={styles.removeMemberChipButton}
                >
                  <Ionicons name="close" size={14} color="#ff4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {scaleForm.selectedTeam && (
          <View>
            <TextInput
              style={styles.functionSearchInput}
              placeholder={`Buscar membro para ${func.name}...`}
              value={searchText}
              onChangeText={(text) => searchMembersForFunction(func.key, text)}
            />

            {searchResults.length > 0 && (
              <View style={styles.functionSearchResults}>
                {searchResults.map((member) => (
                  <TouchableOpacity
                    key={member.id || member.userId}
                    style={styles.functionSearchResult}
                    onPress={() => addMemberToFunction(func.key, member)}
                  >
                    <Text style={styles.functionSearchResultText}>
                      {member.name || member.nome}
                    </Text>
                    <Ionicons name="add-circle" size={20} color="#B8986A" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {searchText.length >= 2 && searchResults.length === 0 && (
              <Text style={styles.noResultsText}>Nenhum membro encontrado</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  // Renderizar conteúdo de escalas
  const renderEscalasContent = () => (
    <View style={styles.escalasContainer}>
      {/* Header das escalas */}
      <View style={styles.escalasHeader}>
        <Text style={styles.escalasTitle}>Escalas do Diaconato</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
          >
            <Ionicons name="refresh" size={16} color="#666" />
            <Text style={styles.refreshButtonText}>Atualizar</Text>
          </TouchableOpacity>

          {canCreateScales && (
            <TouchableOpacity
              style={styles.createScaleButton}
              onPress={openCreateScaleModal}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.createScaleButtonText}>Criar Escala</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Info para diferentes tipos de usuário */}
      {isMember && (
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#4CAF50" />
          <Text style={styles.infoText}>
            Quando você for escalado em um evento, poderá confirmar sua presença aqui.
          </Text>
        </View>
      )}

      {/* Lista de Escalas */}
      <FlatList
        data={scales}
        keyExtractor={(item) => `${item.eventId}_${item.id}`}
        contentContainerStyle={styles.scalesList}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Nenhuma escala encontrada</Text>
            <Text style={styles.emptySubText}>
              {canCreateScales 
                ? "Crie escalas para organizar os times do diaconato nos eventos" 
                : "Escalas aparecerão aqui quando você for escalado"}
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const userScaled = isUserScaled(item);
          const userConfirmed = hasUserConfirmed(item);
          const totalConfirmations = Object.keys(item.confirmations || {}).length;
          const confirmedCount = Object.values(item.confirmations || {}).filter(c => c.confirmed).length;
          const confirmationRate = totalConfirmations > 0 ? (confirmedCount / totalConfirmations * 100).toFixed(0) : 0;

          return (
            <View style={styles.scaleCard}>
              <View style={styles.scaleHeader}>
                <View style={styles.scaleMainInfo}>
                  <Text style={styles.scaleTitle}>{item.eventName}</Text>
                  <Text style={styles.scaleDate}>{item.eventDate} - {item.eventTime}</Text>
                  <Text style={styles.scaleTeam}>
                    Time: {item.selectedTeam === 'teamA' ? 'Time A' : 'Time B'}
                  </Text>
                  
                  <View style={styles.scaleStatusContainer}>
                    <View style={[
                      styles.statusBadge,
                      item.scaleConfirmed ? styles.statusConfirmed : styles.statusPending
                    ]}>
                      <Text style={[
                        styles.statusText,
                        item.scaleConfirmed ? styles.statusConfirmedText : styles.statusPendingText
                      ]}>
                        {item.scaleConfirmed ? 'CONFIRMADA' : 'PENDENTE'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.confirmationProgress}>
                  <Text style={styles.confirmationText}>
                    {confirmedCount}/{totalConfirmations} confirmaram
                  </Text>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${confirmationRate}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressPercent}>{confirmationRate}%</Text>
                </View>
              </View>

              {/* Funções e Membros */}
              <View style={styles.scaleFunctions}>
                {availableFunctions.map((func) => {
                  const members = item.functions?.[func.key] || [];
                  if (members.length === 0) return null;

                  return (
                    <View key={func.key} style={styles.functionSummary}>
                      <Text style={styles.functionSummaryTitle}>
                        <Ionicons name={func.icon} size={14} color="#B8986A" /> {func.name}:
                      </Text>
                      <Text style={styles.functionSummaryMembers}>
                        {members.map(m => {
                          const memberConfirmed = item.confirmations?.[m.userId]?.confirmed;
                          return `${m.nome}${memberConfirmed ? ' ✓' : ' ⏳'}`;
                        }).join(', ')}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Observações */}
              {item.observations && (
                <View style={styles.observationsContainer}>
                  <Text style={styles.observationsText}>📝 {item.observations}</Text>
                </View>
              )}

              {/* Ações */}
              <View style={styles.scaleActions}>
                {userScaled && !userConfirmed && (
                  <TouchableOpacity
                    style={styles.confirmPresenceButton}
                    onPress={() => confirmPresence(item)}
                  >
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>Confirmar Presença</Text>
                  </TouchableOpacity>
                )}

                {userScaled && userConfirmed && (
                  <View style={styles.confirmedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#50C878" />
                    <Text style={styles.confirmedText}>Presença Confirmada</Text>
                  </View>
                )}

                {canCreateScales && (
                  <>
                    <TouchableOpacity
                      style={styles.viewConfirmationsButton}
                      onPress={() => openConfirmationsModal(item)}
                    >
                      <Ionicons name="people" size={16} color="#4CAF50" />
                      <Text style={styles.actionButtonText}>Ver Confirmações</Text>
                    </TouchableOpacity>

                    {(item.createdBy === user.uid || isResponsavelGeral) && (
                      <>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => openEditScaleModal(item)}
                        >
                          <Ionicons name="pencil" size={16} color="#B8986A" />
                          <Text style={styles.actionButtonText}>Editar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => deleteScale(item)}
                        >
                          <Ionicons name="trash" size={16} color="#ff4444" />
                          <Text style={styles.actionButtonText}>Excluir</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {!item.scaleConfirmed && (
                      <TouchableOpacity
                        style={styles.finalConfirmButton}
                        onPress={() => confirmFinalScale(item)}
                      >
                        <Ionicons name="shield-checkmark" size={16} color="#fff" />
                        <Text style={styles.actionButtonText}>Confirmar Escala</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
            </View>
          );
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Tabs - Mostrar aba de Dízimos para qualquer membro do diaconato */}
      {canAccessDizimos && (
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "escalas" && styles.activeTab]}
            onPress={() => setActiveTab("escalas")}
          >
            <Ionicons 
              name="calendar" 
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
            {/* Mostrar badge para qualquer membro que pode preencher */}
            {isMemberOfDiaconato && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>!</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Conteúdo baseado na aba ativa */}
      {activeTab === "escalas" && renderEscalasContent()}
      
      {activeTab === "dizimos" && canAccessDizimos && (
        <DiaconatoDizimos
          events={events}
          scales={scales}
          members={members}
          onRefresh={onRefresh}
          canCreateScales={canCreateScales}
          userRole={userRole}
          currentUserId={currentUserId}
        />
      )}

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
                    {item.escalaDiaconato && (
                      <View style={styles.eventHasScale}>
                        <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
                        <Text style={styles.eventHasScaleText}>
                          {item.escalaDiaconato === "CONFIRMADA" ? "Escala Confirmada" : 
                           item.escalaDiaconato === "PENDENTE" ? "Escala Pendente" : "Já tem escala"}
                        </Text>
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
                {editingScale ? "Editar Escala" : "Criar Escala"} - Diaconato
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

              {/* Seleção de Time */}
              <View style={styles.teamSelectionContainer}>
                <Text style={styles.sectionTitle}>Time:</Text>
                
                {allowedTeam ? (
                  <View style={styles.fixedTeamContainer}>
                    <Text style={styles.fixedTeamText}>
                      {allowedTeam === 'teamA' ? 'Time A' : 'Time B'} ({teams[allowedTeam]?.length || 0} membros)
                    </Text>
                    <Text style={styles.fixedTeamNote}>
                      Como líder, você só pode criar escalas para seu time.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.teamButtons}>
                    <TouchableOpacity
                      style={[
                        styles.teamButton,
                        scaleForm.selectedTeam === 'teamA' && styles.teamButtonActive
                      ]}
                      onPress={() => selectTeam('teamA')}
                    >
                      <Text style={[
                        styles.teamButtonText,
                        scaleForm.selectedTeam === 'teamA' && styles.teamButtonTextActive
                      ]}>
                        Time A ({teams.teamA?.length || 0} membros)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.teamButton,
                        scaleForm.selectedTeam === 'teamB' && styles.teamButtonActive
                      ]}
                      onPress={() => selectTeam('teamB')}
                    >
                      <Text style={[
                        styles.teamButtonText,
                        scaleForm.selectedTeam === 'teamB' && styles.teamButtonTextActive
                      ]}>
                        Time B ({teams.teamB?.length || 0} membros)
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Funções */}
              {scaleForm.selectedTeam && (
                <View style={styles.functionsContainer}>
                  <Text style={styles.sectionTitle}>Definir Funções:</Text>
                  <Text style={styles.functionsNote}>
                    O responsável pela oferta terá confirmação automática e poderá preencher relatórios de dízimos. 
                    Todos os outros precisarão confirmar presença.
                  </Text>
                  {availableFunctions.map((func) => renderFunctionSelector(func))}
                </View>
              )}

              {/* Observações */}
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

              {/* Botões do Modal */}
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

      {/* Modal de Confirmações */}
      <Modal
        visible={confirmationModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setConfirmationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Status de Confirmações</Text>
              <TouchableOpacity onPress={() => setConfirmationModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedScale && (
              <ScrollView>
                <Text style={styles.confirmationEventTitle}>
                  {selectedScale.eventName} - {selectedScale.eventDate}
                </Text>

                {Object.entries(selectedScale.confirmations || {}).map(([userId, confirmation]) => (
                  <View key={userId} style={styles.confirmationItem}>
                    <View style={styles.confirmationMemberInfo}>
                      <Text style={styles.confirmationMemberName}>{confirmation.memberName}</Text>
                      <Text style={styles.confirmationFunction}>{confirmation.functionName}</Text>
                    </View>
                    
                    <View style={styles.confirmationStatus}>
                      {confirmation.confirmed ? (
                        <View style={styles.confirmedStatus}>
                          <Ionicons name="checkmark-circle" size={20} color="#50C878" />
                          <Text style={styles.confirmedStatusText}>
                            {confirmation.autoConfirmed ? "Auto-confirmado" : "Confirmado"}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.pendingStatus}>
                          <Ionicons name="time" size={20} color="#FFA500" />
                          <Text style={styles.pendingStatusText}>Pendente</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#B8986A" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Tabs
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
    position: "relative",
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
  tabBadge: {
    position: "absolute",
    top: 8,
    right: "25%",
    backgroundColor: "#ff4444",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  tabBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },

  // Escalas Container
  escalasContainer: {
    flex: 1,
  },
  escalasHeader: {
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  escalasTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  headerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  infoCard: {
    backgroundColor: "#e8f5e8",
    margin: 15,
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#2e7d2e",
  },
  scalesList: {
    padding: 20,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
  },
  emptySubText: {
    textAlign: "center",
    color: "#aaa",
    fontSize: 14,
    marginTop: 8,
    maxWidth: 280,
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
    marginBottom: 15,
  },
  scaleMainInfo: {
    marginBottom: 10,
  },
  scaleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  scaleDate: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  scaleTeam: {
    fontSize: 14,
    color: "#B8986A",
    fontWeight: "600",
    marginTop: 4,
  },
  scaleStatusContainer: {
    alignSelf: "flex-start",
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusConfirmed: {
    backgroundColor: "#e8f5e8",
  },
  statusPending: {
    backgroundColor: "#fff3cd",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusConfirmedText: {
    color: "#50C878",
  },
  statusPendingText: {
    color: "#856404",
  },
  confirmationProgress: {
    alignItems: "center",
  },
  confirmationText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  progressBar: {
    width: 100,
    height: 6,
    backgroundColor: "#f0f0f0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
  },
  progressPercent: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
  },
  scaleFunctions: {
    marginBottom: 15,
  },
  functionSummary: {
    marginBottom: 8,
  },
  functionSummaryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  functionSummaryMembers: {
    fontSize: 13,
    color: "#555",
    paddingLeft: 20,
  },
  observationsContainer: {
    marginBottom: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  observationsText: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
  },
  scaleActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    gap: 8,
  },
  confirmPresenceButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
    flex: 1,
    justifyContent: "center",
  },
  confirmedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e8",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
    flex: 1,
    justifyContent: "center",
  },
  confirmedText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#50C878",
  },
  viewConfirmationsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e8",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
    flex: 1,
    justifyContent: "center",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f0f8ff",
    gap: 4,
    flex: 1,
    justifyContent: "center",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#ffe6e6",
    gap: 4,
    flex: 1,
    justifyContent: "center",
  },
  finalConfirmButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#B8986A",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
    flex: 1,
    justifyContent: "center",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
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
    width: "95%",
    maxHeight: "90%",
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
  teamSelectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  fixedTeamContainer: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#B8986A",
  },
  fixedTeamText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#B8986A",
    marginBottom: 5,
  },
  fixedTeamNote: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  teamButtons: {
    flexDirection: "row",
    gap: 10,
  },
  teamButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  teamButtonActive: {
    borderColor: "#B8986A",
    backgroundColor: "#f8f6f3",
  },
  teamButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  teamButtonTextActive: {
    color: "#B8986A",
  },
  functionsContainer: {
    marginBottom: 20,
  },
  functionsNote: {
    fontSize: 13,
    color: "#666",
    marginBottom: 15,
    fontStyle: "italic",
    backgroundColor: "#f0f8ff",
    padding: 10,
    borderRadius: 6,
  },
  functionContainer: {
    marginBottom: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
  },
  functionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  autoConfirmNote: {
    fontSize: 11,
    color: "#4CAF50",
    fontStyle: "italic",
  },
  selectedMembersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  selectedMemberChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#B8986A",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 6,
  },
  selectedMemberName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  removeMemberChipButton: {
    padding: 2,
  },
  functionSearchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  functionSearchResults: {
    maxHeight: 120,
    backgroundColor: "#fff",
    borderRadius: 6,
    marginTop: 5,
    borderWidth: 1,
    borderColor: "#eee",
  },
  functionSearchResult: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  functionSearchResultText: {
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
  confirmationEventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  confirmationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 8,
  },
  confirmationMemberInfo: {
    flex: 1,
  },
  confirmationMemberName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  confirmationFunction: {
    fontSize: 12,
    color: "#666",
  },
  confirmationStatus: {
    alignItems: "flex-end",
  },
  confirmedStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  confirmedStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#50C878",
  },
  pendingStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  pendingStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFA500",
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