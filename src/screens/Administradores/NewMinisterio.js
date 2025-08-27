import React, { useState } from "react";
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
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../Firebase/FirebaseConfig";

export default function NewMinisterio({ navigation }) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [contato, setContato] = useState("");
  const [loading, setLoading] = useState(false);
  const [ministerio, setMinisterio] = useState("");
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
    setContato(formatted);
  };

  const handleSalvar = async () => {
    if (!nome || !descricao) {
      Alert.alert(
        "Erro",
        "Por favor, preencha pelo menos o nome e a descrição do ministério"
      );
      return;
    }

    setLoading(true);

    try {
      // Salvar ministério no Firestore
      const docRef = await addDoc(
        collection(db, "churchBasico", "ministerios", "list"),
        {
          nome: nome.trim(),
          descricao: descricao.trim(),
          responsavel: responsavel.trim() || null,
          contato: contato || null,
          ativo: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      console.log("Ministério criado com ID:", docRef.id);

      Alert.alert("Sucesso", "Ministério cadastrado com sucesso!", [
        {
          text: "OK",
          onPress: () => {
            // Limpar campos
            setNome("");
            setDescricao("");
            setResponsavel("");
            setContato("");
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      console.log("Erro ao cadastrar ministério:", error);
      Alert.alert("Erro", "Erro ao cadastrar ministério. Tente novamente.");
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
          <Text style={styles.headerTitle}>Novo Ministério</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content}>
          {/* Formulário */}
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Informações do Ministério</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nome do Ministério *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="business-outline"
                  size={20}
                  color="#999"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Ministério de Louvor"
                  value={nome}
                  onChangeText={setNome}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Descrição *</Text>
              <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color="#999"
                  style={[styles.inputIcon, styles.textAreaIcon]}
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Descreva os objetivos e atividades do ministério..."
                  value={descricao}
                  onChangeText={setDescricao}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Responsável</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#999"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Nome do responsável (opcional)"
                  value={responsavel}
                  onChangeText={setResponsavel}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Contato</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="call-outline"
                  size={20}
                  color="#999"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Telefone para contato (opcional)"
                  value={contato}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  maxLength={15}
                  editable={!loading}
                />
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
                  <Text style={styles.saveButtonText}>Salvar Ministério</Text>
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
    minHeight: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  textAreaWrapper: {
    alignItems: "flex-start",
    paddingVertical: 15,
    minHeight: 100,
  },
  inputIcon: {
    marginRight: 10,
  },
  textAreaIcon: {
    marginTop: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  textArea: {
    textAlignVertical: "top",
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
