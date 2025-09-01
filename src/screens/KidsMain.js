// KidsMain.js
import React, { useState, useContext, useEffect } from "react";
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
import { AuthContext } from "../context/AuthContext";
import { db } from "../Firebase/FirebaseConfig";
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
  serverTimestamp
} from "firebase/firestore";
import DisplayUser from "../components/DisplayUser";

export default function KidsMain({ navigation }) {
  const { user, userData } = useContext(AuthContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingChild, setEditingChild] = useState(null);
  const [loading, setLoading] = useState(false);
  const [children, setChildren] = useState([]);
  const [events, setEvents] = useState([]); // Novo estado para eventos
  const [expandedAvisos, setExpandedAvisos] = useState(false);
  const [expandedFilhos, setExpandedFilhos] = useState(false);

  // Estados do formulário
  const [childForm, setChildForm] = useState({
    nome: "",
    idade: "",
    sexo: "",
    temNecessidadesEspeciais: false,
    necessidadesEspeciais: "",
    temSeletividadeAlimentar: false,
    seletividadeAlimentar: "",
  });

  const userName = userData?.name || user?.displayName || user?.email || "Visitante";

  // Carregar filhos do usuário ao abrir a tela
  useEffect(() => {
    console.log("useEffect executado, user:", user?.uid);
    if (user?.uid) {
      loadChildren();
      loadEvents(); // Carregar eventos também
    } else {
      console.log("User não está disponível ainda");
    }
  }, [user]);

  const loadChildren = async () => {
    // Verificação de segurança
    if (!user || !user.uid) {
      console.log("Usuário não autenticado, não é possível carregar filhos");
      return;
    }

    try {
      setLoading(true);
      console.log("Carregando filhos para o usuário:", user.uid);
      
      // Corrigido: buscar na estrutura correta
      const childrenRef = collection(db, "churchBasico", "users", "filhos");
      const q = query(childrenRef, where("parentId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      
      console.log("Query executada, documentos encontrados:", querySnapshot.size);
      
      const childrenData = [];
      querySnapshot.forEach((doc) => {
        console.log("Documento encontrado:", doc.id, doc.data());
        childrenData.push({ id: doc.id, ...doc.data() });
      });
      
      console.log("Total de filhos carregados:", childrenData.length);
      setChildren(childrenData);
    } catch (error) {
      console.log("Erro ao carregar filhos:", error);
      console.log("Detalhes do erro:", error.message);
      Alert.alert("Erro", "Não foi possível carregar os dados dos filhos");
    } finally {
      setLoading(false);
    }
  };

  /// Função loadEvents corrigida para KidsMain.js
const loadEvents = async () => {
  try {
    console.log("Carregando eventos do Kids...");
    
    // Caminho da coleção de eventos (igual ao MinisterioKidsAdmin.js)
    const eventsRef = collection(db, "churchBasico", "ministerios", "conteudo", "kids", "events");
    
    // Remover o filtro isActive e orderBy que podem causar problemas se não existirem
    // const q = query(eventsRef, where("isActive", "==", true), orderBy("createdAt", "desc"));
    
    // Primeiro tentar buscar todos os eventos
    const querySnapshot = await getDocs(eventsRef);
    
    const eventsData = [];
    querySnapshot.forEach((doc) => {
      const eventData = doc.data();
      console.log("Evento encontrado:", doc.id, eventData);
      
      // Filtrar apenas eventos ativos no código, não na query
      if (eventData.isActive !== false) { // Se não existir o campo, considera como ativo
        eventsData.push({ id: doc.id, ...eventData });
      }
    });
    
    // Ordenar por data de criação se existir
    eventsData.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.toDate() - a.createdAt.toDate();
      }
      return 0;
    });
    
    console.log("Total de eventos carregados:", eventsData.length);
    setEvents(eventsData);
  } catch (error) {
    console.log("Erro ao carregar eventos:", error);
    console.log("Detalhes do erro:", error.message);
    
    // Tentar buscar sem filtros em caso de erro
    try {
      console.log("Tentando buscar eventos sem filtros...");
      const eventsRef = collection(db, "churchBasico", "ministerios", "conteudo", "kids", "events");
      const querySnapshot = await getDocs(eventsRef);
      
      const eventsData = [];
      querySnapshot.forEach((doc) => {
        console.log("Evento encontrado (sem filtro):", doc.id, doc.data());
        eventsData.push({ id: doc.id, ...doc.data() });
      });
      
      setEvents(eventsData);
      console.log("Eventos carregados sem filtros:", eventsData.length);
    } catch (secondError) {
      console.log("Erro na segunda tentativa:", secondError);
    }
  }
};

  const resetForm = () => {
    setChildForm({
      nome: "",
      idade: "",
      sexo: "",
      temNecessidadesEspeciais: false,
      necessidadesEspeciais: "",
      temSeletividadeAlimentar: false,
      seletividadeAlimentar: "",
    });
    setEditMode(false);
    setEditingChild(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (child) => {
    setChildForm({
      nome: child.nome || "",
      idade: child.idade || "",
      sexo: child.sexo || "",
      temNecessidadesEspeciais: child.temNecessidadesEspeciais || false,
      necessidadesEspeciais: child.necessidadesEspeciais || "",
      temSeletividadeAlimentar: child.temSeletividadeAlimentar || false,
      seletividadeAlimentar: child.seletividadeAlimentar || "",
    });
    setEditingChild(child);
    setEditMode(true);
    setModalVisible(true);
  };

  const saveChild = async () => {
    // Verificação de segurança para o usuário
    if (!user || !user.uid) {
      Alert.alert("Erro", "Usuário não autenticado. Faça login novamente.");
      return;
    }

    if (!childForm.nome.trim() || !childForm.idade.trim() || !childForm.sexo.trim()) {
      Alert.alert("Erro", "Por favor, preencha os campos obrigatórios (Nome, Idade e Sexo)");
      return;
    }

    try {
      setLoading(true);
      
      console.log("Salvando filho para usuário:", user.uid);
      console.log("Dados do formulário:", childForm);
      
      const childData = {
        nome: childForm.nome.trim(),
        idade: childForm.idade.trim(),
        sexo: childForm.sexo,
        temNecessidadesEspeciais: childForm.temNecessidadesEspeciais,
        necessidadesEspeciais: childForm.temNecessidadesEspeciais ? childForm.necessidadesEspeciais.trim() : "",
        temSeletividadeAlimentar: childForm.temSeletividadeAlimentar,
        seletividadeAlimentar: childForm.temSeletividadeAlimentar ? childForm.seletividadeAlimentar.trim() : "",
        parentId: user.uid,
        parentName: userName,
        createdAt: editMode ? editingChild.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log("childData preparado:", childData);

      // Gerar ID único para novo filho ou usar o existente para edição
      const childId = editMode ? editingChild.id : `child_${user.uid}_${Date.now()}`;
      console.log("childId gerado:", childId);
      
      // Corrigido: salvar na estrutura correta (mesmo nível que members e lideres)
      const childRef = doc(db, "churchBasico", "users", "filhos", childId);
      console.log("Referência do documento:", childRef.path);

      if (editMode) {
        await updateDoc(childRef, childData);
        console.log("Filho atualizado com sucesso");
        Alert.alert("Sucesso", "Dados do filho atualizados com sucesso!");
      } else {
        await setDoc(childRef, childData);
        console.log("Filho criado com sucesso");
        Alert.alert("Sucesso", "Filho cadastrado com sucesso!");
      }

      setModalVisible(false);
      resetForm();
      await loadChildren(); // Recarrega a lista

    } catch (error) {
      console.log("Erro ao salvar filho:", error);
      console.log("Detalhes do erro:", error.message);
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
              // Corrigido: excluir da estrutura correta
              await deleteDoc(doc(db, "churchBasico", "users", "filhos", child.id));
              Alert.alert("Sucesso", "Filho removido com sucesso!");
              await loadChildren();
            } catch (error) {
              console.log("Erro ao excluir filho:", error);
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header com DisplayUser */}
      <DisplayUser userName={userName} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Título da página */}
        <View style={styles.header}>
          <Ionicons name="happy" size={32} color="#B8986A" />
          <Text style={styles.title}>KIDS</Text>
        </View>

        {/* Botão Cadastrar Filho */}
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Cadastre seu filho(a)!</Text>
        </TouchableOpacity>

        {/* Card Avisos KIDS */}
        <TouchableOpacity 
          style={styles.expandableCard}
          onPress={() => setExpandedAvisos(!expandedAvisos)}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="megaphone-outline" size={24} color="#B8986A" />
            <Text style={styles.cardTitle}>Eventos KIDS ({events.length})</Text>
            <Ionicons 
              name={expandedAvisos ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#666" 
            />
          </View>
          
          {expandedAvisos && (
            <View style={styles.cardContent}>
              {events.length > 0 ? (
                events.map((event) => (
                  <View key={event.id} style={styles.eventItem}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    {event.description && (
                      <Text style={styles.eventDescription}>{event.description}</Text>
                    )}
                    <View style={styles.eventDetails}>
                      {event.date && (
                        <Text style={styles.eventDetail}>
                          📅 {event.date}
                        </Text>
                      )}
                      {event.time && (
                        <Text style={styles.eventDetail}>
                          ⏰ {event.time}
                        </Text>
                      )}
                      {event.location && (
                        <Text style={styles.eventDetail}>
                          📍 {event.location}
                        </Text>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <View>
                  <Text style={styles.avisoText}>
                    📅 Próximo encontro: Domingo às 9h00
                  </Text>
                  <Text style={styles.avisoText}>
                    🎨 Atividade especial: Pintura e desenho
                  </Text>
                  <Text style={styles.avisoText}>
                    🍎 Lanche será fornecido pela igreja
                  </Text>
                  <Text style={styles.noAvisosText}>
                    * Eventos específicos serão adicionados pelo líder do ministério
                  </Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>

        {/* Card Filhos Cadastrados */}
        <TouchableOpacity 
          style={styles.expandableCard}
          onPress={() => setExpandedFilhos(!expandedFilhos)}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="people-outline" size={24} color="#B8986A" />
            <Text style={styles.cardTitle}>
              Filhos Cadastrados ({children.length})
            </Text>
            <Ionicons 
              name={expandedFilhos ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#666" 
            />
          </View>
          
          {expandedFilhos && (
            <View style={styles.cardContent}>
              {loading ? (
                <ActivityIndicator size="small" color="#B8986A" />
              ) : children.length > 0 ? (
                children.map((child) => (
                  <View key={child.id} style={styles.childItem}>
                    <View style={styles.childInfo}>
                      <Text style={styles.childName}>{child.nome}</Text>
                      <Text style={styles.childDetails}>
                        {child.idade} anos • {child.sexo}
                      </Text>
                      {child.temNecessidadesEspeciais && (
                        <Text style={styles.childSpecial}>
                          ⚠️ Necessidades especiais
                        </Text>
                      )}
                      {child.temSeletividadeAlimentar && (
                        <Text style={styles.childSpecial}>
                          🍎 Seletividade alimentar
                        </Text>
                      )}
                    </View>
                    <View style={styles.childActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => openEditModal(child)}
                      >
                        <Ionicons name="pencil" size={16} color="#B8986A" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => deleteChild(child)}
                      >
                        <Ionicons name="trash" size={16} color="#ff4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noChildrenText}>
                  Nenhum filho cadastrado ainda.
                </Text>
              )}
            </View>
          )}
        </TouchableOpacity>
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
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editMode ? "Editar Filho" : "Cadastrar Filho"}
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
                    placeholder="Conte sobre as necessidades do seu filho"
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
                    placeholder="Conte sobre a seletividade alimentar"
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
                    setModalVisible(false);
                    resetForm();
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
                      {editMode ? "Atualizar" : "Salvar"}
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 15,
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
    marginBottom: 15,
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
  avisoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    paddingLeft: 10,
  },
  noAvisosText: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    marginTop: 10,
  },
  childItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
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
  childSpecial: {
    fontSize: 12,
    color: "#B8986A",
    marginTop: 2,
  },
  childActions: {
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
  noChildrenText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    paddingVertical: 20,
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
  eventItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#B8986A",
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
    marginBottom: 8,
    lineHeight: 20,
  },
  eventDetails: {
    gap: 4,
  },
  eventDetail: {
    fontSize: 13,
    color: "#777",
    marginBottom: 2,
  },
});