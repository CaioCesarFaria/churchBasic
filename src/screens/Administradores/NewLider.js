// NewLider.js - VERSÃO SEM PICKER (Resolve erro de component)
import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../Firebase/FirebaseConfig";
import { AuthContext } from "../../context/AuthContext";

export default function NewLider({ navigation }) {
  const { user: currentUser, userData: currentUserData } = useContext(AuthContext);
  const [ministerio, setMinisterio] = useState("");
  const [ministerioModalVisible, setMinisterioModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [existingLeaders, setExistingLeaders] = useState([]);

  const ministeriosFixos = [
    "ABBA Kids",
    "ABBA School", 
    "Comunicação",
    "Conexão",
    "Matilha",
    "Célula",
    "Ministério de Casais",
    "Ministério de Mulheres",
    "Intercessão",
    "Diaconato",
    "Louvor",
    "Batismo",
  ];

  // Carregar usuários e líderes existentes ao iniciar
  useEffect(() => {
    loadUsersAndLeaders();
  }, []);

  const loadUsersAndLeaders = async () => {
    try {
      setLoading(true);
      
      console.log("Carregando usuários e líderes...");
      
      // Carregar usuários cadastrados
      const usersRef = collection(db, "churchBasico", "users", "members");
      const usersSnapshot = await getDocs(usersRef);
      const usersData = [];
      
      usersSnapshot.forEach((doc) => {
        const userData = { id: doc.id, ...doc.data() };
        usersData.push(userData);
      });
      
      console.log(`${usersData.length} usuários encontrados`);
      setAllUsers(usersData);

      // Carregar líderes existentes
      const leadersRef = collection(db, "churchBasico", "users", "lideres");
      const leadersSnapshot = await getDocs(leadersRef);
      const leadersData = [];
      
      leadersSnapshot.forEach((doc) => {
        const leaderData = { id: doc.id, ...doc.data() };
        leadersData.push(leaderData);
      });
      
      console.log(`${leadersData.length} líderes encontrados`);
      setExistingLeaders(leadersData);
      
    } catch (error) {
      console.log("Erro ao carregar dados:", error);
      Alert.alert("Erro", "Não foi possível carregar os usuários. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Buscar usuários conforme o texto digitado
  const searchUsers = (text) => {
    setSearchText(text);
    
    if (!text.trim() || text.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    
    // Filtrar usuários localmente
    const filtered = allUsers.filter(user => {
      // Verificar se já é líder
      const isAlreadyLeader = existingLeaders.some(leader => 
        leader.uid === user.uid || leader.email === user.email
      );
      
      if (isAlreadyLeader) return false;
      
      // Filtrar por nome (case insensitive)
      return user.name && user.name.toLowerCase().includes(text.toLowerCase());
    });

    console.log(`Busca por "${text}": ${filtered.length} resultados`);
    setSearchResults(filtered);
    setSearching(false);
  };

  // Debounce para otimizar a busca
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchText) {
        searchUsers(searchText);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchText, allUsers, existingLeaders]);

  const cleanMinistryName = (name) => {
    if (!name) return '';
    name = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    name = name.replace(/[^a-zA-Z0-9]/g, '');
    name = name.charAt(0).toUpperCase() + name.slice(1);
    return name;
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearchText(user.name);
    setSearchResults([]);
    console.log("Usuário selecionado:", user.name);
  };

  const handleClearSelection = () => {
    setSelectedUser(null);
    setSearchText("");
    setSearchResults([]);
  };

  const handleSelectMinisterio = (ministerioSelected) => {
    setMinisterio(ministerioSelected);
    setMinisterioModalVisible(false);
    console.log("Ministério selecionado:", ministerioSelected);
  };

  const validateForm = () => {
    if (!ministerio) {
      Alert.alert("Erro", "Por favor, selecione um ministério");
      return false;
    }

    if (!selectedUser) {
      Alert.alert("Erro", "Por favor, selecione um usuário para ser líder");
      return false;
    }

    return true;
  };

  const handlePromoteToLeader = async () => {
    console.log("=== INICIANDO PROMOÇÃO A LÍDER ===");
    
    if (!validateForm()) return;
    
    if (!currentUser || !currentUserData) {
      Alert.alert("Erro", "Sessão administrativa perdida. Faça login novamente.");
      return;
    }

    setLoading(true);

    try {
      const ministerioCleaned = cleanMinistryName(ministerio);
      const pageRouteName = `Ministerio${ministerioCleaned}Admin`;
      
      console.log("Dados da promoção:");
      console.log("- Usuário:", selectedUser.name);
      console.log("- Email:", selectedUser.email);
      console.log("- Ministério:", ministerio);
      console.log("- Rota da página:", pageRouteName);

      // Criar dados do líder baseados no usuário existente
      const leaderData = {
        // Dados do usuário original
        uid: selectedUser.uid || selectedUser.id,
        name: selectedUser.name,
        email: selectedUser.email,
        phone: selectedUser.phone || null,
        birthDate: selectedUser.birthDate || null,
        
        // Dados específicos de líder
        ministerio: ministerio,
        userType: "admin",
        isLeader: true,
        page: pageRouteName,
        
        // Dados de controle
        promotedAt: serverTimestamp(),
        promotedBy: currentUser.uid,
        promotedByName: currentUserData.name || "Admin Master",
        originalUserType: "member",
        createdAt: selectedUser.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Salvar na coleção de líderes
      const leaderRef = doc(db, "churchBasico", "users", "lideres", selectedUser.uid || selectedUser.id);
      await setDoc(leaderRef, leaderData);
      
      console.log("Líder salvo com sucesso!");

      // Marcar o usuário original como promovido
      if (selectedUser.uid) {
        const originalUserRef = doc(db, "churchBasico", "users", "members", selectedUser.uid);
        await updateDoc(originalUserRef, {
          isPromotedToLeader: true,
          promotedAt: serverTimestamp(),
          promotedToMinistry: ministerio,
          updatedAt: serverTimestamp(),
        });
        console.log("Usuário original marcado como promovido");
      }

      Alert.alert(
        "Sucesso!", 
        `${selectedUser.name} foi promovido(a) a líder do ministério ${ministerio}!`,
        [
          {
            text: "OK",
            onPress: () => {
              // Resetar formulário
              setMinisterio("");
              setSearchText("");
              setSelectedUser(null);
              setSearchResults([]);
              
              // Voltar para AdminMaster
              navigation.navigate("AdminMaster");
            },
          },
        ]
      );

    } catch (error) {
      console.log("=== ERRO NA PROMOÇÃO ===");
      console.log("Código do erro:", error.code);
      console.log("Mensagem:", error.message);
      
      Alert.alert(
        "Erro", 
        `Não foi possível promover o usuário a líder.\n\nDetalhes: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleSelectUser(item)}
    >
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        {item.phone && (
          <Text style={styles.userPhone}>📞 {item.phone}</Text>
        )}
      </View>
      <Ionicons name="person-add" size={20} color="#B8986A" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Promover a Líder</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            
            {/* Informações */}
            <View style={styles.infoContainer}>
              <Ionicons name="information-circle-outline" size={20} color="#B8986A" />
              <Text style={styles.infoText}>
                Selecione um usuário já cadastrado para promover a líder de um ministério.
              </Text>
            </View>

            {/* Seleção de Ministério */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Ministério *</Text>
              <TouchableOpacity
                style={styles.ministerioButton}
                onPress={() => setMinisterioModalVisible(true)}
                disabled={loading}
              >
                <Text style={[styles.ministerioButtonText, !ministerio && styles.placeholderText]}>
                  {ministerio || "Selecione um ministério"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#999" />
              </TouchableOpacity>
              
              {ministerio && (
                <Text style={styles.selectedText}>
                  ✓ Ministério: {ministerio}
                </Text>
              )}
            </View>

            {/* Busca de Usuário */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Buscar Usuário *</Text>
              <View style={styles.searchWrapper}>
                <Ionicons name="search-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Digite o nome do usuário..."
                  value={searchText}
                  onChangeText={setSearchText}
                  editable={!loading && !selectedUser}
                />
                {selectedUser && (
                  <TouchableOpacity onPress={handleClearSelection} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={20} color="#ff6b6b" />
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Usuário Selecionado */}
              {selectedUser && (
                <View style={styles.selectedUserContainer}>
                  <View style={styles.selectedUserInfo}>
                    <Ionicons name="checkmark-circle" size={16} color="#50C878" />
                    <View style={styles.selectedUserDetails}>
                      <Text style={styles.selectedUserName}>{selectedUser.name}</Text>
                      <Text style={styles.selectedUserEmail}>{selectedUser.email}</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Resultados da Busca */}
            {!selectedUser && searchResults.length > 0 && (
              <View style={styles.searchResultsContainer}>
                <Text style={styles.searchResultsTitle}>
                  {searching ? "Buscando..." : `${searchResults.length} usuários encontrados`}
                </Text>
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.id || item.uid}
                  renderItem={renderUserItem}
                  scrollEnabled={false}
                  style={styles.searchResultsList}
                />
              </View>
            )}

            {/* Mensagem quando não há resultados */}
            {!selectedUser && searchText.length >= 2 && searchResults.length === 0 && !searching && (
              <View style={styles.noResultsContainer}>
                <Ionicons name="person-outline" size={32} color="#ccc" />
                <Text style={styles.noResultsText}>
                  Nenhum usuário encontrado com esse nome
                </Text>
                <Text style={styles.noResultsSubText}>
                  Certifique-se de que o usuário já se cadastrou no app
                </Text>
              </View>
            )}

            {/* Estatísticas */}
            {allUsers.length > 0 && (
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{allUsers.length}</Text>
                  <Text style={styles.statLabel}>Usuários Cadastrados</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{existingLeaders.length}</Text>
                  <Text style={styles.statLabel}>Líderes Ativos</Text>
                </View>
              </View>
            )}

            {/* Botões */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.cancelButton, { opacity: loading ? 0.7 : 1 }]}
                onPress={() => navigation.goBack()}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.promoteButton, 
                  { opacity: (ministerio && selectedUser && !loading) ? 1 : 0.5 }
                ]}
                onPress={handlePromoteToLeader}
                disabled={!ministerio || !selectedUser || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="arrow-up-circle-outline" size={20} color="#fff" />
                    <Text style={styles.promoteButtonText}>Promover a Líder</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Modal de Seleção de Ministério */}
        <Modal
          visible={ministerioModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setMinisterioModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Selecionar Ministério</Text>
                <TouchableOpacity onPress={() => setMinisterioModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={ministeriosFixos}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.ministerioOption,
                      ministerio === item && styles.ministerioOptionSelected
                    ]}
                    onPress={() => handleSelectMinisterio(item)}
                  >
                    <Text style={[
                      styles.ministerioOptionText,
                      ministerio === item && styles.ministerioOptionTextSelected
                    ]}>
                      {item}
                    </Text>
                    {ministerio === item && (
                      <Ionicons name="checkmark" size={20} color="#B8986A" />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f8f4e6",
    padding: 15,
    borderRadius: 8,
    marginBottom: 25,
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: "#B8986A",
    flex: 1,
    lineHeight: 18,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  ministerioButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    height: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ministerioButtonText: {
    fontSize: 16,
    color: "#333",
  },
  placeholderText: {
    color: "#999",
  },
  selectedText: {
    fontSize: 12,
    color: "#50C878",
    marginTop: 5,
    fontWeight: "600",
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  clearButton: {
    padding: 5,
  },
  selectedUserContainer: {
    marginTop: 10,
    backgroundColor: "#f0f8ff",
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#50C878",
  },
  selectedUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectedUserDetails: {
    flex: 1,
  },
  selectedUserName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  selectedUserEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  searchResultsContainer: {
    marginTop: 10,
  },
  searchResultsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  searchResultsList: {
    maxHeight: 200,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
  userPhone: {
    fontSize: 12,
    color: "#999",
    marginTop: 1,
  },
  noResultsContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  noResultsText: {
    fontSize: 16,
    color: "#999",
    marginTop: 10,
    textAlign: "center",
  },
  noResultsSubText: {
    fontSize: 14,
    color: "#ccc",
    marginTop: 5,
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 8,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#B8986A",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 15,
    marginTop: 20,
    marginBottom: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  promoteButton: {
    flex: 1,
    backgroundColor: "#50C878",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  promoteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
    width: "85%",
    maxHeight: "70%",
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  ministerioOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  ministerioOptionSelected: {
    backgroundColor: "#f0f8ff",
  },
  ministerioOptionText: {
    fontSize: 16,
    color: "#333",
  },
  ministerioOptionTextSelected: {
    color: "#B8986A",
    fontWeight: "600",
  },
});