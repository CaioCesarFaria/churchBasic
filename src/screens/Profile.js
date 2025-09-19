// Profile.js 
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
import { doc, getDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { auth, db } from "../Firebase/FirebaseConfig";
import { updateProfile, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";

export default function ProfileScreen({ navigation }) {
  const { user, userData, setUserData, logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [ministerios, setMinisterios] = useState([]);
  
  // Estados para edição
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCelular, setEditCelular] = useState("");
  const [editDiaNascimento, setEditDiaNascimento] = useState("");
  const [editMesNascimento, setEditMesNascimento] = useState("");
  const [editAnoNascimento, setEditAnoNascimento] = useState("");
  const [saving, setSaving] = useState(false);

  // Estados para exclusão de conta
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  const ProfileMenuItem = ({ iconName, title, onPress, showArrow = true, children, danger = false }) => (
    <View>
      <TouchableOpacity style={[styles.menuItem, danger && styles.dangerMenuItem]} onPress={onPress}>
        <View style={styles.menuItemLeft}>
          <Ionicons name={iconName} size={20} color={danger ? "#ff4444" : "#B8986A"} />
          <Text style={[styles.menuItemText, danger && styles.dangerMenuText]}>{title}</Text>
        </View>
        {showArrow && (
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        )}
      </TouchableOpacity>
      {children}
    </View>
  );

  const formatPhone = (text) => {
    const numbers = text.replace(/\D/g, '');
    
    if (numbers.length <= 11) {
      const match = numbers.match(/^(\d{0,2})(\d{0,5})(\d{0,4})$/);
      if (match) {
        let formatted = '';
        if (match[1]) formatted += `(${match[1]}`;
        if (match[1] && match[1].length === 2) formatted += ') ';
        if (match[2]) formatted += match[2];
        if (match[3]) formatted += `-${match[3]}`;
        return formatted;
      }
    }
    return text;
  };

  const handlePhoneChange = (text) => {
    const formatted = formatPhone(text);
    setEditCelular(formatted);
  };

  // FUNÇÃO ATUALIZADA - Buscar TODOS os ministérios do usuário
  const loadUserMinisterios = async (userId) => {
    try {
      const ministeriosEncontrados = [];
      
      // Lista COMPLETA dos ministérios disponíveis
      const ministeriosDisponiveis = [
        { nome: "Comunicação", path: "comunicacao" },
        { nome: "Louvor", path: "louvor" },
        { nome: "Jovens", path: "jovens" },
        { nome: "Crianças", path: "criancas" },
        { nome: "Intercessão", path: "intercessao" },
        { nome: "Evangelismo", path: "evangelismo" },
        { nome: "Hospitalidade", path: "hospitalidade" },
        { nome: "Escola Dominical", path: "escolaDominical" },
        { nome: "Diaconia", path: "diaconia" },
        { nome: "Células", path: "celulas" },
        { nome: "Teatro", path: "teatro" },
        { nome: "Dança", path: "danca" },
        { nome: "Apoio Técnico", path: "apoioTecnico" },
        { nome: "Ministério da Família", path: "familia" },
        { nome: "Terceira Idade", path: "terceiraIdade" },
        { nome: "Casais", path: "casais" },
        { nome: "Homens", path: "homens" },
        { nome: "Mulheres", path: "mulheres" },
        { nome: "Ministério de Cura e Libertação", path: "curaLibertacao" },
        { nome: "Batismo", path: "batismo" },
        { nome: "Recepção", path: "recepcao" }
      ];
      
      // Buscar em cada ministério
      for (const ministerio of ministeriosDisponiveis) {
        try {
          const membersRef = collection(
            db, 
            "churchBasico", 
            "ministerios", 
            "conteudo", 
            ministerio.path, 
            "membros"
          );
          
          const querySnapshot = await getDocs(membersRef);
          
          querySnapshot.forEach((doc) => {
            const memberData = doc.data();
            
            // Verificar se é o usuário atual
            if (memberData.userId === userId || doc.id === `member_${userId}`) {
              ministeriosEncontrados.push({
                nome: ministerio.nome,
                path: ministerio.path,
                dadosMembresia: {
                  registradoEm: memberData.createdAt,
                  registradoPor: memberData.registeredByName,
                  status: "Ativo",
                  docId: doc.id
                }
              });
            }
          });
          
        } catch (error) {
          console.log(`Erro ao buscar no ministério ${ministerio.nome}:`, error);
        }
      }
      
      console.log(`Ministérios encontrados para o usuário ${userId}:`, ministeriosEncontrados);
      setMinisterios(ministeriosEncontrados);
      
    } catch (error) {
      console.log("Erro geral ao buscar ministérios:", error);
      setMinisterios([]);
    }
  };

  // Carregar informações do usuário
  const loadUserInfo = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      
      // Buscar dados básicos do usuário
      let docRef = doc(db, "churchBasico", "users", "members", user.uid);
      let docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        docRef = doc(db, "churchBasico", "users", "lideres", user.uid);
        docSnap = await getDoc(docRef);
      }

      if (docSnap.exists()) {
        const userData = docSnap.data();
        setUserInfo(userData);
        
        // Preencher campos de edição
        setEditNome(userData.name || "");
        setEditEmail(userData.email || "");
        setEditCelular(userData.phone || "");
        setEditDiaNascimento(userData.birthDay || "");
        setEditMesNascimento(userData.birthMonth || "");
        setEditAnoNascimento(userData.birthYear || "");
      }
      
      // Buscar ministérios
      await loadUserMinisterios(user.uid);
      
    } catch (error) {
      console.error("Erro ao carregar informações do usuário:", error);
      Alert.alert("Erro", "Não foi possível carregar as informações do perfil");
    } finally {
      setLoading(false);
    }
  };

  // Salvar alterações
  const handleSaveProfile = async () => {
    if (!editNome.trim()) {
      Alert.alert("Erro", "Nome é obrigatório");
      return;
    }

    if (!editEmail.trim()) {
      Alert.alert("Erro", "Email é obrigatório");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editEmail)) {
      Alert.alert("Erro", "Por favor, insira um email válido");
      return;
    }

    try {
      setSaving(true);
      
      // Determinar se é member ou leader
      let docRef = doc(db, "churchBasico", "users", "members", user.uid);
      let docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        docRef = doc(db, "churchBasico", "users", "lideres", user.uid);
      }

      // Preparar dados para atualização
      const updateData = {
        name: editNome.trim(),
        email: editEmail.trim(),
        phone: editCelular || null,
        birthDay: editDiaNascimento,
        birthMonth: editMesNascimento,
        birthYear: editAnoNascimento,
      };

      if (editDiaNascimento && editMesNascimento && editAnoNascimento) {
        updateData.birthDate = `${editDiaNascimento}/${editMesNascimento}/${editAnoNascimento}`;
      }

      // Atualizar no Firestore
      await updateDoc(docRef, updateData);
      
      // Atualizar o displayName no Auth
      await updateProfile(auth.currentUser, {
        displayName: editNome.trim()
      });

      // Atualizar contexto local
      setUserData(prev => ({
        ...prev,
        name: editNome.trim(),
        email: editEmail.trim(),
        phone: editCelular || null,
      }));

      Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
      setEditModalVisible(false);
      loadUserInfo(); // Recarregar informações
      
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      Alert.alert("Erro", "Não foi possível salvar as alterações");
    } finally {
      setSaving(false);
    }
  };

  // NOVA FUNÇÃO - Excluir conta do usuário
  const handleDeleteAccount = async () => {
    if (!confirmPassword.trim()) {
      Alert.alert("Erro", "Por favor, digite sua senha para confirmar");
      return;
    }

    Alert.alert(
      "DESEJA REALMENTE EXCLUIR SUA CONTA?",
      "Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos e você será removido de todos os ministérios.",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "EXCLUIR CONTA",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);

              // Reautenticar o usuário
              const credential = EmailAuthProvider.credential(
                user.email,
                confirmPassword
              );

              await reauthenticateWithCredential(auth.currentUser, credential);

              // 1. Remover usuário de todos os ministérios
              for (const ministerio of ministerios) {
                try {
                  const memberDocRef = doc(
                    db,
                    "churchBasico",
                    "ministerios",
                    "conteudo",
                    ministerio.path,
                    "membros",
                    ministerio.dadosMembresia.docId
                  );
                  await deleteDoc(memberDocRef);
                } catch (error) {
                  console.log(`Erro ao remover do ministério ${ministerio.nome}:`, error);
                }
              }

              // 2. Excluir documento do usuário no Firestore
              let userDocRef = doc(db, "churchBasico", "users", "members", user.uid);
              let docSnap = await getDoc(userDocRef);
              
              if (!docSnap.exists()) {
                userDocRef = doc(db, "churchBasico", "users", "lideres", user.uid);
                docSnap = await getDoc(userDocRef);
              }

              if (docSnap.exists()) {
                await deleteDoc(userDocRef);
              }

              // 3. Excluir conta do Firebase Auth
              await deleteUser(auth.currentUser);

              Alert.alert("Conta Excluída", "Sua conta foi excluída com sucesso.", [
                {
                  text: "OK",
                  onPress: () => {
                    logout();
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'Login' }],
                    });
                  }
                }
              ]);

            } catch (error) {
              console.error("Erro ao excluir conta:", error);
              
              if (error.code === 'auth/wrong-password') {
                Alert.alert("Erro", "Senha incorreta. Tente novamente.");
              } else if (error.code === 'auth/too-many-requests') {
                Alert.alert("Erro", "Muitas tentativas. Tente novamente mais tarde.");
              } else {
                Alert.alert("Erro", "Não foi possível excluir a conta. Tente novamente.");
              }
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    loadUserInfo();
  }, [user?.uid]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#B8986A" />
          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={30} color="#B8986A" />
              </View>
              <TouchableOpacity style={styles.cameraButton}>
                <Ionicons name="camera" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.profileText}>
              <Text style={styles.profileName}>
                {userInfo?.name || userData?.name || user?.displayName || "Nome não informado"}
              </Text>
              <Text style={styles.profileEmail}>
                {userInfo?.email || user?.email || "Email não informado"}
              </Text>
              {userInfo?.phone && (
                <Text style={styles.profilePhone}>{userInfo.phone}</Text>
              )}
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => setEditModalVisible(true)}
          >
            <Ionicons name="person-outline" size={20} color="#B8986A" />
            <Text style={styles.editProfileButtonText}>Editar meu perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <ProfileMenuItem
            iconName="people-outline"
            title="Ministérios que faço parte"
            showArrow={false}
          >
            <View style={styles.ministeriosContainer}>
              {ministerios.length > 0 ? (
                ministerios.map((ministerio, index) => (
                  <View key={index} style={styles.ministerioItem}>
                    <View style={styles.ministerioHeader}>
                      <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                      <Text style={styles.ministerioText}>{ministerio.nome}</Text>
                    </View>
                    
                    {ministerio.dadosMembresia && (
                      <View style={styles.ministerioDetails}>
                        <Text style={styles.ministerioDetailText}>
                          Status: {ministerio.dadosMembresia.status}
                        </Text>
                        {ministerio.dadosMembresia.registradoPor && (
                          <Text style={styles.ministerioDetailText}>
                            Cadastrado por: {ministerio.dadosMembresia.registradoPor}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <View style={styles.noMinisterioContainer}>
                  <Ionicons name="information-circle-outline" size={24} color="#999" />
                  <Text style={styles.noMinisterioText}>
                    Você ainda não faz parte de nenhum ministério
                  </Text>
                  <Text style={styles.noMinisterioSubText}>
                    Entre em contato com um líder para ser adicionado aos ministérios
                  </Text>
                </View>
              )}
            </View>
          </ProfileMenuItem>
          
          {/* Botão Excluir Conta */}
          <ProfileMenuItem
            iconName="trash-outline"
            title="Excluir minha conta"
            onPress={() => setDeleteModalVisible(true)}
            showArrow={false}
            danger={true}
          />
        </View>
      </ScrollView>

      {/* Modal de Edição */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity 
                onPress={() => setEditModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome completo:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite seu nome"
                  value={editNome}
                  onChangeText={setEditNome}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite seu email"
                  value={editEmail}
                  onChangeText={setEditEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Celular:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="(00) 00000-0000"
                  value={editCelular}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  maxLength={15}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Data de Nascimento:</Text>
                <View style={styles.dateRow}>
                  <TextInput
                    style={[styles.input, styles.dateInput]}
                    placeholder="Dia"
                    value={editDiaNascimento}
                    onChangeText={setEditDiaNascimento}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <TextInput
                    style={[styles.input, styles.dateInput]}
                    placeholder="Mês"
                    value={editMesNascimento}
                    onChangeText={setEditMesNascimento}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <TextInput
                    style={[styles.input, styles.dateInput]}
                    placeholder="Ano"
                    value={editAnoNascimento}
                    onChangeText={setEditAnoNascimento}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setEditModalVisible(false)}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Salvar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Exclusão de Conta */}
      <Modal
        visible={deleteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteModalHeader}>
              <View style={styles.dangerIconContainer}>
                <Ionicons name="warning" size={32} color="#ff4444" />
              </View>
              <Text style={styles.deleteModalTitle}>Excluir Conta</Text>
              <TouchableOpacity 
                onPress={() => {
                  setDeleteModalVisible(false);
                  setConfirmPassword("");
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.deleteModalBody}>
              <Text style={styles.deleteWarningText}>
                Esta ação é irreversível. Ao excluir sua conta:
              </Text>
              
              <View style={styles.deleteWarningList}>
                <View style={styles.deleteWarningItem}>
                  <Ionicons name="close-circle" size={16} color="#ff4444" />
                  <Text style={styles.deleteWarningItemText}>
                    Todos os seus dados serão permanentemente excluídos
                  </Text>
                </View>
                <View style={styles.deleteWarningItem}>
                  <Ionicons name="close-circle" size={16} color="#ff4444" />
                  <Text style={styles.deleteWarningItemText}>
                    Você será removido de todos os ministérios
                  </Text>
                </View>
                <View style={styles.deleteWarningItem}>
                  <Ionicons name="close-circle" size={16} color="#ff4444" />
                  <Text style={styles.deleteWarningItemText}>
                    Não será possível recuperar a conta
                  </Text>
                </View>
              </View>

              <View style={styles.passwordInputGroup}>
                <Text style={styles.passwordLabel}>
                  Digite sua senha para confirmar:
                </Text>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Sua senha atual"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={true}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.deleteModalButtons}>
                <TouchableOpacity 
                  style={styles.cancelDeleteButton}
                  onPress={() => {
                    setDeleteModalVisible(false);
                    setConfirmPassword("");
                  }}
                  disabled={deleting}
                >
                  <Text style={styles.cancelDeleteButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.confirmDeleteButton}
                  onPress={handleDeleteAccount}
                  disabled={deleting || !confirmPassword.trim()}
                >
                  {deleting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="trash" size={16} color="#fff" />
                      <Text style={styles.confirmDeleteButtonText}>EXCLUIR CONTA</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 10,
    marginLeft: -10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  settingsButton: {
    padding: 10,
    marginRight: -10,
  },
  profileSection: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#B8986A",
  },
  cameraButton: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#B8986A",
    alignItems: "center",
    justifyContent: "center",
  },
  profileText: {
    marginLeft: 15,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 14,
    color: "#666",
  },
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  editProfileButtonText: {
    marginLeft: 8,
    color: "#B8986A",
    fontSize: 14,
    fontWeight: "500",
  },
  menuSection: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dangerMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 15,
  },
  dangerMenuText: {
    color: "#ff4444",
  },
  ministeriosContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  ministerioItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  ministerioHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  ministerioText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 8,
    fontWeight: "600",
  },
  ministerioDetails: {
    marginLeft: 24,
    gap: 2,
  },
  ministerioDetailText: {
    fontSize: 12,
    color: "#666",
  },
  noMinisterioContainer: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  noMinisterioText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    fontWeight: "500",
  },
  noMinisterioSubText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 4,
    fontStyle: "italic",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
    paddingTop: 50,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flex: 1,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  modalForm: {
    padding: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
    color: "#333",
  },
  dateRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateInput: {
    flex: 1,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 30,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#B8986A",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#B8986A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  // Estilos para o Modal de Exclusão
  deleteModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  deleteModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  dangerIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fff2f2",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffe6e6",
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ff4444",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 15,
  },
  deleteModalBody: {
    padding: 20,
  },
  deleteWarningText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 15,
    fontWeight: "500",
  },
  deleteWarningList: {
    marginBottom: 25,
  },
  deleteWarningItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  deleteWarningItemText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  passwordInputGroup: {
    marginBottom: 25,
  },
  passwordLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  passwordInput: {
    backgroundColor: "#fff5f5",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    borderWidth: 2,
    borderColor: "#ffcccc",
    color: "#333",
  },
  deleteModalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelDeleteButton: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelDeleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  confirmDeleteButton: {
    flex: 1,
    backgroundColor: "#ff4444",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: "#ff4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  confirmDeleteButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});