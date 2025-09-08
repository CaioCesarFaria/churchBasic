// Cadastro.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
  ActivityIndicator,
  Image,
  ScrollView,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../Firebase/FirebaseConfig";

export default function CadastroScreen({ navigation }) {
  const [nome, setNome] = useState("");
  const [celular, setCelular] = useState("");
  const [email, setEmail] = useState("");
  const [diaNascimento, setDiaNascimento] = useState("");
  const [mesNascimento, setMesNascimento] = useState("");
  const [anoNascimento, setAnoNascimento] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados para modais
  const [showDiaModal, setShowDiaModal] = useState(false);
  const [showMesModal, setShowMesModal] = useState(false);
  const [showAnoModal, setShowAnoModal] = useState(false);

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
    setCelular(formatted);
  };

  // Arrays para os seletores
  const dias = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const meses = [
    { label: "Janeiro", value: "01" },
    { label: "Fevereiro", value: "02" },
    { label: "Março", value: "03" },
    { label: "Abril", value: "04" },
    { label: "Maio", value: "05" },
    { label: "Junho", value: "06" },
    { label: "Julho", value: "07" },
    { label: "Agosto", value: "08" },
    { label: "Setembro", value: "09" },
    { label: "Outubro", value: "10" },
    { label: "Novembro", value: "11" },
    { label: "Dezembro", value: "12" }
  ];
  
  const anoAtual = new Date().getFullYear();
  const anos = Array.from({ length: anoAtual - 1939 }, (_, i) => (anoAtual - 13 - i).toString());

  const handleCadastro = async () => {
    if (!nome || !email || !senha || !confirmarSenha) {
      Alert.alert("Erro", "Por favor, preencha todos os campos obrigatórios");
      return;
    }

    if (!diaNascimento || !mesNascimento || !anoNascimento) {
      Alert.alert("Erro", "Por favor, preencha sua data de nascimento completa");
      return;
    }

    if (!acceptTerms) {
      Alert.alert("Erro", "Você deve aceitar os termos de privacidade para continuar");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Erro", "Por favor, insira um email válido");
      return;
    }

    if (senha.length < 6) {
      Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert("Erro", "As senhas não coincidem");
      return;
    }

    // Validar data de nascimento
    const dia = parseInt(diaNascimento);
    const mes = parseInt(mesNascimento);
    const ano = parseInt(anoNascimento);
    
    const dataCompleta = new Date(ano, mes - 1, dia);
    if (dataCompleta.getDate() !== dia || dataCompleta.getMonth() !== mes - 1) {
      Alert.alert("Erro", "Data de nascimento inválida");
      return;
    }

    const hoje = new Date();
    const idade = hoje.getFullYear() - ano;
    const mesAtual = hoje.getMonth() + 1;
    const diaAtual = hoje.getDate();
    
    if (idade < 13 || (idade === 13 && (mes > mesAtual || (mes === mesAtual && dia > diaAtual)))) {
      Alert.alert("Erro", "Você deve ter pelo menos 13 anos para se cadastrar");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: nome
      });
      
      const dataNascimentoFormatada = `${diaNascimento}/${mesNascimento}/${anoNascimento}`;
      
      // Salvar em churchBasico/users/members (seguindo a estrutura correta)
      await setDoc(doc(db, "churchBasico", "users", "members", user.uid), {
        name: nome,
        email: email,
        phone: celular || null,
        birthDate: dataNascimentoFormatada,
        birthDay: diaNascimento,
        birthMonth: mesNascimento,
        birthYear: anoNascimento,
        userType: "member",
        createdAt: serverTimestamp(),
        uid: user.uid
      });

      Alert.alert("Sucesso", "Cadastro realizado com sucesso!", [
        { text: "OK", onPress: () => navigation.navigate("Login") }
      ]);

    } catch (error) {
      console.log("Erro no cadastro:", error);
      let errorMessage = "Erro ao criar conta";
      
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
          errorMessage = "Erro ao criar conta. Tente novamente";
      }
      
      Alert.alert("Erro", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderModal = (visible, setVisible, title, items, selectedValue, setValue) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList}>
            {items.map((item) => (
              <TouchableOpacity
                key={typeof item === 'object' ? item.value : item}
                style={[
                  styles.modalItem,
                  selectedValue === (typeof item === 'object' ? item.value : item) && styles.selectedItem
                ]}
                onPress={() => {
                  setValue(typeof item === 'object' ? item.value : item);
                  setVisible(false);
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  selectedValue === (typeof item === 'object' ? item.value : item) && styles.selectedItemText
                ]}>
                  {typeof item === 'object' ? item.label : item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
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
          <Text style={styles.headerTitle}>Faça seu cadastro</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nome completo*"
                value={nome}
                onChangeText={setNome}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.phonePrefix}>
                <Image 
                  source={{ uri: "https://flagcdn.com/w20/br.png" }} 
                  style={styles.flagIcon} 
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Celular (com DDD)"
                value={celular}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                maxLength={15}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="E-mail*"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            {/* Data de Nascimento */}
            <View style={styles.dateContainer}>
              <Text style={styles.dateLabel}>Data de Nascimento*</Text>
              <View style={styles.dateRow}>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowDiaModal(true)}
                  disabled={loading}
                >
                  <Text style={[styles.dateButtonText, !diaNascimento && styles.placeholderText]}>
                    {diaNascimento || "Dia"}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#999" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowMesModal(true)}
                  disabled={loading}
                >
                  <Text style={[styles.dateButtonText, !mesNascimento && styles.placeholderText]}>
                    {mesNascimento ? meses.find(m => m.value === mesNascimento)?.label : "Mês"}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#999" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowAnoModal(true)}
                  disabled={loading}
                >
                  <Text style={[styles.dateButtonText, !anoNascimento && styles.placeholderText]}>
                    {anoNascimento || "Ano"}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#999" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Senha* (mínimo 6 caracteres)"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#999" 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirmar senha*"
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                secureTextEntry={!showConfirmPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#999" 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.termsContainer}>
              <Switch
                value={acceptTerms}
                onValueChange={setAcceptTerms}
                trackColor={{ false: "#ccc", true: "#B8986A" }}
                thumbColor={acceptTerms ? "#fff" : "#f4f3f4"}
                disabled={loading}
              />
              <Text style={styles.termsText}>Li e aceito os termos de privacidade</Text>
            </View>

            <TouchableOpacity 
              style={styles.policyButton}
              onPress={() => navigation.navigate("PoliticasPrivacidade")}
              disabled={loading}
            >
              <Text style={styles.policyText}>Políticas e Termos de Privacidade</Text>
              <Ionicons name="chevron-forward" size={16} color="#B8986A" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.cadastroButton, 
                { opacity: (acceptTerms && !loading) ? 1 : 0.5 }
              ]} 
              onPress={handleCadastro}
              disabled={!acceptTerms || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.cadastroButtonText}>Cadastrar</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Modais */}
        {renderModal(showDiaModal, setShowDiaModal, "Selecione o Dia", dias, diaNascimento, setDiaNascimento)}
        {renderModal(showMesModal, setShowMesModal, "Selecione o Mês", meses, mesNascimento, setMesNascimento)}
        {renderModal(showAnoModal, setShowAnoModal, "Selecione o Ano", anos, anoNascimento, setAnoNascimento)}
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
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: "#f5f5f5",
  },
  backButton: {
    padding: 10,
    marginLeft: -10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginLeft: 10,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 15,
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
  phonePrefix: {
    marginRight: 10,
  },
  flagIcon: {
    width: 20,
    height: 15,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  dateContainer: {
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 10,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  dateButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dateButtonText: {
    fontSize: 16,
    color: "#333",
  },
  placeholderText: {
    color: "#999",
  },
  eyeIcon: {
    padding: 5,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 15,
  },
  termsText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#666",
  },
  policyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  policyText: {
    fontSize: 14,
    color: "#B8986A",
    fontWeight: "500",
  },
  cadastroButton: {
    backgroundColor: "#B8986A",
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    height: 50,
  },
  cadastroButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  selectedItem: {
    backgroundColor: "#f0f8ff",
  },
  modalItemText: {
    fontSize: 16,
    color: "#333",
  },
  selectedItemText: {
    color: "#B8986A",
    fontWeight: "600",
  },
});