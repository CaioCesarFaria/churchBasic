// Home.js - VERSÃO COMPLETA CORRIGIDA COM VERIFICAÇÃO DE DIACONATO
import React, { useState, useContext, useEffect, useCallback } from "react";
import {
  StyleSheet,
  StatusBar,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../Firebase/FirebaseConfig";
import DisplayUser from "../components/DisplayUser";
import Topo from "../components/Topo";
import CardVideo from "../components/CardVideo";
import { AuthContext } from "../context/AuthContext";

// Versículos da ACF para seleção aleatória
const versiculos = [
  {
    texto: "Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o SENHOR; pensamentos de paz, e não de mal, para vos dar o fim que esperais.",
    referencia: "Jeremias 29:11"
  },
  {
    texto: "Confia no SENHOR de todo o teu coração, e não te estribes no teu próprio entendimento.",
    referencia: "Provérbios 3:5"
  },
  {
    texto: "Tudo posso naquele que me fortalece.",
    referencia: "Filipenses 4:13"
  },
  {
    texto: "O SENHOR é o meu pastor, nada me faltará.",
    referencia: "Salmos 23:1"
  },
  {
    texto: "E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus.",
    referencia: "Romanos 8:28"
  },
  {
    texto: "Não temas, porque eu sou contigo; não te assombres, porque eu sou teu Deus.",
    referencia: "Isaías 41:10"
  },
  {
    texto: "Buscar-me-eis, e me achareis, quando me buscardes com todo o vosso coração.",
    referencia: "Jeremias 29:13"
  },
  {
    texto: "Entrega o teu caminho ao SENHOR; confia nele, e ele tudo fará.",
    referencia: "Salmos 37:5"
  }
];

// Dados do primeiro vídeo do ABBA TV
const primeiroVideoAbbaTv = {
  id: '1',
  title: 'Culto de Domingo - Palavra que Transforma',
  youtubeUrl: 'https://www.youtube.com/watch?v=GouNZ7AEtiQ',
  videoId: 'GouNZ7AEtiQ',
  thumbnail: 'https://img.youtube.com/vi/GouNZ7AEtiQ/maxresdefault.jpg',
  description: 'Uma palavra poderosa que transforma vidas e traz esperança para todos os corações',
  pastor: 'Pastor João',
  date: '15 de Dezembro, 2024',
};

// Programação fixa
const programacaoFixa = [
  { dia: "Domingo", evento: "Culto de Domingo", horario: "19:30" },
  { dia: "Terça-feira", evento: "Célula", horario: "19:00" },
  { dia: "Quinta-feira", evento: "Culto das Mulheres", horario: "19:00" },
  { dia: "Sábado", evento: "Louvor das Crianças", horario: "10:00" }
];

export default function HomeScreen() {
  const { user, userData, setUserData } = useContext(AuthContext);
  const navigation = useNavigation();
  const [expandedSections, setExpandedSections] = useState({
    eventos: true,
    abbatv: true,
    programacao: true,
  });
  const [userRole, setUserRole] = useState(null);
  const [adminPageRoute, setAdminPageRoute] = useState(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);
  const [eventosKids, setEventosKids] = useState([]);
  const [versiculoDoDia, setVersiculoDoDia] = useState(null);
  const [loadingEventos, setLoadingEventos] = useState(false);
  
  // Estados para verificar se o usuário tem ministérios
  const [hasMinisterios, setHasMinisterios] = useState(false);
  const [loadingMinisterios, setLoadingMinisterios] = useState(false);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleLoginPress = () => {
    navigation.navigate("Login");
  };

  // Função para selecionar versículo do dia
  const selecionarVersiculoDoDia = useCallback(() => {
    const hoje = new Date();
    const seed = hoje.getDate() + hoje.getMonth() + hoje.getFullYear();
    const indice = seed % versiculos.length;
    setVersiculoDoDia(versiculos[indice]);
  }, []);

  // Carregar eventos do Kids - COM TRATAMENTO DE ERRO
  const carregarEventosKids = useCallback(async () => {
    if (!user) {
      console.log("❌ Usuário não logado, não carregando eventos");
      return;
    }

    setLoadingEventos(true);
    try {
      console.log("📅 Carregando eventos Kids...");
      const eventsRef = collection(db, "churchBasico", "ministerios", "conteudo", "kids", "events");
      const querySnapshot = await getDocs(eventsRef);
      
      const eventos = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.isActive) {
          eventos.push({ id: doc.id, ...data });
        }
      });
      
      // Ordenar por data mais próxima
      eventos.sort((a, b) => new Date(a.date) - new Date(b.date));
      setEventosKids(eventos);
      console.log(`✅ ${eventos.length} eventos Kids carregados`);
    } catch (error) {
      console.log("❌ Erro ao carregar eventos Kids:", error);
      setEventosKids([]);
    } finally {
      setLoadingEventos(false);
    }
  }, [user]);

  // FUNÇÃO CORRIGIDA: Verificar se o usuário tem ministérios
  const verificarMinisterios = useCallback(async () => {
    if (!user) {
      console.log("❌ Usuário não logado, não verificando ministérios");
      return;
    }
    
    setLoadingMinisterios(true);
    try {
      console.log("🔍 Verificando ministérios do usuário...");
      let temMinisterios = false;

      // Array com todos os ministérios para verificar
      const ministeriosParaVerificar = [
        { nome: "comunicacao", caminho: ["churchBasico", "ministerios", "conteudo", "comunicacao", "membros"] },
        { nome: "celula", caminho: ["churchBasico", "ministerios", "conteudo", "celula", "membros"] },
        { nome: "kids", caminho: ["churchBasico", "ministerios", "conteudo", "kids", "membros"] },
        { nome: "louvor", caminho: ["churchBasico", "ministerios", "conteudo", "louvor", "membros"] },
        { nome: "diaconato", caminho: ["churchBasico", "ministerios", "conteudo", "diaconato", "membros"] },
        { nome: "timeA", caminho: ["churchBasico", "ministerios", "conteudo", "diaconato", "times", "timeA", "membros"] },
        { nome: "timeB", caminho: ["churchBasico", "ministerios", "conteudo", "diaconato", "times", "timeB", "membros"] },
      ];

      // Verificar cada ministério
      for (const ministerio of ministeriosParaVerificar) {
        if (temMinisterios) break; // Se já encontrou, não precisa continuar

        try {
          const ministerioRef = collection(db, ...ministerio.caminho);
          const ministerioQuery = query(ministerioRef, where("userId", "==", user.uid));
          const ministerioSnapshot = await getDocs(ministerioQuery);
          
          if (!ministerioSnapshot.empty) {
            console.log(`✅ Usuário encontrado no ministério: ${ministerio.nome}`);
            temMinisterios = true;
            break;
          }
        } catch (error) {
          console.log(`❌ Erro ao verificar ${ministerio.nome}:`, error);
        }
      }

      console.log("🔍 Resultado da verificação de ministérios:", temMinisterios);
      setHasMinisterios(temMinisterios);
      
    } catch (error) {
      console.log("❌ Erro geral ao verificar ministérios:", error);
      setHasMinisterios(false);
    } finally {
      setLoadingMinisterios(false);
    }
  }, [user]);

  // FUNÇÃO OTIMIZADA: Buscar role do usuário
  const fetchUserRole = useCallback(async () => {
    setIsLoadingRole(true);
    console.log("🔄 Iniciando fetchUserRole...");

    if (!user) {
      console.log("❌ Nenhum usuário logado. Limpando userRole.");
      setUserRole(null);
      setAdminPageRoute(null);
      setHasMinisterios(false);
      setIsLoadingRole(false);
      return;
    }

    console.log("👤 Usuário logado:", user.uid);
    
    try {
      // Primeiro, tentar buscar em lideres
      console.log("🔍 Tentando buscar em lideres...");
      const docRefLideres = doc(db, "churchBasico", "users", "lideres", user.uid);
      const docSnapLideres = await getDoc(docRefLideres);

      if (docSnapLideres.exists()) {
        const data = docSnapLideres.data();
        console.log("✅ Encontrado em lideres! Dados:", data);
        setUserRole(data.userType);
        setAdminPageRoute(data.page || null);
        setHasMinisterios(false); // Líderes não precisam da verificação de ministérios
      } else {
        // Se não encontrou em lideres, tentar em members
        console.log("🔍 Não encontrado em lideres. Tentando buscar em members...");
        const docRefMembers = doc(db, "churchBasico", "users", "members", user.uid);
        const docSnapMembers = await getDoc(docRefMembers);

        if (docSnapMembers.exists()) {
          const data = docSnapMembers.data();
          console.log("✅ Encontrado em members! Dados:", data);
          setUserRole(data.userType);
          setAdminPageRoute(null);
          
          // IMPORTANTE: Verificar ministérios se for membro (SEM AWAIT AQUI)
          if (data.userType === "member") {
            console.log("🔍 É membro, verificando ministérios...");
            verificarMinisterios(); // Chama sem await para não bloquear
          } else {
            setHasMinisterios(false);
          }
        } else {
          console.log("❌ Usuário não encontrado em lideres nem members.");
          setUserRole(null);
          setAdminPageRoute(null);
          setHasMinisterios(false);
        }
      }
    } catch (error) {
      console.error("❌ ERRO ao buscar role do usuário:", error);
      
      // Tratamento específico para erro de permissão
      if (error.code === 'permission-denied') {
        console.log("🚫 Erro de permissão detectado. Verifique as regras do Firestore.");
        Alert.alert(
          "Erro de Permissão",
          "Não foi possível acessar os dados do usuário. Verifique sua conexão e tente novamente.",
          [{ text: "OK" }]
        );
      }
      
      setUserRole(null);
      setAdminPageRoute(null);
      setHasMinisterios(false);
    } finally {
      setIsLoadingRole(false);
      console.log("✅ fetchUserRole concluído.");
    }
  }, [user, verificarMinisterios]);

  // Effects otimizados
  useEffect(() => {
    selecionarVersiculoDoDia();
  }, [selecionarVersiculoDoDia]);

  useEffect(() => {
    if (user) {
      carregarEventosKids();
    }
  }, [user, carregarEventosKids]);

  useEffect(() => {
    fetchUserRole();
  }, [user]); // Removido fetchUserRole das dependências para evitar loop

  const handleGerenciarMinisterios = () => {
    if (userRole === "admin" && adminPageRoute) {
      navigation.navigate(adminPageRoute);
    } else {
      console.warn("Nenhuma página de ministério específica encontrada ou não é admin.");
      Alert.alert("Atenção", "Você não tem uma página de gerenciamento de ministério associada.");
    }
  };

  const handlePainelAdministrativo = () => {
    navigation.navigate("AdminMaster");
  };

  const handleVerMinisterios = () => {
    navigation.navigate("MinisterioMembros");
  };

  const SectionHeader = ({ title, section, onToggle }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity onPress={onToggle}>
        <Text style={styles.toggleText}>
          {expandedSections[section] ? "OCULTAR" : "EXPANDIR"}
        </Text>
        <Ionicons
          name={expandedSections[section] ? "chevron-up" : "chevron-down"}
          size={16}
          color="#666"
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.containerHome} edges={["bottom", "top"]}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Topo />
        <DisplayUser
          isLoggedIn={!!user}
          userName={userData?.name || user?.displayName || user?.email}
          onLoginPress={handleLoginPress}
        />

        {/* Botões de gerenciamento baseados no papel do usuário */}
        {isLoadingRole ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando permissões...</Text>
          </View>
        ) : (
          <>
            {/* Botão para AdminMaster */}
            {userRole === "adminMaster" && (
              <View style={styles.adminSection}>
                <TouchableOpacity style={styles.adminMasterButton} onPress={handlePainelAdministrativo}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#fff" style={styles.adminIcon} />
                  <Text style={styles.adminButtonText}>PAINEL ADMINISTRATIVO</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Botão para Admin normal */}
            {userRole === "admin" && adminPageRoute && (
              <View style={styles.adminSection}>
                <TouchableOpacity style={styles.adminButton} onPress={handleGerenciarMinisterios}>
                  <Ionicons name="settings-outline" size={20} color="#fff" style={styles.adminIcon} />
                  <Text style={styles.adminButtonText}>GERENCIAR MINISTÉRIO</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Botão para Membros que participam de ministérios */}
            {userRole === "member" && hasMinisterios && (
              <View style={styles.adminSection}>
                <TouchableOpacity style={styles.memberButton} onPress={handleVerMinisterios}>
                  <Ionicons name="star-outline" size={20} color="#fff" style={styles.adminIcon} />
                  <Text style={styles.adminButtonText}>VER SEUS MINISTÉRIOS</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Debug: Mostrar informações do usuário */}
            {__DEV__ && user && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugText}>DEBUG INFO:</Text>
                <Text style={styles.debugText}>UserRole: {userRole || 'null'}</Text>
                <Text style={styles.debugText}>AdminPage: {adminPageRoute || 'null'}</Text>
                <Text style={styles.debugText}>HasMinisterios: {hasMinisterios.toString()}</Text>
                <Text style={styles.debugText}>LoadingMinisterios: {loadingMinisterios.toString()}</Text>
              </View>
            )}
          </>
        )}

        {/* Verificação se o usuário está logado */}
        {!user && (
          <View style={styles.notLoggedContainer}>
            <Text style={styles.notLoggedText}>Você não está logado</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => navigation.navigate("Login")}
              >
                <Text style={styles.buttonText}>Entrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.registerButton}
                onPress={() => navigation.navigate("Cadastro")}
              >
                <Text style={styles.buttonText}>Cadastre-se</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Box do Versículo do Dia */}
        {versiculoDoDia && (
          <View style={styles.versiculoContainer}>
            <View style={styles.versiculoHeader}>
              <Ionicons name="book-outline" size={20} color="#B8986A" />
              <Text style={styles.versiculoTitle}>Versículo do Dia</Text>
            </View>
            <Text style={styles.versiculoTexto}>"{versiculoDoDia.texto}"</Text>
            <Text style={styles.versiculoReferencia}>{versiculoDoDia.referencia}</Text>
          </View>
        )}

        {/* Seção Eventos */}
        <View style={styles.section}>
          <SectionHeader
            title="Eventos"
            section="eventos"
            onToggle={() => toggleSection("eventos")}
          />

          {expandedSections.eventos && (
            <View style={styles.sectionContent}>
              <View style={styles.eventoMinisterio}>
                <Text style={styles.ministerioTitle}>KIDS</Text>
                {loadingEventos ? (
                  <Text style={styles.loadingText}>Carregando eventos...</Text>
                ) : eventosKids.length > 0 ? (
                  eventosKids.map((evento) => (
                    <View key={evento.id} style={styles.eventoItem}>
                      <Text style={styles.eventoNome}>{evento.title}</Text>
                      <View style={styles.eventoDetalhes}>
                        <View style={styles.eventoInfo}>
                          <Ionicons name="calendar-outline" size={14} color="#666" />
                          <Text style={styles.eventoTexto}>{evento.date}</Text>
                        </View>
                        {evento.time && (
                          <View style={styles.eventoInfo}>
                            <Ionicons name="time-outline" size={14} color="#666" />
                            <Text style={styles.eventoTexto}>{evento.time}</Text>
                          </View>
                        )}
                        {evento.location && (
                          <View style={styles.eventoInfo}>
                            <Ionicons name="location-outline" size={14} color="#666" />
                            <Text style={styles.eventoTexto}>{evento.location}</Text>
                          </View>
                        )}
                      </View>
                      {evento.description && (
                        <Text style={styles.eventoDescricao}>{evento.description}</Text>
                      )}
                    </View>
                  ))
                ) : (
                  <Text style={styles.nenhumEventoText}>Nenhum evento cadastrado</Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Seção ABBA TV */}
        <View style={styles.section}>
          <SectionHeader
            title="ABBA TV"
            section="abbatv"
            onToggle={() => toggleSection("abbatv")}
          />

          {expandedSections.abbatv && (
            <View style={styles.sectionContent}>
              <TouchableOpacity 
                style={styles.videoCard}
                onPress={() => navigation.navigate("AbbaTvMain")}
              >
                <View style={styles.thumbnailContainer}>
                  <Image 
                    source={{ uri: primeiroVideoAbbaTv.thumbnail }} 
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                  <View style={styles.playOverlay}>
                    <View style={styles.playButton}>
                      <Ionicons name="play" size={24} color="#fff" />
                    </View>
                  </View>
                </View>
                <View style={styles.videoInfo}>
                  <Text style={styles.videoTitle}>{primeiroVideoAbbaTv.title}</Text>
                  <Text style={styles.videoMeta}>
                    {primeiroVideoAbbaTv.pastor} • {primeiroVideoAbbaTv.date}
                  </Text>
                  <Text style={styles.videoDescription} numberOfLines={2}>
                    {primeiroVideoAbbaTv.description}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => navigation.navigate("AbbaTvMain")}
              >
                <Text style={styles.viewAllText}>VER TODOS OS VÍDEOS</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Seção Programação */}
        <View style={styles.section}>
          <SectionHeader
            title="Programação"
            section="programacao"
            onToggle={() => toggleSection("programacao")}
          />

          {expandedSections.programacao && (
            <View style={styles.sectionContent}>
              {programacaoFixa.map((item, index) => (
                <View key={index} style={styles.programacaoItem}>
                  <View style={styles.programacaoInfo}>
                    <Text style={styles.programacaoDia}>{item.dia}</Text>
                    <Text style={styles.programacaoEvento}>{item.evento}</Text>
                  </View>
                  <View style={styles.programacaoHorario}>
                    <Ionicons name="time-outline" size={16} color="#B8986A" />
                    <Text style={styles.programacaoHora}>{item.horario}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Botão Rádio ABBA Church */}
        <TouchableOpacity 
          style={styles.radioButton}
          onPress={() => navigation.navigate("RadioMain")}
        >
          <View style={styles.radioContent}>
            <Ionicons name="radio" size={24} color="#fff" />
            <Text style={styles.radioText}>Rádio ABBA Church</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  containerHome: {
    backgroundColor: "#e0e0e0",
    flex: 1,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  notLoggedContainer: {
    padding: 16,
    alignItems: "center",
  },
  notLoggedText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
  },
  loginButton: {
    backgroundColor: "#B8986A",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 8,
  },
  registerButton: {
    backgroundColor: "#555",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  adminSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  adminMasterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007aff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  memberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  adminIcon: {
    marginRight: 10,
  },
  adminButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  versiculoContainer: {
    backgroundColor: "#fff",
    margin: 15,
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#B8986A",
  },
  versiculoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  versiculoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#B8986A",
    marginLeft: 8,
  },
  versiculoTexto: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    marginBottom: 10,
    fontStyle: "italic",
  },
  versiculoReferencia: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
    textAlign: "right",
  },
  section: {
    backgroundColor: "#fff",
    margin: 15,
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  toggleText: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
  },
  sectionContent: {
    padding: 20,
  },
  eventoMinisterio: {
    marginBottom: 15,
  },
  ministerioTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#B8986A",
    marginBottom: 10,
    letterSpacing: 1,
  },
  eventoItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#B8986A",
  },
  eventoNome: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  eventoDetalhes: {
    marginBottom: 8,
  },
  eventoInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  eventoTexto: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
  },
  eventoDescricao: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  nenhumEventoText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingVertical: 10,
  },
  videoCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 15,
  },
  thumbnailContainer: {
    position: "relative",
    height: 180,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  playButton: {
    width: 50,
    height: 50,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  videoInfo: {
    padding: 15,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  videoMeta: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  videoDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  programacaoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  programacaoInfo: {
    flex: 1,
  },
  programacaoDia: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  programacaoEvento: {
    fontSize: 13,
    color: "#666",
  },
  programacaoHorario: {
    flexDirection: "row",
    alignItems: "center",
  },
  programacaoHora: {
    fontSize: 14,
    color: "#B8986A",
    fontWeight: "600",
    marginLeft: 4,
  },
  viewAllButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  viewAllText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    letterSpacing: 1,
  },
  radioButton: {
    backgroundColor: "#B8986A",
    marginHorizontal: 15,
    marginBottom: 30,
    marginTop: 10,
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  radioContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
  },
  // Estilos de debug
  debugContainer: {
    backgroundColor: "#f0f0f0",
    margin: 15,
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  debugText: {
    fontSize: 12,
    color: "#333",
    marginBottom: 2,
  },
});