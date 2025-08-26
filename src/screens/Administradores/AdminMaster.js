// AdminMaster.js
import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../Firebase/FirebaseConfig";

export default function AdminMaster({ navigation }) {
  const { user, userData } = useContext(AuthContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    telefone: "",
    ministerio: "",
  });

  const ministerios = [
    "Louvor e Adoração",
    "Ministério Infantil",
    "Ministério de Jovens",
    "Ministério de Casais",
    "Ministério de Mulheres",
    "Ministério de Homens",
    "Ministério de Intercessão",
    "Ministério de Evangelismo",
    "Ministério de Ensino",
    "Ministério de Mídia",
    "Ministério de Recepção",
    "Administração",
  ];

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const validateForm = () => {
    if (!formData.nome || !formData.email || !formData.senha || !formData.ministerio) {
      Alert.alert("Erro", "Por favor, preencha todos os campos obrigatórios");
      return false;
    }

    if (formData.senha.length < 6) {
      Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert("Erro", "Por favor, insira um e-mail válido");
      return false;
    }

    return true;
  };

  const handleCadastrarResponsavel = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Verificar se o email já existe
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", formData.email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        Alert.alert("Erro", "Este e-mail já está cadastrado no sistema");
        setLoading(false);
        return;
      }

      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.senha
      );

      const newUser = userCredential.user;

      // Criar documento do usuário no Firestore
      await setDoc(doc(db, "users", newUser.uid), {
        uid: newUser.uid,
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        ministerio: formData.ministerio,
        userType: "responsavel",
        ativo: true,
        criadoPor: user.uid,
        criadoEm: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      Alert.alert("Sucesso", "Responsável cadastrado com sucesso!", [
        {
          text: "OK",
          onPress: () => {
            setFormData({
              nome: "",
              email: "",
              senha: "",
              telefone: "",
              ministerio: "",
            });
            setModalVisible(false);
          },
        },
      ]);
    } catch (error) {
      console.log("Erro ao cadastrar responsável:", error);
      let errorMessage = "Erro ao cadastrar responsável";

      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "Este e-mail já está em uso";
          break;
        case "auth/invalid-email":
          errorMessage = "E-mail inválido";
          break;
        case "auth/weak-password":
          errorMessage = "A senha é muito fraca";
          break;
        case "auth/network-request-failed":
          errorMessage = "Erro de conexão. Verifique sua internet";
          break;
        default:
          errorMessage = "Erro ao cadastrar. Tente novamente";
      }

      Alert.alert("Erro", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>ABBA</Text>
          </View>
          <Text style={styles.churchText}>CHURCH</Text>
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{userData?.nome || user?.email}</Text>
          <Text style={styles.userType}>Admin Master</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Painel Administrativo</Text>
          <Text style={styles.welcomeSubtitle}>
            Gerencie responsáveis e administre o sistema
          </Text>
        </View>

        {/* Actions Cards */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => setModalVisible(true)}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="person-add" size={32} color="#B8986A" />
            </View>
            <Text style={styles.actionTitle}>Cadastrar Responsável</Text>
            <Text style={styles.actionDescription}>
              Adicione novos Líderes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons name="people" size={32} color="#B8986A" />
            </View>
            <Text style={styles.actionTitle}>Gerenciar Responsáveis</Text>
            <Text style={styles.actionDescription}>
              Visualize e edite responsáveis existentes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons name="stats-chart" size={32} color="#B8986A" />
            </View>
            <Text style={styles.actionTitle}>Relatórios</Text>
            <Text style={styles.actionDescription}>
              Visualize estatísticas e relatórios do sistema
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons name="settings" size={32} color="#B8986A" />
            </View>
            <Text style={styles.actionTitle}>Configurações</Text>
            <Text style={styles.actionDescription}>
              Gerencie configurações gerais do aplicativo
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de Cadastro */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Cadastrar Líder de Ministério</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nome Completo *</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite o nome completo"
                value={formData.nome}
                onChangeText={(value) => handleInputChange("nome", value)}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>E-mail *</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite o e-mail"
                value={formData.email}
                onChangeText={(value) => handleInputChange("email", value)}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Senha *</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite a senha (mín. 6 caracteres)"
                value={formData.senha}
                onChangeText={(value) => handleInputChange("senha", value)}
                secureTextEntry
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Telefone</Text>
              <TextInput
                style={styles.input}
                placeholder="(00) 00000-0000"
                value={formData.telefone}
                onChangeText={(value) => handleInputChange("telefone", value)}
                keyboardType="phone-pad"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Ministério *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.ministerioContainer}>
                  {ministerios.map((ministerio, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.ministerioChip,
                        formData.ministerio === ministerio && styles.ministerioSelected,
                      ]}
                      onPress={() => handleInputChange("ministerio", ministerio)}
                      disabled={loading}
                    >
                      <Text
                        style={[
                          styles.ministerioText,
                          formData.ministerio === ministerio && styles.ministerioTextSelected,
                        ]}
                      >
                        {ministerio}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { opacity: loading ? 0.7 : 1 }]}
              onPress={handleCadastrarResponsavel}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Cadastrar Responsável</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
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
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoContainer: {
    alignItems: "center",
  },
  logoBox: {
    borderWidth: 2,
    borderColor: "#000",
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginBottom: 2,
  },
  logoText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    letterSpacing: 1,
  },
  churchText: {
    fontSize: 8,
    color: "#000",
    letterSpacing: 3,
    fontWeight: "300",
  },
  userInfo: {
    alignItems: "flex-end",
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  userType: {
    fontSize: 12,
    color: "#B8986A",
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeSection: {
    marginVertical: 30,
    alignItems: "center",
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  actionsContainer: {
    gap: 15,
    marginBottom: 30,
  },
  actionCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: "row",
    alignItems: "center",
  },
  actionIcon: {
    marginRight: 15,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  actionDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
    flex: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  modalHeader: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  closeButton: {
    padding: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  ministerioContainer: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 5,
  },
  ministerioChip: {
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  ministerioSelected: {
    backgroundColor: "#B8986A",
    borderColor: "#B8986A",
  },
  ministerioText: {
    fontSize: 14,
    color: "#333",
  },
  ministerioTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#B8986A",
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});