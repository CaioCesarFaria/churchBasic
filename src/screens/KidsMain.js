// KidsMain.js
import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { db } from "../Firebase/FirebaseConfig";
import { 
  collection, 
  getDocs, 
  query,
  where,
  orderBy,
} from "firebase/firestore";
import DisplayUser from "../components/DisplayUser";

export default function KidsMain({ navigation }) {
  const { user, userData } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [children, setChildren] = useState([]);
  const [events, setEvents] = useState([]);
  const [expandedAvisos, setExpandedAvisos] = useState(false);
  const [expandedFilhos, setExpandedFilhos] = useState(false);

  const userName = userData?.name || user?.displayName || user?.email || "Visitante";

  // Carregar filhos do usuário ao abrir a tela
  useEffect(() => {
    console.log("useEffect executado, user:", user?.uid);
    if (user?.uid) {
      loadChildren();
      loadEvents();
    } else {
      console.log("User não está disponível ainda");
    }
  }, [user]);

  const loadChildren = async () => {
    // Verificação de segurança
    if (!user || !user.uid) {
      console.log("Usuário não autenticado, não é possível carregar filhos");
      return;
    }

    try {
      setLoading(true);
      console.log("Carregando filhos para o usuário:", user.uid);
      
      // Buscar crianças onde o pai ou a mãe é o usuário atual
      const childrenRef = collection(db, "churchBasico", "users", "filhos");
      const q = query(childrenRef, where("parentId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      
      console.log("Query executada, documentos encontrados:", querySnapshot.size);
      
      const childrenData = [];
      querySnapshot.forEach((doc) => {
        console.log("Documento encontrado:", doc.id, doc.data());
        childrenData.push({ id: doc.id, ...doc.data() });
      });
      
      console.log("Total de filhos carregados:", childrenData.length);
      setChildren(childrenData);
    } catch (error) {
      console.log("Erro ao carregar filhos:", error);
      console.log("Detalhes do erro:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      console.log("Carregando eventos do Kids...");
      
      const eventsRef = collection(db, "churchBasico", "ministerios", "conteudo", "kids", "events");
      const querySnapshot = await getDocs(eventsRef);
      
      const eventsData = [];
      querySnapshot.forEach((doc) => {
        const eventData = doc.data();
        console.log("Evento encontrado:", doc.id, eventData);
        
        if (eventData.isActive !== false) {
          eventsData.push({ id: doc.id, ...eventData });
        }
      });
      
      // Ordenar por data de criação se existir
      eventsData.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.toDate() - a.createdAt.toDate();
        }
        return 0;
      });
      
      console.log("Total de eventos carregados:", eventsData.length);
      setEvents(eventsData);
    } catch (error) {
      console.log("Erro ao carregar eventos:", error);
      console.log("Detalhes do erro:", error.message);
      
      try {
        console.log("Tentando buscar eventos sem filtros...");
        const eventsRef = collection(db, "churchBasico", "ministerios", "conteudo", "kids", "events");
        const querySnapshot = await getDocs(eventsRef);
        
        const eventsData = [];
        querySnapshot.forEach((doc) => {
          console.log("Evento encontrado (sem filtro):", doc.id, doc.data());
          eventsData.push({ id: doc.id, ...doc.data() });
        });
        
        setEvents(eventsData);
        console.log("Eventos carregados sem filtros:", eventsData.length);
      } catch (secondError) {
        console.log("Erro na segunda tentativa:", secondError);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header com DisplayUser */}
      <DisplayUser userName={userName} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Título da página */}
        <View style={styles.header}>
          <Ionicons name="happy" size={32} color="#B8986A" />
          <Text style={styles.title}>KIDS</Text>
        </View>

        {/* Informativo sobre cadastro */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#4A90E2" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Cadastro de Crianças</Text>
            <Text style={styles.infoText}>
              O cadastro dos filhos é feito pelo líder do ministério Kids. 
              Entre em contato com a liderança para cadastrar seu filho(a).
            </Text>
          </View>
        </View>

        {/* Card Eventos KIDS */}
        <TouchableOpacity 
          style={styles.expandableCard}
          onPress={() => setExpandedAvisos(!expandedAvisos)}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="megaphone-outline" size={24} color="#B8986A" />
            <Text style={styles.cardTitle}>Eventos KIDS ({events.length})</Text>
            <Ionicons 
              name={expandedAvisos ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#666" 
            />
          </View>
          
          {expandedAvisos && (
            <View style={styles.cardContent}>
              {events.length > 0 ? (
                events.map((event) => (
                  <View key={event.id} style={styles.eventItem}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    {event.description && (
                      <Text style={styles.eventDescription}>{event.description}</Text>
                    )}
                    <View style={styles.eventDetails}>
                      {event.date && (
                        <Text style={styles.eventDetail}>
                          📅 {event.date}
                        </Text>
                      )}
                      {event.time && (
                        <Text style={styles.eventDetail}>
                          ⏰ {event.time}
                        </Text>
                      )}
                      {event.location && (
                        <Text style={styles.eventDetail}>
                          📍 {event.location}
                        </Text>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <View>
                  <Text style={styles.avisoText}>
                    📅 Próximo encontro: Domingo às 9h00
                  </Text>
                  <Text style={styles.avisoText}>
                    🎨 Atividade especial: Pintura e desenho
                  </Text>
                  <Text style={styles.avisoText}>
                    🎁 Lanche será fornecido pela igreja
                  </Text>
                  <Text style={styles.noAvisosText}>
                    * Eventos específicos serão adicionados pelo líder do ministério
                  </Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>

        {/* Card Filhos Cadastrados */}
        <TouchableOpacity 
          style={styles.expandableCard}
          onPress={() => setExpandedFilhos(!expandedFilhos)}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="people-outline" size={24} color="#B8986A" />
            <Text style={styles.cardTitle}>
              Filhos Cadastrados ({children.length})
            </Text>
            <Ionicons 
              name={expandedFilhos ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#666" 
            />
          </View>
          
          {expandedFilhos && (
            <View style={styles.cardContent}>
              {loading ? (
                <ActivityIndicator size="small" color="#B8986A" />
              ) : children.length > 0 ? (
                children.map((child) => (
                  <View key={child.id} style={styles.childItem}>
                    <View style={styles.childInfo}>
                      <Text style={styles.childName}>{child.nome}</Text>
                      <Text style={styles.childDetails}>
                        {child.idade} anos • {child.sexo}
                      </Text>
                      {child.nomePai && (
                        <Text style={styles.parentName}>Pai: {child.nomePai}</Text>
                      )}
                      {child.nomeMae && (
                        <Text style={styles.parentName}>Mãe: {child.nomeMae}</Text>
                      )}
                      {child.temNecessidadesEspeciais && (
                        <Text style={styles.childSpecial}>
                          ⚠️ Necessidades especiais
                        </Text>
                      )}
                      {child.temSeletividadeAlimentar && (
                        <Text style={styles.childSpecial}>
                          🎯 Seletividade alimentar
                        </Text>
                      )}
                    </View>
                    <View style={styles.statusIndicator}>
                      <Ionicons name="checkmark-circle" size={20} color="#50C878" />
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.noChildrenContainer}>
                  <Text style={styles.noChildrenText}>
                    Nenhum filho cadastrado ainda.
                  </Text>
                  <Text style={styles.noChildrenSubText}>
                    Entre em contato com o líder do ministério Kids para fazer o cadastro.
                  </Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
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
  infoCard: {
    backgroundColor: "#e3f2fd",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    borderLeftWidth: 4,
    borderLeftColor: "#4A90E2",
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1976d2",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: "#1565c0",
    lineHeight: 20,
  },
  expandableCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginLeft: 12,
    flex: 1,
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  avisoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    paddingLeft: 10,
  },
  noAvisosText: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    marginTop: 10,
  },
  childItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  childDetails: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  parentName: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  childSpecial: {
    fontSize: 12,
    color: "#B8986A",
    marginTop: 2,
  },
  statusIndicator: {
    padding: 5,
  },
  noChildrenContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  noChildrenText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    marginBottom: 8,
  },
  noChildrenSubText: {
    textAlign: "center",
    color: "#bbb",
    fontSize: 12,
    fontStyle: "italic",
  },
  eventItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#B8986A",
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  eventDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    lineHeight: 20,
  },
  eventDetails: {
    gap: 4,
  },
  eventDetail: {
    fontSize: 13,
    color: "#777",
    marginBottom: 2,
  },
});