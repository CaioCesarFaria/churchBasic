// MinisteriosAdm.js
import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity,
  Alert 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../../Firebase/FirebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export default function MinisteriosAdm({ navigation }) {
  const [ministerios, setMinisterios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Função para limpar nome do ministério e gerar nome da rota
  const cleanMinistryName = (name) => {
    if (!name) return '';
    // 1. Normaliza para decompor caracteres acentuados
    name = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    // 2. Remove caracteres que não são letras ou números
    name = name.replace(/[^a-zA-Z0-9]/g, '');
    // 3. Capitaliza a primeira letra
    name = name.charAt(0).toUpperCase() + name.slice(1);
    return name;
  };

  // Função para navegar para tela específica do ministério
  const navigateToMinisterio = (ministerioNome) => {
    const ministerioCleaned = cleanMinistryName(ministerioNome);
    const routeName = `Ministerio${ministerioCleaned}Admin`;
    
    console.log(`Tentando navegar para: ${routeName}`);
    
    try {
      navigation.navigate(routeName);
    } catch (error) {
      console.log(`Erro ao navegar para ${routeName}:`, error);
      Alert.alert(
        "Tela não encontrada", 
        `A tela "${routeName}" ainda não foi criada no sistema de navegação.`
      );
    }
  };

  const fetchMinisterios = async () => {
    try {
      setLoading(true);
      const lideresRef = collection(db, "churchBasico", "users", "lideres");
      const snapshot = await getDocs(lideresRef);
      const data = snapshot.docs.map(doc => doc.data());
      
      // Agrupar ministérios por nome
      const ministeriosMap = {};
      data.forEach(lider => {
        if (lider.ministerio) {
          if (!ministeriosMap[lider.ministerio]) ministeriosMap[lider.ministerio] = [];
          ministeriosMap[lider.ministerio].push(lider.name);
        }
      });

      const result = Object.keys(ministeriosMap).map(key => ({
        ministerio: key,
        lideres: ministeriosMap[key],
        routeName: `Ministerio${cleanMinistryName(key)}Admin`
      }));

      // Ordenar por nome do ministério
      result.sort((a, b) => a.ministerio.localeCompare(b.ministerio));

      setMinisterios(result);
    } catch (error) {
      console.log("Erro ao buscar ministérios:", error);
      Alert.alert("Erro", "Erro ao carregar ministérios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMinisterios();
  }, []);

  const renderMinisterioItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.ministerioCard}
      onPress={() => navigateToMinisterio(item.ministerio)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Ionicons name="business-outline" size={24} color="#B8986A" />
          <Text style={styles.ministerioTitle}>{item.ministerio}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.lideresContainer}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={styles.lideresLabel}>Líder(es):</Text>
        </View>
        <Text style={styles.lideresText}>
          {item.lideres.join(", ")}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.routeText}>Rota: {item.routeName}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Ministérios</Text>
        
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#B8986A" />
            <Text style={styles.loadingText}>Carregando ministérios...</Text>
          </View>
        ) : ministerios.length > 0 ? (
          <>
            <View style={styles.infoContainer}>
              <Ionicons name="information-circle-outline" size={20} color="#B8986A" />
              <Text style={styles.infoText}>
                Toque em um ministério para acessar sua área administrativa
              </Text>
            </View>

            <FlatList
              data={ministerios}
              keyExtractor={item => item.ministerio}
              renderItem={renderMinisterioItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Nenhum ministério encontrado</Text>
            <Text style={styles.emptyText}>
              Cadastre líderes para que os ministérios apareçam aqui
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
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
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f4e6",
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 15,
  },
  infoText: {
    fontSize: 14,
    color: "#B8986A",
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
  listContainer: {
    paddingBottom: 20,
  },
  ministerioCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  cardTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  ministerioTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 12,
  },
  cardContent: {
    marginBottom: 12,
  },
  lideresContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  lideresLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginLeft: 6,
  },
  lideresText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginLeft: 22,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
  },
  routeText: {
    fontSize: 12,
    color: "#999",
    fontFamily: "monospace",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
});
