// MinisterioCelulaAdmin.js - ARQUIVO COMPLETO CORRIGIDO
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
  orderBy,
  serverTimestamp,
  where,
} from "firebase/firestore";
import DisplayUser from "../../components/DisplayUser";

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

  const formatPhone = (phone) => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 11) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    } else if (clean.length === 10) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
    }
    return phone;
  };

  const renderResponsavelSelector = () => {
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Responsável pela Célula: *</Text>
        <View style={styles.responsavelSelectorContainer}>
          {celulaForm.responsavel ? (
            <View style={styles.selectedResponsavel}>
              <Text style={styles.selectedResponsavelName}>{celulaForm.responsavel.nome}</Text>
              <TouchableOpacity onPress={removeResponsavel} style={styles.removeResponsavelButton}>
                <Ionicons name="close" size={16} color="#ff4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <TextInput
                style={styles.responsavelSearchInput}
                placeholder="Buscar responsável..."
                value={responsavelSearch}
                onChangeText={setResponsavelSearch}
              />
              
              {searchingUsers && (
                <View style={styles.searchingContainer}>
                  <ActivityIndicator size="small" color="#B8986A" />
                  <Text style={styles.searchingText}>Buscando usuários...</Text>
                </View>
              )}
              
              {searchUsers.length > 0 && (
                <View style={styles.searchResultsContainer}>
                  {searchUsers.map((user) => (
                    <TouchableOpacity
                      key={user.id}
                      style={styles.userSearchResult}
                      onPress={() => selectResponsavel(user)}
                    >
                      <View style={styles.userInfo}>
                        <Text style={styles.userSearchResultText}>{user.name}</Text>
                        {user.email && (
                          <Text style={styles.userEmailText}>{user.email}</Text>
                        )}
                      </View>
                      <Ionicons name="add-circle-outline" size={20} color="#B8986A" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              {responsavelSearch.length >= 2 && searchUsers.length === 0 && !searchingUsers && (
                <Text style={styles.noResultsText}>Nenhum usuário encontrado</Text>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderCelulas = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* BOTÃO PARA ADMINS CADASTRAREM CÉLULAS */}
      {canManageCelulas && (
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Nova Célula +</Text>
        </TouchableOpacity>
      )}

      {/* BOTÃO PARA TODOS GERAREM RELATÓRIO */}
      {canCreateReports && (
        <TouchableOpacity 
          style={styles.generateReportButton} 
          onPress={() => {
            if (celulas.length === 0) {
              Alert.alert("Aviso", "Não há células cadastradas para gerar relatório.");
              return;
            }
            if (celulas.length === 1) {
              openReportModal(celulas[0]);
            } else {
              Alert.alert(
                "Selecionar Célula",
                "Escolha uma célula para gerar o relatório nos botões azuis ao lado de cada célula."
              );
            }
          }}
        >
          <Ionicons name="document-text" size={24} color="#fff" />
          <Text style={styles.generateReportButtonText}>Gerar Relatório da Célula</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity 
        style={styles.expandableCard}
        onPress={() => setExpandedCelulas(!expandedCelulas)}
      >
        <View style={styles.cardHeader}>
          <Ionicons name="people-outline" size={24} color="#B8986A" />
          <Text style={styles.cardTitle}>
            Células Cadastradas ({celulas.length})
          </Text>
          <Ionicons 
            name={expandedCelulas ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#666" 
          />
        </View>
        
        {expandedCelulas && (
          <View style={styles.cardContent}>
            {loading ? (
              <ActivityIndicator size="small" color="#B8986A" />
            ) : celulas.length > 0 ? (
              celulas.map((celula) => (
                <View key={celula.id} style={styles.celulaItem}>
                  <View style={styles.celulaInfo}>
                    <Text style={styles.celulaNome}>{celula.nome}</Text>
                    <Text style={styles.celulaDetails}>
                      Responsável: {celula.responsavel?.nome || "Não definido"}
                    </Text>
                    <Text style={styles.celulaDetails}>
                      Telefone: {formatPhone(celula.telefone)}
                    </Text>
                    {celula.createdAt && (
                      <Text style={styles.celulaDate}>
                        Criado em: {new Date(celula.createdAt.toDate()).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.celulaActions}>
                    {/* BOTÃO DE RELATÓRIO PARA TODOS */}
                    {canCreateReports && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.reportButton]}
                        onPress={() => openReportModal(celula)}
                      >
                        <Ionicons name="document-text" size={16} color="#4A90E2" />
                      </TouchableOpacity>
                    )}
                    
                    {/* BOTÕES DE GERENCIAMENTO APENAS PARA ADMINS */}
                    {canManageCelulas && (
                      <>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => openEditModal(celula)}
                        >
                          <Ionicons name="pencil" size={16} color="#B8986A" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.deleteButton]}
                          onPress={() => deleteCelula(celula)}
                        >
                          <Ionicons name="trash" size={16} color="#ff4444" />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noCelulasText}>
                Nenhuma célula cadastrada ainda.
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>

      {celulas.length > 0 && (
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Estatísticas</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={20} color="#B8986A" />
              <Text style={styles.statNumber}>{celulas.length}</Text>
              <Text style={styles.statLabel}>Células Ativas</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );

  const renderMembros = () => {
    const membersToShow = membersExpanded ? members : members.slice(0, 3);
    
    return (
      <ScrollView style={styles.content}>
        <View style={styles.membersHeader}>
          <Text style={styles.tabTitle}>Membros do Ministério</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="people" size={24} color="#B8986A" />
              <Text style={styles.statNumber}>{members.length}</Text>
              <Text style={styles.statLabel}>Total de Membros</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.addMemberButton} onPress={openAddMemberModal}>
            <Ionicons name="person-add" size={20} color="#fff" />
            <Text style={styles.addMemberButtonText}>Adicionar Membro</Text>
          </TouchableOpacity>
        </View>

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
                      <Text style={styles.memberRole}>
                        {item.role === "responsavel" ? "Responsável" : "Membro"}
                      </Text>
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

  const renderRelatorios = () => {
    const relatoriosGrouped = relatorios.reduce((acc, relatorio) => {
      const celulaId = relatorio.celulaId;
      if (!acc[celulaId]) {
        acc[celulaId] = {
          celulaNome: relatorio.celulaNome,
          relatorios: []
        };
      }
      acc[celulaId].relatorios.push(relatorio);
      return acc;
    }, {});

    return (
      <ScrollView style={styles.content}>
        <View style={styles.relatoriosHeader}>
          <Text style={styles.tabTitle}>Relatórios das Células</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="document-text" size={24} color="#4A90E2" />
              <Text style={styles.statNumber}>{relatorios.length}</Text>
              <Text style={styles.statLabel}>Total de Relatórios</Text>
            </View>
          </View>
        </View>

        {Object.keys(relatoriosGrouped).length >0 ? (
          Object.entries(relatoriosGrouped).map(([celulaId, grupo]) => (
            <View key={celulaId} style={styles.relatoriosGroup}>
              <View style={styles.relatoriosGroupHeader}>
                <Ionicons name="people" size={20} color="#B8986A" />
                <Text style={styles.relatoriosGroupTitle}>
                  {grupo.celulaNome} ({grupo.relatorios.length} relatórios)
                </Text>
              </View>
              
              {grupo.relatorios.map((relatorio) => (
                <TouchableOpacity
                  key={relatorio.id}
                  style={styles.relatorioItem}
                  onPress={() => toggleRelatorioExpansion(relatorio.id)}
                >
                  <View style={styles.relatorioHeader}>
                    <View style={styles.relatorioInfo}>
                      <Text style={styles.relatorioDate}>
                        📅 {relatorio.dataEncontro}
                      </Text>
                      <Text style={styles.relatorioSummary}>
                        👥 {relatorio.quantidadeMembros} membros
                        {relatorio.quantidadeVisitantes > 0 && ` • 👋 ${relatorio.quantidadeVisitantes} visitantes`}
                      </Text>
                      <Text style={styles.relatorioAuthor}>
                        Por: {relatorio.createdByName}
                      </Text>
                    </View>
                    <Ionicons 
                      name={relatoriosExpanded[relatorio.id] ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#666" 
                    />
                  </View>
                  
                  {relatoriosExpanded[relatorio.id] && (
                    <View style={styles.relatorioDetails}>
                      {relatorio.problemas && (
                        <View style={styles.relatorioSection}>
                          <Text style={styles.relatorioSectionTitle}>⚠ Problemas/Dificuldades:</Text>
                          <Text style={styles.relatorioSectionText}>{relatorio.problemas}</Text>
                        </View>
                      )}
                      
                      {relatorio.motivosOracao && (
                        <View style={styles.relatorioSection}>
                          <Text style={styles.relatorioSectionTitle}>🙏 Motivos de Oração:</Text>
                          <Text style={styles.relatorioSectionText}>{relatorio.motivosOracao}</Text>
                        </View>
                      )}
                      
                      <View style={styles.relatorioFooter}>
                        <Text style={styles.relatorioCreateDate}>
                          Enviado em: {relatorio.createdAt ? 
                            new Date(relatorio.createdAt.toDate()).toLocaleString() : 
                            'Data não disponível'
                          }
                        </Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))
        ) : (
          <View style={styles.emptyRelatoriosContainer}>
            <Ionicons name="document-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Nenhum Relatório Encontrado</Text>
            <Text style={styles.emptyText}>
              Os relatórios das células aparecerão aqui quando enviados.
            </Text>
          </View>
        )}
      </ScrollView>
    );
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
      {activeTab === "celulas" && renderCelulas()}
      {activeTab === "membros" && canManageCelulas && renderMembros()}
      {activeTab === "relatorios" && canViewReports && renderRelatorios()}

      {/* Modal de Cadastro/Edição de Célula */}
      {canManageCelulas && (
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setModalVisible(false);
            resetForm();
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editMode ? "Editar Célula" : "Nova Célula"}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nome da Célula: *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Digite o nome da célula"
                    value={celulaForm.nome}
                    onChangeText={(text) => setCelulaForm({ ...celulaForm, nome: text })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Telefone de Contato: *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="(DD) 9XXXX-XXXX"
                    value={celulaForm.telefone}
                    onChangeText={(text) => setCelulaForm({ ...celulaForm, telefone: text })}
                    keyboardType="phone-pad"
                    maxLength={15}
                  />
                </View>

                {renderResponsavelSelector()}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setModalVisible(false);
                      resetForm();
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={saveCelula}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.saveButtonText}>
                        {editMode ? "Atualizar" : "Salvar"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Modal de Adicionar Membro */}
      {canManageCelulas && (
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
      )}

      {/* Modal de Relatório */}
      <Modal
        visible={reportModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setReportModalVisible(false);
          resetRelatorioForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gerar Relatório da Célula</Text>
              <TouchableOpacity
                onPress={() => {
                  setReportModalVisible(false);
                  resetRelatorioForm();
                }}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Célula:</Text>
                <View style={styles.selectedCelulaContainer}>
                  <Text style={styles.selectedCelulaText}>
                    {relatorioForm.celulaNome || "Nenhuma célula selecionada"}
                  </Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Data do Encontro: *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/AAAA"
                  value={relatorioForm.dataEncontro}
                  onChangeText={(text) => setRelatorioForm({ ...relatorioForm, dataEncontro: text })}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Quantidade de Membros Presentes: *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 12"
                  value={relatorioForm.quantidadeMembros}
                  onChangeText={(text) => setRelatorioForm({ ...relatorioForm, quantidadeMembros: text })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Quantidade de Visitantes: (opcional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 3"
                  value={relatorioForm.quantidadeVisitantes}
                  onChangeText={(text) => setRelatorioForm({ ...relatorioForm, quantidadeVisitantes: text })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Problemas/Dificuldades:</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Descreva qualquer problema ou dificuldade encontrada..."
                  value={relatorioForm.problemas}
                  onChangeText={(text) => setRelatorioForm({ ...relatorioForm, problemas: text })}
                  multiline={true}
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Motivos de Oração:</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Compartilhe os pedidos de oração da célula..."
                  value={relatorioForm.motivosOracao}
                  onChangeText={(text) => setRelatorioForm({ ...relatorioForm, motivosOracao: text })}
                  multiline={true}
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setReportModalVisible(false);
                    resetRelatorioForm();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={saveRelatorio}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Enviar Relatório</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  membersHeader: {
    paddingBottom: 20,
  },
  relatoriosHeader: {
    paddingBottom: 20,
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
  generateReportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4A90E2",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  generateReportButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  membersExpandableCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
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
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  memberRole: {
    fontSize: 12,
    color: "#B8986A",
    fontWeight: "600",
    marginBottom: 4,
  },
  memberContact: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  deleteMemberButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#ffe6e6",
  },
  relatoriosGroup: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  relatoriosGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  relatoriosGroupTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 10,
  },
  relatorioItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#f8f9fa",
  },
  relatorioHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  relatorioInfo: {
    flex: 1,
  },
  relatorioDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  relatorioSummary: {
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
  },
  relatorioAuthor: {
    fontSize: 12,
    color: "#999",
  },
  relatorioDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#f8f9fa",
  },
  relatorioSection: {
    marginBottom: 12,
  },
  relatorioSectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  relatorioSectionText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  relatorioFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  relatorioCreateDate: {
    fontSize: 11,
    color: "#999",
    fontStyle: "italic",
  },
  emptyRelatoriosContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  addButton: {
    backgroundColor: "#B8986A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  expandableCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginLeft: 12,
    flex: 1,
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  celulaItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  celulaInfo: {
    flex: 1,
    marginRight: 10,
  },
  celulaNome: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  celulaDetails: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  celulaDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  celulaActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#f8f8f8",
  },
  reportButton: {
    backgroundColor: "#e6f3ff",
  },
  deleteButton: {
    backgroundColor: "#ffe6e6",
  },
  noCelulasText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    paddingVertical: 20,
  },
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 100,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: 20,
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
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
  selectedCelulaContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#f8f9fa",
  },
  selectedCelulaText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  responsavelSelectorContainer: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
  },
  selectedResponsavel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#B8986A",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  selectedResponsavelName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  removeResponsavelButton: {
    padding: 2,
  },
  responsavelSearchInput: {
    borderWidth: 1,borderColor: "#ddd",
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
  userSearchResult: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  userSearchResultText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  userEmailText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
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
  noResultsText: {
    textAlign: "center",
    color: "#999",
    fontSize: 12,
    fontStyle: "italic",
    paddingVertical: 10,
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
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    paddingVertical: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginTop: 20,
    marginBottom: 8,
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