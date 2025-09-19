// MinisterioCelulaAdmin.js - ARQUIVO COMPLETO REFATORADO
import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
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
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import DisplayUser from "../../components/DisplayUser";
import CelulaModals from "../../components/CelulaModals";
import CelulasList from "../../components/CelulasList";
import MembersReportsTabs from "../../components/MembersReportsTabs";

export default function MinisterioCelulaAdmin({ navigation, route }) {
  const { user, userData } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("celulas");
  
  // Estados das Células
  const [celulas, setCelulas] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingCelula, setEditingCelula] = useState(null);
  const [expandedCelulas, setExpandedCelulas] = useState(false);

  // Estados do formulário de célula
  const [celulaForm, setCelulaForm] = useState({
    nome: "",
    telefone: "",
    responsavel: null,
  });

  // Estados para busca de responsável
  const [responsavelSearch, setResponsavelSearch] = useState("");
  const [searchUsers, setSearchUsers] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Estados dos Membros
  const [members, setMembers] = useState([]);
  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [userSearchText, setUserSearchText] = useState("");
  const [membersExpanded, setMembersExpanded] = useState(false);

  // Estados dos Relatórios
  const [relatorios, setRelatorios] = useState([]);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [relatoriosExpanded, setRelatoriosExpanded] = useState({});

  // Estados do formulário de relatório
  const [relatorioForm, setRelatorioForm] = useState({
    celulaId: "",
    celulaNome: "",
    dataEncontro: "",
    quantidadeMembros: "",
    quantidadeVisitantes: "",
    problemas: "",
    motivosOracao: "",
  });

  // PERMISSÕES CORRIGIDAS
  const userRole = route?.params?.userRole || "membro";
  const isAdmin = userRole === "admin" || userRole === "responsavel" || userRole === "lider";
  const canManageCelulas = isAdmin; // Apenas admins podem gerenciar células
  const canViewReports = isAdmin; // Apenas admins podem ver relatórios
  const canCreateReports = true; // TODOS podem criar relatórios

  const userName = userData?.name || user?.displayName || "Usuário";

  // Carregar dados ao abrir a tela
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Sempre carrega células para todos
      await loadCelulas();
      
      if (isAdmin) {
        await Promise.all([loadMembers(), loadRelatorios()]);
      }
    } catch (error) {
      console.log("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCelulas = async () => {
    try {
      const celulasRef = collection(db, "churchBasico", "ministerios", "conteudo", "celula", "celulas");
      
      let querySnapshot;
      try {
        const q = query(celulasRef, orderBy("nome"));
        querySnapshot = await getDocs(q);
      } catch (orderError) {
        querySnapshot = await getDocs(celulasRef);
      }
      
      const celulasData = [];
      querySnapshot.forEach((doc) => {
        celulasData.push({ id: doc.id, ...doc.data() });
      });
      
      setCelulas(celulasData);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar as células");
    }
  };

  const loadMembers = async () => {
    if (!isAdmin) return;
    
    try {
      const membersRef = collection(db, "churchBasico", "ministerios", "conteudo", "celula", "membros");
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

  const loadRelatorios = async () => {
    if (!isAdmin) return;
    
    try {
      const relatoriosRef = collection(db, "churchBasico", "ministerios", "conteudo", "celula", "relatorios");
      const q = query(relatoriosRef, orderBy("dataEncontro", "desc"));
      const querySnapshot = await getDocs(q);
      
      const relatoriosData = [];
      querySnapshot.forEach((doc) => {
        relatoriosData.push({ id: doc.id, ...doc.data() });
      });
      
      setRelatorios(relatoriosData);
    } catch (error) {
      console.log("Erro ao carregar relatórios:", error);
    }
  };

  const searchUsersInDatabase = async (searchText) => {
    if (!canManageCelulas) return;
    
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

  useEffect(() => {
    if (!canManageCelulas) return;
    
    const timeoutId = setTimeout(() => {
      searchUsersInDatabase(responsavelSearch);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [responsavelSearch, canManageCelulas]);

  useEffect(() => {
    if (!canManageCelulas) return;
    
    const timeoutId = setTimeout(() => {
      searchUsersInDatabase(userSearchText);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [userSearchText, canManageCelulas]);

  const resetForm = () => {
    setCelulaForm({
      nome: "",
      telefone: "",
      responsavel: null,
    });
    setResponsavelSearch("");
    setSearchUsers([]);
    setEditMode(false);
    setEditingCelula(null);
  };

  const resetRelatorioForm = () => {
    setRelatorioForm({
      celulaId: "",
      celulaNome: "",
      dataEncontro: "",
      quantidadeMembros: "",
      quantidadeVisitantes: "",
      problemas: "",
      motivosOracao: "",
    });
  };

  const openAddModal = () => {
    if (!canManageCelulas) return;
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (celula) => {
    if (!canManageCelulas) return;
    setCelulaForm({
      nome: celula.nome || "",
      telefone: celula.telefone || celula.whatsapp || "",
      responsavel: celula.responsavel || null,
    });
    if (celula.responsavel) {
      setResponsavelSearch(celula.responsavel.nome || "");
    }
    setEditingCelula(celula);
    setEditMode(true);
    setModalVisible(true);
  };

  const openReportModal = (celula = null) => {
    if (!canCreateReports) return;
    
    resetRelatorioForm();
    if (celula) {
      setRelatorioForm(prev => ({
        ...prev,
        celulaId: celula.id,
        celulaNome: celula.nome,
      }));
    }
    setReportModalVisible(true);
  };

  const selectResponsavel = (user) => {
    if (!canManageCelulas) return;
    setCelulaForm(prev => ({
      ...prev,
      responsavel: {
        id: user.id,
        nome: user.name,
        userId: user.id,
        email: user.email,
        telefone: user.phone || ""
      }
    }));
    setResponsavelSearch("");
    setSearchUsers([]);
  };

  const removeResponsavel = () => {
    if (!canManageCelulas) return;
    setCelulaForm(prev => ({
      ...prev,
      responsavel: null
    }));
  };

  const saveCelula = async () => {
    if (!canManageCelulas) return;
    
    if (!celulaForm.nome.trim() || !celulaForm.telefone.trim() || !celulaForm.responsavel) {
      Alert.alert("Erro", "Por favor, preencha todos os campos obrigatórios");
      return;
    }

    const phoneClean = celulaForm.telefone.replace(/\D/g, '');
    if (phoneClean.length < 10 || phoneClean.length > 11) {
      Alert.alert("Erro", "Por favor, insira um telefone válido");
      return;
    }

    try {
      setLoading(true);
      
      const celulaData = {
        nome: celulaForm.nome.trim(),
        telefone: celulaForm.telefone.trim(),
        whatsapp: celulaForm.telefone.trim(),
        responsavel: celulaForm.responsavel,
        createdBy: user.uid,
        createdByName: userName,
        createdAt: editMode ? editingCelula.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
      };

      const celulaId = editMode ? editingCelula.id : `celula_${Date.now()}`;
      const celulaRef = doc(db, "churchBasico", "ministerios", "conteudo", "celula", "celulas", celulaId);

      if (editMode) {
        await updateDoc(celulaRef, celulaData);
        Alert.alert("Sucesso", "Célula atualizada com sucesso!");
      } else {
        await setDoc(celulaRef, celulaData);
        await addResponsavelAsMember(celulaForm.responsavel);
        Alert.alert("Sucesso", "Célula cadastrada com sucesso!");
      }

      setModalVisible(false);
      resetForm();
      await loadCelulas();
    } catch (error) {
      Alert.alert("Erro", `Não foi possível salvar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveRelatorio = async () => {
    if (!relatorioForm.celulaId || !relatorioForm.dataEncontro || !relatorioForm.quantidadeMembros) {
      Alert.alert("Erro", "Por favor, preencha todos os campos obrigatórios");
      return;
    }

    try {
      setLoading(true);
      
      const relatorioData = {
        celulaId: relatorioForm.celulaId,
        celulaNome: relatorioForm.celulaNome,
        dataEncontro: relatorioForm.dataEncontro,
        quantidadeMembros: parseInt(relatorioForm.quantidadeMembros),
        quantidadeVisitantes: parseInt(relatorioForm.quantidadeVisitantes) || 0,
        problemas: relatorioForm.problemas.trim(),
        motivosOracao: relatorioForm.motivosOracao.trim(),
        createdBy: user.uid,
        createdByName: userName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const relatorioId = `relatorio_${Date.now()}`;
      const relatorioRef = doc(db, "churchBasico", "ministerios", "conteudo", "celula", "relatorios", relatorioId);

      await setDoc(relatorioRef, relatorioData);
      Alert.alert("Sucesso", "Relatório enviado com sucesso!");

      setReportModalVisible(false);
      resetRelatorioForm();
      
      if (isAdmin) {
        await loadRelatorios();
      }
    } catch (error) {
      Alert.alert("Erro", `Não foi possível enviar o relatório: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addResponsavelAsMember = async (responsavel) => {
    if (!isAdmin) return;
    
    try {
      const isAlreadyMember = members.find(member => member.userId === responsavel.userId);
      if (isAlreadyMember) {
        return;
      }

      const memberData = {
        userId: responsavel.userId,
        nome: responsavel.nome,
        email: responsavel.email,
        telefone: responsavel.telefone || "",
        ministerio: "celula",
        role: "responsavel",
        registeredBy: user.uid,
        registeredByName: userName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const memberId = `member_${responsavel.userId}`;
      const memberRef = doc(db, "churchBasico", "ministerios", "conteudo", "celula", "membros", memberId);

      await setDoc(memberRef, memberData);
      await loadMembers();
    } catch (error) {
      console.log("Erro ao adicionar responsável como membro:", error);
    }
  };

  const deleteCelula = (celula) => {
    if (!canManageCelulas) return;
    
    Alert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja excluir a célula "${celula.nome}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await deleteDoc(doc(db, "churchBasico", "ministerios", "conteudo", "celula", "celulas", celula.id));
              Alert.alert("Sucesso", "Célula excluída com sucesso!");
              await loadCelulas();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível excluir. Tente novamente.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const openAddMemberModal = () => {
    if (!canManageCelulas) return;
    setUserSearchText("");
    setSearchUsers([]);
    setMemberModalVisible(true);
  };

  const addMemberFromUser = async (selectedUser) => {
    if (!canManageCelulas) return;
    
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
        ministerio: "celula",
        role: "membro",
        registeredBy: user.uid,
        registeredByName: userName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const memberId = `member_${selectedUser.id}`;
      const memberRef = doc(db, "churchBasico", "ministerios", "conteudo", "celula", "membros", memberId);

      await setDoc(memberRef, memberData);
      Alert.alert("Sucesso", "Membro adicionado com sucesso!");

      setMemberModalVisible(false);
      setUserSearchText("");
      setSearchUsers([]);
      await loadMembers();

    } catch (error) {
      Alert.alert("Erro", `Não foi possível adicionar o membro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteMember = (member) => {
    if (!canManageCelulas) return;
    
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
              await deleteDoc(doc(db, "churchBasico", "ministerios", "conteudo", "celula", "membros", member.id));
              Alert.alert("Sucesso", "Membro removido com sucesso!");
              await loadMembers();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível remover. Tente novamente.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const toggleRelatorioExpansion = (relatorioId) => {
    setRelatoriosExpanded(prev => ({
      ...prev,
      [relatorioId]: !prev[relatorioId]
    }));
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
        <Text style={styles.headerTitle}>
          Células - {canManageCelulas ? "Admin" : "Membro"}
        </Text>
        <Text style={styles.leaderName}>{userName}</Text>
      </View>

      {/* DisplayUser */}
      <View style={styles.userSection}>
        <DisplayUser userName={userName} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "celulas" && styles.activeTab]}
          onPress={() => setActiveTab("celulas")}
        >
          <Ionicons 
            name="people" 
            size={18} 
            color={activeTab === "celulas" ? "#B8986A" : "#666"} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === "celulas" && styles.activeTabText
          ]}>
            Células
          </Text>
        </TouchableOpacity>

        {canManageCelulas && (
          <TouchableOpacity
            style={[styles.tab, activeTab === "membros" && styles.activeTab]}
            onPress={() => setActiveTab("membros")}
          >
            <Ionicons 
              name="person" 
              size={18} 
              color={activeTab === "membros" ? "#B8986A" : "#666"} 
            />
            <Text style={[
              styles.tabText, 
              activeTab === "membros" && styles.activeTabText
            ]}>
              Membros
            </Text>
          </TouchableOpacity>
        )}

        {canViewReports && (
          <TouchableOpacity
            style={[styles.tab, activeTab === "relatorios" && styles.activeTab]}
            onPress={() => setActiveTab("relatorios")}
          >
            <Ionicons 
              name="document-text" 
              size={18} 
              color={activeTab === "relatorios" ? "#4A90E2" : "#666"} 
            />
            <Text style={[
              styles.tabText, 
              activeTab === "relatorios" && styles.activeTabText
            ]}>
              Relatórios
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {activeTab === "celulas" && (
        <CelulasList
          celulas={celulas}
          loading={loading}
          expandedCelulas={expandedCelulas}
          setExpandedCelulas={setExpandedCelulas}
          canManageCelulas={canManageCelulas}
          canCreateReports={canCreateReports}
          openAddModal={openAddModal}
          openEditModal={openEditModal}
          openReportModal={openReportModal}
          deleteCelula={deleteCelula}
        />
      )}

      <MembersReportsTabs
        activeTab={activeTab}
        members={members}
        membersExpanded={membersExpanded}
        setMembersExpanded={setMembersExpanded}
        openAddMemberModal={openAddMemberModal}
        deleteMember={deleteMember}
        relatorios={relatorios}
        relatoriosExpanded={relatoriosExpanded}
        toggleRelatorioExpansion={toggleRelatorioExpansion}
        canManageCelulas={canManageCelulas}
        canViewReports={canViewReports}
      />

      {/* Modals */}
      <CelulaModals
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        editMode={editMode}
        celulaForm={celulaForm}
        setCelulaForm={setCelulaForm}
        resetForm={resetForm}
        saveCelula={saveCelula}
        loading={loading}
        responsavelSearch={responsavelSearch}
        setResponsavelSearch={setResponsavelSearch}
        searchUsers={searchUsers}
        searchingUsers={searchingUsers}
        selectResponsavel={selectResponsavel}
        removeResponsavel={removeResponsavel}
        canManageCelulas={canManageCelulas}
        memberModalVisible={memberModalVisible}
        setMemberModalVisible={setMemberModalVisible}
        userSearchText={userSearchText}
        setUserSearchText={setUserSearchText}
        addMemberFromUser={addMemberFromUser}
        reportModalVisible={reportModalVisible}
        setReportModalVisible={setReportModalVisible}
        relatorioForm={relatorioForm}
        setRelatorioForm={setRelatorioForm}
        resetRelatorioForm={resetRelatorioForm}
        saveRelatorio={saveRelatorio}
      />

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#B8986A" />
        </View>
      )}
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
  userSection: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
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