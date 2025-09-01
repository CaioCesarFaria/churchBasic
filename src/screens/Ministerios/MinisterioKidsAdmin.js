// MinisterioKidsAmdin.js
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
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: ""
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

  // Carregar eventos
  const loadEvents = async () => {
    try {
      const eventsRef = collection(db, "churchBasico", "ministerios", "conteudo", "kids", "events");
      const q = query(eventsRef, orderBy("createdAt", "desc"));
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
        parentId: child.parentId,
        parentName: child.parentName,
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

  // Salvar evento
  const saveEvent = async () => {
    if (!eventForm.title.trim() || !eventForm.date.trim()) {
      Alert.alert("Erro", "Por favor, preencha pelo menos o título e a data");
      return;
    }

    try {
      setLoading(true);
      
      const eventData = {
        ...eventForm,
        title: eventForm.title.trim(),
        description: eventForm.description.trim(),
        createdBy: user.uid,
        createdByName: userName,
        createdAt: serverTimestamp(),
        isActive: true
      };

      const eventId = `event_${Date.now()}`;
      await setDoc(doc(db, "churchBasico", "ministerios", "conteudo", "kids", "events", eventId), eventData);
      
      Alert.alert("Sucesso", "Evento criado com sucesso!");
      setEventModalVisible(false);
      resetEventForm();
      await loadEvents();
    } catch (error) {
      console.log("Erro ao salvar evento:", error);
      Alert.alert("Erro", "Não foi possível salvar o evento");
    } finally {
      setLoading(false);
    }
  };

  const resetEventForm = () => {
    setEventForm({
      title: "",
      description: "",
      date: "",
      time: "",
      location: ""
    });
  };

  const deleteEvent = async (eventId) => {
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja excluir este evento?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await deleteDoc(doc(db, "churchBasico", "ministerios", "conteudo", "kids", "events", eventId));
              Alert.alert("Sucesso", "Evento excluído com sucesso!");
              await loadEvents();
            } catch (error) {
              console.log("Erro ao excluir evento:", error);
              Alert.alert("Erro", "Não foi possível excluir o evento");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const getChildrenStats = () => {
    const boys = allChildren.filter(child => child.sexo === "Masculino").length;
    const girls = allChildren.filter(child => child.sexo === "Feminino").length;
    return { total: allChildren.length, boys, girls };
  };

  const renderDashboard = () => {
    const stats = getChildrenStats();
    
    return (
      <FlatList
        style={styles.tabContent}
        data={allChildren} // Usar apenas os dados das crianças
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <View>
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

            <Text style={styles.sectionTitle}>Crianças Cadastradas</Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>Nenhuma criança cadastrada ainda</Text>
        )}
        renderItem={({ item }) => (
          <View style={styles.childItem}>
            <View style={styles.childInfo}>
              <Text style={styles.childName}>{item.nome}</Text>
              <Text style={styles.childDetails}>
                {item.idade} anos • {item.sexo} • {item.parentName}
              </Text>
              {item.temNecessidadesEspeciais && (
                <Text style={styles.specialNeed}>⚠️ Necessidades especiais</Text>
              )}
            </View>
            <View style={styles.statusIndicator}>
              {checkedInChildren.some(child => child.childId === item.id) ? (
                <Ionicons name="checkmark-circle" size={20} color="#50C878" />
              ) : (
                <Ionicons name="ellipse-outline" size={20} color="#ccc" />
              )}
            </View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
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
                        {child.idade} anos • {child.sexo} • {child.parentName}
                      </Text>
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
            <Text style={styles.parentName}>Responsável: {item.parentName}</Text>
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
          <Text style={styles.tabTitle}>Eventos Kids</Text>
          <TouchableOpacity
            style={styles.addEventButton}
            onPress={() => setEventModalVisible(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addEventButtonText}>Novo Evento</Text>
          </TouchableOpacity>
        </View>
      )}
      ListEmptyComponent={() => (
        <Text style={styles.emptyText}>Nenhum evento cadastrado ainda</Text>
      )}
      renderItem={({ item }) => (
        <View style={styles.eventItem}>
          <View style={styles.eventContent}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            {item.description && (
              <Text style={styles.eventDescription}>{item.description}</Text>
            )}
            <View style={styles.eventDetails}>
              {item.date && (
                <Text style={styles.eventDetail}>📅 {item.date}</Text>
              )}
              {item.time && (
                <Text style={styles.eventDetail}>⏰ {item.time}</Text>
              )}
              {item.location && (
                <Text style={styles.eventDetail}>📍 {item.location}</Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={styles.deleteEventButton}
            onPress={() => deleteEvent(item.id)}
          >
            <Ionicons name="trash" size={16} color="#ff4444" />
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

      {/* Modal de Novo Evento */}
      <Modal
        visible={eventModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setEventModalVisible(false);
          resetEventForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Evento Kids</Text>
              <TouchableOpacity
                onPress={() => {
                  setEventModalVisible(false);
                  resetEventForm();
                }}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Título do Evento: *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite o título do evento"
                  value={eventForm.title}
                  onChangeText={(text) => setEventForm({ ...eventForm, title: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Descrição:</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Descreva o evento"
                  value={eventForm.description}
                  onChangeText={(text) => setEventForm({ ...eventForm, description: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Data: *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 15/12/2024"
                  value={eventForm.date}
                  onChangeText={(text) => setEventForm({ ...eventForm, date: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Horário:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 9h00"
                  value={eventForm.time}
                  onChangeText={(text) => setEventForm({ ...eventForm, time: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Local:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Sala Kids"
                  value={eventForm.location}
                  onChangeText={(text) => setEventForm({ ...eventForm, location: text })}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setEventModalVisible(false);
                    resetEventForm();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={saveEvent}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Salvar Evento</Text>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  addEventButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#B8986A",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 5,
  },
  addEventButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  eventItem: {
    flexDirection: "row",
    justifyContent: "space-between",
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
    marginBottom: 5,
  },
  eventDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  eventDetails: {
    gap: 5,
  },
  eventDetail: {
    fontSize: 12,
    color: "#999",
  },
  deleteEventButton: {
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
    maxHeight: "80%",
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
  }});