// MinisterioKidsAmdin.js
// MinisterioKidsAdmin.js - Atualizado
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

export default function MinisterioKidsAdmin({ navigation }) {
  const { user, userData } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Estados do Dashboard
  const [allChildren, setAllChildren] = useState([]);
  const [checkedInChildren, setCheckedInChildren] = useState([]);
  
  // Estados do Check-in
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Estados dos Eventos
  const [events, setEvents] = useState([]);
  const [scaleModalVisible, setScaleModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [scaleForm, setScaleForm] = useState({
    responsible: "",
    helpers: "",
    observations: ""
  });

  // Estados do Cadastro de Criança
  const [childModalVisible, setChildModalVisible] = useState(false);
  const [editingChild, setEditingChild] = useState(null);
  const [childForm, setChildForm] = useState({
    nome: "",
    idade: "",
    sexo: "",
    nomePai: "",
    nomeMae: "",
    temNecessidadesEspeciais: false,
    necessidadesEspeciais: "",
    temSeletividadeAlimentar: false,
    seletividadeAlimentar: "",
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
        loadAllChildren(),
        loadCheckedInChildren(),
        loadEvents()
      ]);
    } catch (error) {
      console.log("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar todas as crianças cadastradas
  const loadAllChildren = async () => {
    try {
      const childrenRef = collection(db, "churchBasico", "users", "filhos");
      const querySnapshot = await getDocs(childrenRef);
      
      const childrenData = [];
      querySnapshot.forEach((doc) => {
        childrenData.push({ id: doc.id, ...doc.data() });
      });
      
      setAllChildren(childrenData);
      console.log("Total de crianças cadastradas:", childrenData.length);
    } catch (error) {
      console.log("Erro ao carregar crianças:", error);
    }
  };

  // Carregar crianças que fizeram check-in hoje
  const loadCheckedInChildren = async () => {
    try {
      const today = new Date().toDateString();
      const checkinRef = collection(db, "churchBasico", "ministerios", "conteudo", "kids", "checkins");
      const q = query(checkinRef, where("date", "==", today), where("status", "==", "checked-in"));
      const querySnapshot = await getDocs(q);
      
      const checkedInData = [];
      querySnapshot.forEach((doc) => {
        checkedInData.push({ id: doc.id, ...doc.data() });
      });
      
      setCheckedInChildren(checkedInData);
      console.log("Crianças presentes hoje:", checkedInData.length);
    } catch (error) {
      console.log("Erro ao carregar check-ins:", error);
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

  // Buscar crianças para check-in
  const searchChildren = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const filteredChildren = allChildren.filter(child =>
        child.nome.toLowerCase().includes(query.toLowerCase()) &&
        !checkedInChildren.some(checkedIn => checkedIn.childId === child.id)
      );
      setSearchResults(filteredChildren);
    } catch (error) {
      console.log("Erro na busca:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Fazer check-in de uma criança
  const checkInChild = async (child) => {
    try {
      setLoading(true);
      const today = new Date().toDateString();
      const now = new Date();
      
      const checkinData = {
        childId: child.id,
        childName: child.nome,
        nomePai: child.nomePai || "",
        nomeMae: child.nomeMae || "",
        date: today,
        checkInTime: now,
        status: "checked-in",
        leaderId: user.uid,
        leaderName: userName,
        createdAt: serverTimestamp()
      };

      const checkinId = `${child.id}_${Date.now()}`;
      await setDoc(doc(db, "churchBasico", "ministerios", "conteudo", "kids", "checkins", checkinId), checkinData);
      
      Alert.alert("Sucesso", `${child.nome} fez check-in com sucesso!`);
      setSearchQuery("");
      setSearchResults([]);
      await loadCheckedInChildren();
    } catch (error) {
      console.log("Erro no check-in:", error);
      Alert.alert("Erro", "Não foi possível fazer o check-in");
    } finally {
      setLoading(false);
    }
  };

  // Fazer check-out de uma criança
  const checkOutChild = async (checkedInChild) => {
    Alert.alert(
      "Confirmar Check-out",
      `Confirma a saída de ${checkedInChild.childName}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              setLoading(true);
              const now = new Date();
              
              await updateDoc(doc(db, "churchBasico", "ministerios", "conteudo", "kids", "checkins", checkedInChild.id), {
                status: "checked-out",
                checkOutTime: now,
                updatedAt: serverTimestamp()
              });
              
              Alert.alert("Sucesso", `${checkedInChild.childName} fez check-out com sucesso!`);
              await loadCheckedInChildren();
            } catch (error) {
              console.log("Erro no check-out:", error);
              Alert.alert("Erro", "Não foi possível fazer o check-out");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Abrir modal de criar escala
  const openScaleModal = (event) => {
    setSelectedEvent(event);
    setScaleModalVisible(true);
  };

  // Salvar escala do Kids
  const saveScale = async () => {
    if (!scaleForm.responsible.trim()) {
      Alert.alert("Erro", "Por favor, preencha pelo menos o responsável");
      return;
    }

    try {
      setLoading(true);
      
      const scaleData = {
        eventId: selectedEvent.id,
        eventName: selectedEvent.nome,
        ministry: "kids",
        responsible: scaleForm.responsible.trim(),
        helpers: scaleForm.helpers.trim(),
        observations: scaleForm.observations.trim(),
        createdBy: user.uid,
        createdByName: userName,
        createdAt: serverTimestamp(),
        isActive: true
      };

      const scaleId = `kids_${selectedEvent.id}_${Date.now()}`;
      await setDoc(doc(db, "churchBasico", "sistema", "escalas", scaleId), scaleData);
      
      Alert.alert("Sucesso", "Escala do Kids criada com sucesso!");
      setScaleModalVisible(false);
      resetScaleForm();
    } catch (error) {
      console.log("Erro ao salvar escala:", error);
      Alert.alert("Erro", "Não foi possível salvar a escala");
    } finally {
      setLoading(false);
    }
  };

  const resetScaleForm = () => {
    setScaleForm({
      responsible: "",
      helpers: "",
      observations: ""
    });
    setSelectedEvent(null);
  };

  // Funções do Cadastro de Criança
  const resetChildForm = () => {
    setChildForm({
      nome: "",
      idade: "",
      sexo: "",
      nomePai: "",
      nomeMae: "",
      temNecessidadesEspeciais: false,
      necessidadesEspeciais: "",
      temSeletividadeAlimentar: false,
      seletividadeAlimentar: "",
    });
    setEditingChild(null);
  };

  const openAddChildModal = () => {
    resetChildForm();
    setChildModalVisible(true);
  };

  const openEditChildModal = (child) => {
    setChildForm({
      nome: child.nome || "",
      idade: child.idade || "",
      sexo: child.sexo || "",
      nomePai: child.nomePai || "",
      nomeMae: child.nomeMae || "",
      temNecessidadesEspeciais: child.temNecessidadesEspeciais || false,
      necessidadesEspeciais: child.necessidadesEspeciais || "",
      temSeletividadeAlimentar: child.temSeletividadeAlimentar || false,
      seletividadeAlimentar: child.seletividadeAlimentar || "",
    });
    setEditingChild(child);
    setChildModalVisible(true);
  };

  const saveChild = async () => {
    if (!childForm.nome.trim() || !childForm.idade.trim() || !childForm.sexo.trim()) {
      Alert.alert("Erro", "Por favor, preencha os campos obrigatórios (Nome, Idade e Sexo)");
      return;
    }

    if (!childForm.nomePai.trim() && !childForm.nomeMae.trim()) {
      Alert.alert("Erro", "Por favor, preencha pelo menos o nome do pai ou da mãe");
      return;
    }

    try {
      setLoading(true);
      
      const childData = {
        nome: childForm.nome.trim(),
        idade: childForm.idade.trim(),
        sexo: childForm.sexo,
        nomePai: childForm.nomePai.trim(),
        nomeMae: childForm.nomeMae.trim(),
        temNecessidadesEspeciais: childForm.temNecessidadesEspeciais,
        necessidadesEspeciais: childForm.temNecessidadesEspeciais ? childForm.necessidadesEspeciais.trim() : "",
        temSeletividadeAlimentar: childForm.temSeletividadeAlimentar,
        seletividadeAlimentar: childForm.temSeletividadeAlimentar ? childForm.seletividadeAlimentar.trim() : "",
        registeredBy: user.uid,
        registeredByName: userName,
        createdAt: editingChild ? editingChild.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const childId = editingChild ? editingChild.id : `child_${Date.now()}`;
      const childRef = doc(db, "churchBasico", "users", "filhos", childId);

      if (editingChild) {
        await updateDoc(childRef, childData);
        Alert.alert("Sucesso", "Dados da criança atualizados com sucesso!");
      } else {
        await setDoc(childRef, childData);
        Alert.alert("Sucesso", "Criança cadastrada com sucesso!");
      }

      setChildModalVisible(false);
      resetChildForm();
      await loadAllChildren();

    } catch (error) {
      console.log("Erro ao salvar criança:", error);
      Alert.alert("Erro", `Não foi possível salvar os dados: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteChild = (child) => {
    Alert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja excluir ${child.nome}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await deleteDoc(doc(db, "churchBasico", "users", "filhos", child.id));
              Alert.alert("Sucesso", "Criança removida com sucesso!");
              await loadAllChildren();
            } catch (error) {
              console.log("Erro ao excluir criança:", error);
              Alert.alert("Erro", "Não foi possível excluir. Tente novamente.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const CheckBox = ({ checked, onPress, label }) => (
    <TouchableOpacity style={styles.checkboxContainer} onPress={onPress}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={16} color="#fff" />}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const getChildrenStats = () => {
    const boys = allChildren.filter(child => child.sexo === "Masculino").length;
    const girls = allChildren.filter(child => child.sexo === "Feminino").length;
    return { total: allChildren.length, boys, girls };
  };

  const renderDashboard = () => {
    const stats = getChildrenStats();
    
    return (
      <View style={styles.tabContent}>
        <Text style={styles.tabTitle}>Dashboard - Ministério Kids</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color="#B8986A" />
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total de Crianças</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="male" size={24} color="#4A90E2" />
            <Text style={styles.statNumber}>{stats.boys}</Text>
            <Text style={styles.statLabel}>Meninos</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="female" size={24} color="#E24A90" />
            <Text style={styles.statNumber}>{stats.girls}</Text>
            <Text style={styles.statLabel}>Meninas</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color="#50C878" />
            <Text style={styles.statNumber}>{checkedInChildren.length}</Text>
            <Text style={styles.statLabel}>Presentes Hoje</Text>
          </View>
        </View>

        {/* Botão Cadastrar Criança */}
        <TouchableOpacity style={styles.addChildButton} onPress={openAddChildModal}>
          <Ionicons name="person-add" size={20} color="#fff" />
          <Text style={styles.addChildButtonText}>Cadastrar Criança</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Crianças Cadastradas</Text>
        
        <FlatList
          data={allChildren}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>Nenhuma criança cadastrada ainda</Text>
          )}
          renderItem={({ item }) => (
            <View style={styles.childItem}>
              <View style={styles.childInfo}>
                <Text style={styles.childName}>{item.nome}</Text>
                <Text style={styles.childDetails}>
                  {item.idade} anos • {item.sexo}
                </Text>
                {item.nomePai && (
                  <Text style={styles.parentName}>Pai: {item.nomePai}</Text>
                )}
                {item.nomeMae && (
                  <Text style={styles.parentName}>Mãe: {item.nomeMae}</Text>
                )}
                {item.temNecessidadesEspeciais && (
                  <Text style={styles.specialNeed}>⚠️ Necessidades especiais</Text>
                )}
              </View>
              <View style={styles.childActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openEditChildModal(item)}
                >
                  <Ionicons name="pencil" size={16} color="#B8986A" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => deleteChild(item)}
                >
                  <Ionicons name="trash" size={16} color="#ff4444" />
                </TouchableOpacity>
                <View style={styles.statusIndicator}>
                  {checkedInChildren.some(child => child.childId === item.id) ? (
                    <Ionicons name="checkmark-circle" size={20} color="#50C878" />
                  ) : (
                    <Ionicons name="ellipse-outline" size={20} color="#ccc" />
                  )}
                </View>
              </View>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

  const renderCheckin = () => (
    <FlatList
      style={styles.tabContent}
      data={checkedInChildren}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={() => (
        <View>
          <Text style={styles.tabTitle}>Check-in / Check-out</Text>
          
          <View style={styles.searchContainer}>
            <Text style={styles.sectionTitle}>Buscar Criança para Check-in</Text>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Digite o nome da criança..."
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  searchChildren(text);
                }}
              />
            </View>
            
            {isSearching && <ActivityIndicator size="small" color="#B8986A" />}
            
            {searchResults.length > 0 && (
              <View style={styles.searchResults}>
                {searchResults.map((child) => (
                  <TouchableOpacity
                    key={child.id}
                    style={styles.searchResultItem}
                    onPress={() => checkInChild(child)}
                  >
                    <View style={styles.childInfo}>
                      <Text style={styles.childName}>{child.nome}</Text>
                      <Text style={styles.childDetails}>
                        {child.idade} anos • {child.sexo}
                      </Text>
                      {child.nomePai && (
                        <Text style={styles.parentName}>Pai: {child.nomePai}</Text>
                      )}
                      {child.nomeMae && (
                        <Text style={styles.parentName}>Mãe: {child.nomeMae}</Text>
                      )}
                    </View>
                    <Ionicons name="add-circle-outline" size={24} color="#B8986A" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <Text style={styles.sectionTitle}>
            Crianças no Kids Hoje ({checkedInChildren.length})
          </Text>
        </View>
      )}
      ListEmptyComponent={() => (
        <Text style={styles.emptyText}>Nenhuma criança presente hoje</Text>
      )}
      renderItem={({ item }) => (
        <View style={styles.checkedInItem}>
          <View style={styles.childInfo}>
            <Text style={styles.childName}>{item.childName}</Text>
            <Text style={styles.childDetails}>
              Check-in: {new Date(item.checkInTime.toDate()).toLocaleTimeString()}
            </Text>
            {item.nomePai && (
              <Text style={styles.parentName}>Pai: {item.nomePai}</Text>
            )}
            {item.nomeMae && (
              <Text style={styles.parentName}>Mãe: {item.nomeMae}</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={() => checkOutChild(item)}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.checkoutButtonText}>Check-out</Text>
          </TouchableOpacity>
        </View>
      )}
      showsVerticalScrollIndicator={false}
    />
  );

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
        <Text style={styles.headerTitle}>Kids - Admin</Text>
        <Text style={styles.leaderName}>{userName}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "dashboard" && styles.activeTab]}
          onPress={() => setActiveTab("dashboard")}
        >
          <Ionicons 
            name="analytics" 
            size={20} 
            color={activeTab === "dashboard" ? "#B8986A" : "#666"} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === "dashboard" && styles.activeTabText
          ]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "checkin" && styles.activeTab]}
          onPress={() => setActiveTab("checkin")}
        >
          <Ionicons 
            name="checkmark-circle" 
            size={20} 
            color={activeTab === "checkin" ? "#B8986A" : "#666"} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === "checkin" && styles.activeTabText
          ]}>
            Check-in
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

        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "checkin" && renderCheckin()}
        {activeTab === "events" && renderEvents()}
      </View>

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
              <Text style={styles.modalTitle}>Criar Escala - Kids</Text>
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
                <Text style={styles.label}>Responsável: *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nome do responsável pelo Kids"
                  value={scaleForm.responsible}
                  onChangeText={(text) => setScaleForm({ ...scaleForm, responsible: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Auxiliares:</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Liste os auxiliares (separados por vírgula)"
                  value={scaleForm.helpers}
                  onChangeText={(text) => setScaleForm({ ...scaleForm, helpers: text })}
                  multiline
                  numberOfLines={3}
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

      {/* Modal de Cadastro/Edição de Criança */}
      <Modal
        visible={childModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setChildModalVisible(false);
          resetChildForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingChild ? "Editar Criança" : "Cadastrar Criança"}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setChildModalVisible(false);
                    resetChildForm();
                  }}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Nome */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome da Criança: *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite o nome da criança"
                  value={childForm.nome}
                  onChangeText={(text) => setChildForm({ ...childForm, nome: text })}
                />
              </View>

              {/* Idade */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Idade: *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite a idade"
                  value={childForm.idade}
                  onChangeText={(text) => setChildForm({ ...childForm, idade: text })}
                  keyboardType="numeric"
                />
              </View>

              {/* Sexo */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Sexo: *</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setChildForm({ ...childForm, sexo: "Masculino" })}
                  >
                    <View style={[
                      styles.radio,
                      childForm.sexo === "Masculino" && styles.radioSelected
                    ]} />
                    <Text style={styles.radioLabel}>Masculino</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setChildForm({ ...childForm, sexo: "Feminino" })}
                  >
                    <View style={[
                      styles.radio,
                      childForm.sexo === "Feminino" && styles.radioSelected
                    ]} />
                    <Text style={styles.radioLabel}>Feminino</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Nome do Pai */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome do Pai:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite o nome do pai"
                  value={childForm.nomePai}
                  onChangeText={(text) => setChildForm({ ...childForm, nomePai: text })}
                />
              </View>

              {/* Nome da Mãe */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome da Mãe:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite o nome da mãe"
                  value={childForm.nomeMae}
                  onChangeText={(text) => setChildForm({ ...childForm, nomeMae: text })}
                />
              </View>

              <Text style={styles.note}>
                * Pelo menos o nome do pai ou da mãe deve ser preenchido
              </Text>

              {/* Necessidades Especiais */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tem Necessidades Especiais?</Text>
                <View style={styles.checkboxRow}>
                  <CheckBox
                    checked={childForm.temNecessidadesEspeciais}
                    onPress={() => setChildForm({
                      ...childForm,
                      temNecessidadesEspeciais: !childForm.temNecessidadesEspeciais,
                      necessidadesEspeciais: !childForm.temNecessidadesEspeciais ? "" : childForm.necessidadesEspeciais
                    })}
                    label="Sim"
                  />
                  <CheckBox
                    checked={!childForm.temNecessidadesEspeciais}
                    onPress={() => setChildForm({
                      ...childForm,
                      temNecessidadesEspeciais: false,
                      necessidadesEspeciais: ""
                    })}
                    label="Não"
                  />
                </View>
                
                {childForm.temNecessidadesEspeciais && (
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Descreva as necessidades especiais"
                    value={childForm.necessidadesEspeciais}
                    onChangeText={(text) => setChildForm({ ...childForm, necessidadesEspeciais: text })}
                    multiline
                    numberOfLines={3}
                  />
                )}
              </View>

              {/* Seletividade Alimentar */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tem alguma Seletividade Alimentar?</Text>
                <View style={styles.checkboxRow}>
                  <CheckBox
                    checked={childForm.temSeletividadeAlimentar}
                    onPress={() => setChildForm({
                      ...childForm,
                      temSeletividadeAlimentar: !childForm.temSeletividadeAlimentar,
                      seletividadeAlimentar: !childForm.temSeletividadeAlimentar ? "" : childForm.seletividadeAlimentar
                    })}
                    label="Sim"
                  />
                  <CheckBox
                    checked={!childForm.temSeletividadeAlimentar}
                    onPress={() => setChildForm({
                      ...childForm,
                      temSeletividadeAlimentar: false,
                      seletividadeAlimentar: ""
                    })}
                    label="Não"
                  />
                </View>
                
                {childForm.temSeletividadeAlimentar && (
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Descreva a seletividade alimentar"
                    value={childForm.seletividadeAlimentar}
                    onChangeText={(text) => setChildForm({ ...childForm, seletividadeAlimentar: text })}
                    multiline
                    numberOfLines={3}
                  />
                )}
              </View>

              {/* Botões */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setChildModalVisible(false);
                    resetChildForm();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={saveChild}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {editingChild ? "Atualizar" : "Salvar"}
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
  addChildButton: {
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
  addChildButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  childItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  childDetails: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  parentName: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  specialNeed: {
    fontSize: 12,
    color: "#B8986A",
    marginTop: 2,
  },
  childActions: {
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
  statusIndicator: {
    padding: 5,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 10,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 10,
    fontSize: 16,
  },
  searchResults: {
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 2,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  checkedInItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff6b6b",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 5,
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
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
  radioGroup: {
    flexDirection: "row",
    gap: 20,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ddd",
    marginRight: 8,
  },
  radioSelected: {
    borderColor: "#B8986A",
    backgroundColor: "#B8986A",
  },
  radioLabel: {
    fontSize: 14,
    color: "#333",
  },
  checkboxRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 10,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#ddd",
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#B8986A",
    borderColor: "#B8986A",
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#333",
  },
  note: {
    fontSize: 12,
    color: "#B8986A",
    fontStyle: "italic",
    marginBottom: 15,
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