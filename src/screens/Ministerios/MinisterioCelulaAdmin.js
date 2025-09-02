// MinisterioCelulaAdmin.js
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

export default function MinisterioCelulaAdmin({ navigation }) {
  const { user, userData } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [celulas, setCelulas] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingCelula, setEditingCelula] = useState(null);
  const [expandedCelulas, setExpandedCelulas] = useState(false);

  // Estados do formulário
  const [celulaForm, setCelulaForm] = useState({
    nome: "",
    telefone: "",
    responsavel: "",
  });

  const userName = userData?.name || user?.displayName || "Líder";

  // Carregar células ao abrir a tela
  useEffect(() => {
    loadCelulas();
  }, []);

  const loadCelulas = async () => {
    try {
      setLoading(true);
      console.log("Carregando células...");
      
      const celulasRef = collection(db, "churchBasico", "ministerios", "conteudo", "celula", "celulas");
      
      let querySnapshot;
      try {
        const q = query(celulasRef, orderBy("nome"));
        querySnapshot = await getDocs(q);
      } catch (orderError) {
        console.log("Erro na ordenação, buscando sem ordenar:", orderError);
        querySnapshot = await getDocs(celulasRef);
      }
      
      const celulasData = [];
      querySnapshot.forEach((doc) => {
        console.log("Célula encontrada:", doc.id, doc.data());
        celulasData.push({ id: doc.id, ...doc.data() });
      });
      
      console.log("Total de células carregadas:", celulasData.length);
      setCelulas(celulasData);
    } catch (error) {
      console.log("Erro ao carregar células:", error);
      Alert.alert("Erro", "Não foi possível carregar as células");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCelulaForm({
      nome: "",
      telefone: "",
      responsavel: "",
    });
    setEditMode(false);
    setEditingCelula(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (celula) => {
    setCelulaForm({
      nome: celula.nome || "",
      telefone: celula.telefone || celula.whatsapp || "",
      responsavel: celula.responsavel || "",
    });
    setEditingCelula(celula);
    setEditMode(true);
    setModalVisible(true);
  };

  const saveCelula = async () => {
    if (!celulaForm.nome.trim() || !celulaForm.telefone.trim() || !celulaForm.responsavel.trim()) {
      Alert.alert("Erro", "Por favor, preencha todos os campos obrigatórios");
      return;
    }

    // Validação básica do telefone
    const phoneClean = celulaForm.telefone.replace(/\D/g, '');
    if (phoneClean.length < 10 || phoneClean.length > 11) {
      Alert.alert("Erro", "Por favor, insira um telefone válido");
      return;
    }

    try {
      setLoading(true);
      console.log("Salvando célula...");
      
      const celulaData = {
        nome: celulaForm.nome.trim(),
        telefone: celulaForm.telefone.trim(),
        whatsapp: celulaForm.telefone.trim(), // Compatibilidade com CelulaMain
        responsavel: celulaForm.responsavel.trim(),
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
        Alert.alert("Sucesso", "Célula cadastrada com sucesso!");
      }

      setModalVisible(false);
      resetForm();
      await loadCelulas();
    } catch (error) {
      console.log("Erro ao salvar célula:", error);
      Alert.alert("Erro", `Não foi possível salvar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteCelula = (celula) => {
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
              console.log("Erro ao excluir célula:", error);
              Alert.alert("Erro", "Não foi possível excluir. Tente novamente.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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
        <Text style={styles.headerTitle}>Células - Admin</Text>
        <Text style={styles.leaderName}>{userName}</Text>
      </View>

      {/* DisplayUser */}
      <View style={styles.userSection}>
        <DisplayUser userName={userName} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Botão Nova Célula */}
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Nova Célula +</Text>
        </TouchableOpacity>

        {/* Card Células Cadastradas */}
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
                        Responsável: {celula.responsavel}
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

        {/* Estatísticas */}
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

      {/* Modal de Cadastro/Edição */}
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
              {/* Nome da Célula */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome da Célula: *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite o nome da célula"
                  value={celulaForm.nome}
                  onChangeText={(text) => setCelulaForm({ ...celulaForm, nome: text })}
                />
              </View>

              {/* Telefone de Contato */}
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

              {/* Nome do Responsável */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome do Responsável: *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite o nome do responsável"
                  value={celulaForm.responsavel}
                  onChangeText={(text) => setCelulaForm({ ...celulaForm, responsavel: text })}
                />
              </View>

              {/* Botões */}
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
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