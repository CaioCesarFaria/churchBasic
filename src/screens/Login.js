// Login.js
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
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../Firebase/FirebaseConfig";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      return;
    }

    setLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      Alert.alert("Sucesso", "Login realizado com sucesso!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.log("Erro no login:", error);
      let errorMessage = "Erro ao fazer login";
      
      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "Usuário não encontrado";
          break;
        case "auth/wrong-password":
          errorMessage = "Senha incorreta";
          break;
        case "auth/invalid-email":
          errorMessage = "E-mail inválido";
          break;
        case "auth/user-disabled":
          errorMessage = "Usuário desabilitado";
          break;
        case "auth/too-many-requests":
          errorMessage = "Muitas tentativas. Tente novamente mais tarde";
          break;
        case "auth/network-request-failed":
          errorMessage = "Erro de conexão. Verifique sua internet";
          break;
        default:
          errorMessage = "Erro ao fazer login. Tente novamente";
      }
      
      Alert.alert("Erro", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Erro", "Por favor, digite seu e-mail para recuperar a senha");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert("Sucesso", "E-mail de recuperação enviado! Verifique sua caixa de entrada.");
    } catch (error) {
      console.log("Erro ao enviar e-mail de recuperação:", error);
      let errorMessage = "Erro ao enviar e-mail de recuperação";
      
      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "E-mail não encontrado";
          break;
        case "auth/invalid-email":
          errorMessage = "E-mail inválido";
          break;
        default:
          errorMessage = "Erro ao enviar e-mail. Tente novamente";
      }
      
      Alert.alert("Erro", errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Header com X para fechar */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>ABBA</Text>
          </View>
          <Text style={styles.churchText}>CHURCH</Text>
        </View>

        {/* Formulário */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="E-mail"
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
              placeholder="Senha"
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

          <TouchableOpacity 
            style={[styles.loginButton, { opacity: loading ? 0.7 : 1 }]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleForgotPassword} disabled={loading}>
            <Text style={styles.forgotPasswordText}>Esqueci a senha</Text>
          </TouchableOpacity>
        </View>

        {/* Cadastro */}
        <View style={styles.signupContainer}>
          <Text style={styles.signupQuestion}>Ainda não tem cadastro?</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate("Cadastro")}
            disabled={loading}
          >
            <Text style={styles.signupLink}>Cadastre-se</Text>
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
    alignItems: "flex-end",
    paddingTop: 20,
  },
  closeButton: {
    padding: 10,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 60,
  },
  logoBox: {
    borderWidth: 3,
    borderColor: "#000",
    paddingHorizontal: 40,
    paddingVertical: 15,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000",
    letterSpacing: 2,
  },
  churchText: {
    fontSize: 16,
    color: "#000",
    letterSpacing: 8,
    fontWeight: "300",
  },
  formContainer: {
    marginBottom: 40,
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
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  eyeIcon: {
    padding: 5,
  },
  loginButton: {
    backgroundColor: "#B8986A",
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    height: 50,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  forgotPasswordText: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
    marginTop: 20,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  signupQuestion: {
    color: "#666",
    fontSize: 14,
  },
  signupLink: {
    color: "#B8986A",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 5,
  },
});