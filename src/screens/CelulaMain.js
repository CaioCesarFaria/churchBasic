// CelulaMain.js
import React, { useContext, useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { db } from "../Firebase/FirebaseConfig";
import { 
  collection, 
  getDocs, 
  query,
  orderBy
} from "firebase/firestore";
import DisplayUser from "../components/DisplayUser";

export default function CelulaMain({ navigation }) {
  const { user, userData } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [celulas, setCelulas] = useState([]);

  const userName = userData?.name || user?.displayName || user?.email || "Visitante";

  // Carregar células cadastradas
  useEffect(() => {
    loadCelulas();
  }, []);

  const loadCelulas = async () => {
    try {
      console.log("Carregando células...");
      
      // Buscar na estrutura do Firebase - ajuste o caminho conforme sua estrutura
      const celulasRef = collection(db, "churchBasico", "ministerios", "conteudo", "celula", "celulas");
      
      // Tentar ordenar por nome, se não existir o campo, buscar sem ordenação
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
        const celulaData = doc.data();
        console.log("Célula encontrada:", doc.id, celulaData);
        celulasData.push({ id: doc.id, ...celulaData });
      });
      
      console.log("Total de células carregadas:", celulasData.length);
      setCelulas(celulasData);
    } catch (error) {
      console.log("Erro ao carregar células:", error);
      console.log("Detalhes do erro:", error.message);
      
      // Em caso de erro, não mostrar células mockadas - só carregar as reais do Firebase
      console.log("Erro ao carregar células, nenhuma célula será exibida");
      setCelulas([]);
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = async (whatsapp, nomeCelula) => {
    try {
      // Formatar o número (remover caracteres especiais)
      const cleanNumber = whatsapp.replace(/\D/g, '');
      
      // Mensagem pré-definida conforme solicitado
      const message = `Olá, paz do Senhor! Queria informações sobre a Célula!`;
      const encodedMessage = encodeURIComponent(message);
      
      // URL do WhatsApp
      const whatsappUrl = `whatsapp://send?phone=55${cleanNumber}&text=${encodedMessage}`;
      
      // Tentar abrir o WhatsApp
      const supported = await Linking.canOpenURL(whatsappUrl);
      
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        // Se não conseguir abrir o WhatsApp, tentar abrir no navegador
        const webUrl = `https://wa.me/55${cleanNumber}?text=${encodedMessage}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.log("Erro ao abrir WhatsApp:", error);
      Alert.alert(
        "Erro", 
        "Não foi possível abrir o WhatsApp. Verifique se o aplicativo está instalado."
      );
    }
  };

  const CelulaCard = ({ celula }) => (
    <View style={styles.celulaCard}>
      <View style={styles.celulaContent}>
        <Text style={styles.celulaNome}>{celula.nome}</Text>
        <TouchableOpacity 
          style={styles.whatsappButton}
          onPress={() => openWhatsApp(celula.whatsapp || celula.telefone, celula.nome)}
        >
          <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header com DisplayUser */}
      <DisplayUser userName={userName} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Título da página */}
        <View style={styles.header}>
          <Ionicons name="people" size={32} color="#B8986A" />
          <Text style={styles.title}>CÉLULAS</Text>
        </View>

        {/* Descrição */}
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionTitle}>O que são as Células?</Text>
          <Text style={styles.descriptionText}>
            As células são pequenos grupos de pessoas que se reúnem semanalmente em casas 
            para estudar a Bíblia, orar juntos e construir relacionamentos. É uma excelente 
            forma de crescer na fé e fazer novos amigos!
          </Text>
        </View>

        {/* Lista de Células */}
        <View style={styles.celulasSection}>
          <Text style={styles.sectionTitle}>CÉLULAS DISPONÍVEIS</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#B8986A" />
              <Text style={styles.loadingText}>Carregando células...</Text>
            </View>
          ) : celulas.length > 0 ? (
            <View style={styles.celulasList}>
              {celulas.map((celula) => (
                <CelulaCard key={celula.id} celula={celula} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>Nenhuma célula cadastrada</Text>
              <Text style={styles.emptyText}>
                As células serão cadastradas pelo líder do ministério.
              </Text>
            </View>
          )}
        </View>

        {/* Informações adicionais */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color="#B8986A" />
            <Text style={styles.infoTitle}>Como participar?</Text>
          </View>
          <Text style={styles.infoText}>
            • Escolha uma célula próxima à sua região{'\n'}
            • Entre em contato com o responsável via WhatsApp{'\n'}
            • Participe do próximo encontro{'\n'}
            • Traga sua Bíblia e disposição para aprender!
          </Text>
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
  descriptionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  celulasSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: 1,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  celulasList: {
    gap: 15,
  },
  celulaCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  celulaContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  celulaNome: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginRight: 15,
  },
  whatsappButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f0f8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 15,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 100, // Espaço para a bottom tab
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 10,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
});