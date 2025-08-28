// MinisterioContent.js
import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert,
  ActivityIndicator
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../Firebase/FirebaseConfig";
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function MinisterioComunicacaoAdmin({ route }) {
  const [titulo, setTitulo] = useState(""); // Nome da informação ou título
  const [descricao, setDescricao] = useState(""); // Detalhes
  const [loading, setLoading] = useState(false);
  const [ministerio, setMinisterio] = useState(""); // Nome do ministério (ex: Louvor)
  const [infos, setInfos] = useState([]); // Lista de infos já inseridas
    const navigation = useNavigation();
  useEffect(() => {
    // Receber o nome do ministério via route params
    if (route.params?.ministerio) {
      setMinisterio(route.params.ministerio);
      fetchInfos(route.params.ministerio);
    }
  }, [route.params]);

  const fetchInfos = async (ministerioNome) => {
    // Aqui futuramente você pode buscar infos já existentes do ministério no Firestore
    // Por enquanto vamos deixar vazio
  };

  const handleAdicionarInfo = async () => {
    if (!titulo || !descricao) {
      Alert.alert("Erro", "Preencha título e descrição");
      return;
    }

    setLoading(true);
    try {
      const docRef = await addDoc(
        collection(db, "churchBasico", "ministerios", ministerio, "infos"),
        {
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          createdBy: auth.currentUser.uid,
          createdAt: serverTimestamp(),
        }
      );

      Alert.alert("Sucesso", "Informação adicionada ao ministério!");
      setTitulo("");
      setDescricao("");

      // Atualiza lista local
      setInfos(prev => [...prev, { id: docRef.id, titulo, descricao }]);

    } catch (error) {
      console.log("Erro ao adicionar info:", error);
      Alert.alert("Erro", "Não foi possível adicionar a informação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>Ministério: {ministerio}</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Título da informação"
            value={titulo}
            onChangeText={setTitulo}
          />
          <TextInput
            style={[styles.input, { height: 100 }]}
            placeholder="Descrição / detalhes"
            value={descricao}
            onChangeText={setDescricao}
            multiline
          />
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleAdicionarInfo}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.buttonText}>Adicionar Informação</Text>}
          </TouchableOpacity>
        </View>

        {/* Lista de informações inseridas */}
        <View style={styles.listaContainer}>
          <Text style={styles.listaHeader}>Informações cadastradas:</Text>
          {infos.length === 0 ? (
            <Text style={styles.noInfoText}>Nenhuma informação ainda.</Text>
          ) : (
            infos.map(info => (
              <View key={info.id} style={styles.infoCard}>
                <Text style={styles.infoTitulo}>{info.titulo}</Text>
                <Text style={styles.infoDescricao}>{info.descricao}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scroll: {
    padding: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    color: "#333",
  },
  inputContainer: {
    marginBottom: 30,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  button: {
    backgroundColor: "#B8986A",
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  listaContainer: {
    marginBottom: 30,
  },
  listaHeader: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  noInfoText: {
    fontSize: 14,
    color: "#666",
  },
  infoCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoTitulo: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
  },
  infoDescricao: {
    fontSize: 14,
    color: "#555",
  },
});
