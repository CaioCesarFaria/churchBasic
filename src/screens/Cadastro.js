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
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatPhone = (text) => {
    // Remove tudo que não é número
    const numbers = text.replace(/\D/g, '');
    
    // Aplica a máscara (xx) xxxxx-xxxx
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

  const handleCadastro = async () => {
    if (!nome || !email || !senha) {
      Alert.alert("Erro", "Por favor, preencha todos os campos obrigatórios");
      return;
    }

    if (!acceptTerms) {
      Alert.alert("Erro", "Você deve aceitar os termos de uso para continuar");
      return;
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Erro", "Por favor, insira um email válido");
      return;
    }

    // Validação de senha
    if (senha.length < 6) {
      Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      // Atualizar o perfil do usuário com o nome
      await updateProfile(user, {
        displayName: nome
      });

      // Salvar dados adicionais no Firestore na coleção churchBasico
      await setDoc(doc(db, "churchBasico", "users", "members", user.uid), {
        name: nome,
        email: email,
        phone: celular || null,
        userType: "member", // tipo de usuário
        createdAt: serverTimestamp(),
        uid: user.uid
      });

      Alert.alert("Sucesso", "Cadastro realizado com sucesso!", [
        { text: "OK", onPress: () => navigation.goBack() }
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

        {/* Formulário */}
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

          {/* Termos de uso */}
          <View style={styles.termsContainer}>
            <Switch
              value={acceptTerms}
              onValueChange={setAcceptTerms}
              trackColor={{ false: "#ccc", true: "#B8986A" }}
              thumbColor={acceptTerms ? "#fff" : "#f4f3f4"}
              disabled={loading}
            />
            <Text style={styles.termsText}>Li e aceito os termos de uso</Text>
          </View>

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
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 30,
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
  formContainer: {
    flex: 1,
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
  eyeIcon: {
    padding: 5,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  termsText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#666",
  },
  cadastroButton: {
    backgroundColor: "#B8986A",
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    height: 50,
  },
  cadastroButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});