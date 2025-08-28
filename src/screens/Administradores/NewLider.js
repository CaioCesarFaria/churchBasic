import React, { useState, useEffect } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../../Firebase/FirebaseConfig";

export default function NewLider({ navigation }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [ministerio, setMinisterio] = useState("");
  const [ministerios, setMinisterios] = useState([]);
  const [senha, setSenha] = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");
  const [loading, setLoading] = useState(false);

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

  const formatPhone = (text) => {
    const numbers = text.replace(/\D/g, "");

    if (numbers.length <= 11) {
      const match = numbers.match(/^(\d{0,2})(\d{0,5})(\d{0,4})$/);
      if (match) {
        let formatted = "";
        if (match[1]) formatted += `(${match[1]}`;
        if (match[1] && match[1].length === 2) formatted += ") ";
        if (match[2]) formatted += match[2];
        if (match[3]) formatted += `-${match[3]}`;
        return formatted;
      }
    }
    return text;
  };

  const handlePhoneChange = (text) => {
    const formatted = formatPhone(text);
    setTelefone(formatted);
  };

  const validateForm = () => {
    if (!nome || !email || !senha || !confirmSenha) {
      Alert.alert("Erro", "Por favor, preencha todos os campos obrigatórios");
      return false;
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Erro", "Por favor, insira um email válido");
      return false;
    }

    // Validação de senha
    if (senha.length < 6) {
      Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres");
      return false;
    }

    if (senha !== confirmSenha) {
      Alert.alert("Erro", "As senhas não coincidem");
      return false;
    }

    return true;
  };

  const generateRandomPassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSenha(password);
    setConfirmSenha(password);
    Alert.alert(
      "Senha Gerada",
      `Senha temporária: ${password}\nO líder poderá alterá-la no primeiro login.`
    );
  };
  
  const cleanMinistryName = (name) => {
  if (!name) return '';
  // 1. Normaliza para decompor caracteres acentuados
  name = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // 2. Remove caracteres que não são letras ou números
  name = name.replace(/[^a-zA-Z0-9]/g, '');
  // 3. Capitaliza a primeira letra (opcional, mas comum para nomes de rotas)
  name = name.charAt(0).toUpperCase() + name.slice(1);
  return name;
};
  const handleSalvar = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        senha
      );
      const user = userCredential.user;

      await updateProfile(user, { displayName: nome });
      // Gera o nome da rota da página administrativa
    const ministerioCleaned = cleanMinistryName(ministerio);
    const pageRouteName = `Ministerio${ministerioCleaned}Admin`; // Ex: MinisterioComunicacaoAdmin

      await setDoc(doc(db, "churchBasico", "users", "lideres", user.uid), {
        name: nome.trim(),
        email: email.trim(),
        phone: telefone || null,
        ministerio: ministerio || null,
        userType: "admin",
        createdAt: serverTimestamp(),
        uid: user.uid,
        isLeader: true,
        createdBy: "adminMaster",
        page: pageRouteName, // <--- NOVO CAMPO: Nome da rota da página específica
      });

      Alert.alert("Sucesso", "Líder atribuído com sucesso!", [
        {
          text: "OK",
          onPress: () => {
            setNome("");
            setEmail("");
            setTelefone("");
            setMinisterio("");
            setSenha("");
            setConfirmSenha("");
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      console.log("Erro ao cadastrar líder:", error);
      let errorMessage = "Erro ao cadastrar líder";

      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "Este e-mail já está em uso";
          break;
        case "auth/invalid-email":
          errorMessage = "E-mail inválido";
          break;
        case "auth/weak-password":
          errorMessage = "Senha muito fraca. Use pelo menos 6 caracteres";
          break;
        case "auth/network-request-failed":
          errorMessage = "Erro de conexão. Verifique sua internet";
          break;
        default:
          errorMessage = "Erro ao cadastrar líder. Tente novamente";
      }

      Alert.alert("Erro", errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.headerTitle}>Novo Líder</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Informações do Líder</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nome Completo *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#999"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Digite o nome completo"
                  value={nome}
                  onChangeText={setNome}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>E-mail *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#999"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="email@exemplo.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Telefone</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="call-outline"
                  size={20}
                  color="#999"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Telefone para contato"
                  value={telefone}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  maxLength={15}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={ministerio}
                onValueChange={setMinisterio}
                style={styles.picker}
              >
                <Picker.Item label="Selecione um ministério" value="" />
                {ministeriosFixos.map((item) => (
                  <Picker.Item key={item} label={item} value={item} />
                ))}
              </Picker>
            </View>

            <View style={styles.passwordSection}>
              <Text style={styles.sectionSubtitle}>Configuração de Acesso</Text>

              <View style={styles.passwordGenerateContainer}>
                <TouchableOpacity
                  style={styles.generatePasswordButton}
                  onPress={generateRandomPassword}
                  disabled={loading}
                >
                  <Ionicons name="key-outline" size={20} color="#B8986A" />
                  <Text style={styles.generatePasswordText}>
                    Gerar Senha Temporária
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Senha *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#999"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Mínimo 6 caracteres"
                    value={senha}
                    onChangeText={setSenha}
                    secureTextEntry
                    editable={!loading}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirmar Senha *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#999"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Digite a senha novamente"
                    value={confirmSenha}
                    onChangeText={setConfirmSenha}
                    secureTextEntry
                    editable={!loading}
                  />
                </View>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.cancelButton, { opacity: loading ? 0.7 : 1 }]}
                onPress={() => navigation.goBack()}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, { opacity: loading ? 0.7 : 1 }]}
                onPress={handleSalvar}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Cadastrar Líder</Text>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.requiredNote}>* Campos obrigatórios</Text>
          </View>
        </ScrollView>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 25,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
    marginTop: 20,
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
  inputWrapper: {
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
  pickerWrapper: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 15,
  },
  picker: { height: 50 },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  
  loadingContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginLeft: 10,
    color: "#666",
  },
  passwordSection: {
    marginTop: 20,
  },
  passwordGenerateContainer: {
    marginBottom: 20,
  },
  generatePasswordButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#B8986A",
    gap: 8,
  },
  generatePasswordText: {
    color: "#B8986A",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 15,
    marginTop: 30,
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
  saveButton: {
    flex: 1,
    backgroundColor: "#B8986A",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  requiredNote: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
  },
});
