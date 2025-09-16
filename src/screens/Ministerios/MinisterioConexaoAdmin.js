// MinisterioConexaoAdmin.js - Ministério de Conexão e Acolhimento - VERSÃO MELHORADA
import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../context/AuthContext";
import { db } from "../../Firebase/FirebaseConfig";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  where,
} from "firebase/firestore";

// Lista de bairros de Varginha
const BAIRROS_VARGINHA = [
  "Aeroporto", "Alta Villa", "Alto da Figueira II", "Alto da Figueira III",
  "Área Rural de Varginha", "Bela Vista", "Bom Pastor", "Campos Elíseos",
  "Centro", "Condomínio Lagamar", "Condomínio Pássaro", "Condomínio Residencial Urupês",
  "Conjunto Habitacional Centenário", "Conjunto Habitacional Sion", "Conjunto Habitacional Sion II",
  "Conjunto Minas Gerais", "Conjunto Residencial Jetcon", "Cruzeiro do Sul", "Damasco",
  "Distrito Industrial Cláudio Galvão Nogueira", "Distrito Industrial Miguel de Luca",
  "Dos Carvalhos", "Eldorado", "Fausto Ribeiro", "Imaculada Conceição", "Imperial",
  "Industrial JK", "Industrial Reinaldo Foresti", "Jardim Alvorada", "Jardim Andere",
  "Jardim Atlântico Sul", "Jardim Áurea", "Jardim Bouganville", "Jardim Canaã",
  "Jardim Cidade Nova", "Jardim Colonial", "Jardim Corcetti I", "Jardim das Oliveiras",
  "Jardim dos Pássaros", "Jardim Estrela I", "Jardim Estrela II", "Jardim Europa",
  "Jardim Itália", "Jardim Mariana", "Jardim Mont Serrat", "Jardim Morada do Sol",
  "Jardim Oriente", "Jardim Orlândia", "Jardim Panorama", "Jardim Petrópolis",
  "Jardim Renata", "Jardim Ribeiro", "Jardim Rio Verde", "Jardim Santa Mônica",
  "Jardim Santa Tereza", "Jardim São Joaquim", "Jardim Simões", "Jardim Sion",
  "Jardim Vale dos Ipês", "Jardim Vale Verde", "Jardim Zinoca", "Lagamar",
  "Loteamento Sete de Outubro", "Minas Gerais", "Nossa Senhora Aparecida",
  "Nossa Senhora das Graças III", "Nossa Senhora de Fátima", "Nossa Senhora de Lourdes",
  "Nova Varginha", "Novo Horizonte", "Padre Vitor", "Park Imperial", "Park Rinaldo",
  "Parque Alto da Figueira", "Parque Boa Vista", "Parque Catanduvas", "Parque das Acácias",
  "Parque das Américas", "Parque das Grevíleas", "Parque de Exposições", "Parque Ileana",
  "Parque Mariela", "Parque Nossa Senhora das Graças", "Parque Ozanam",
  "Parque Residencial Jardins do Ágape", "Parque Residencial Rio Verde", "Parque Retiro",
  "Parque São José", "Parque Urupês", "Parque Urupês III", "Penedo", "Pinheiros",
  "Primavera", "Princesa do Sul", "Residencial Alto Pinheiros", "Residencial Belo Horizonte",
  "Residencial Parque Imperador", "Residencial Vale das Palmeiras", "Rezende",
  "Rio Verde II", "Riviera do Lago", "Sagrado Coração", "Sagrado Coração II",
  "San Marino", "Santa Luiza", "Santa Maria", "Santa Terezinha", "Santana",
  "São Francisco", "São José", "São Lucas", "São Miguel Arcanjo", "São Sebastião",
  "Três Bicas", "Treviso", "Vargem", "Vila Adelaide", "Vila Andere I", "Vila Andere II",
  "Vila Avelar", "Vila Barcelona", "Vila Belmiro", "Vila Bueno", "Vila do Pontal",
  "Vila Dona Josefina", "Vila Flamengo", "Vila Floresta", "Vila Ipiranga", "Vila Isabel",
  "Vila Limborco", "Vila Maria", "Vila Maristela", "Vila Martins", "Vila Mendes",
  "Vila Monte Castelo", "Vila Monteiro", "Vila Morais", "Vila Murad", "Vila Nogueira",
  "Vila Nossa Senhora dos Anjos", "Vila Paiva", "Vila Pinto", "Vila Registânea",
  "Vila Santa Cruz", "Vila São Geraldo", "Vila Verde", "Vila Verônica"
];

// Etapas dos visitantes
const ETAPAS_VISITANTE = [
  { id: "primeira_visita", label: "Primeira Visita", icon: "hand-left", color: "#3498db" },
  { id: "encaminhamento_celula", label: "Encaminhamento para Célula", icon: "people", color: "#f39c12" },
  { id: "pedido_oracao", label: "Pedido de Oração", icon: "heart", color: "#e74c3c" }
];

export default function MinisterioConexaoAdmin({ navigation }) {
  const { user, userData } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("visitantes");

  // Estados dos Visitantes
  const [visitantes, setVisitantes] = useState([]);
  const [visitantesConcluidos, setVisitantesConcluidos] = useState([]);
  const [visitanteModalVisible, setVisitanteModalVisible] = useState(false);
  const [editingVisitante, setEditingVisitante] = useState(null);
  const [etapaModalVisible, setEtapaModalVisible] = useState(false);
  const [selectedVisitante, setSelectedVisitante] = useState(null);
  // NOVO: Estados para controlar expansão dos concluídos
  const [concluidosExpanded, setConcluidosExpanded] = useState(false);

  // NOVO: Estados para os relatórios
  const [relatoriosEnviados, setRelatoriosEnviados] = useState([]);
  const [enviarRelatorioModalVisible, setEnviarRelatorioModalVisible] = useState(false);
  const [observacoesRelatorio, setObservacoesRelatorio] = useState("");
  // Estado para controlar expansão da lista de visitantes
  const [visitantesExpanded, setVisitantesExpanded] = useState(false);

  const [visitanteForm, setVisitanteForm] = useState({
    nomeCompleto: "",
    telefone: "",
    bairro: "",
    observacoes: ""
  });

  // Estados para busca de bairro
  const [bairroSearchText, setBairroSearchText] = useState("");
  const [bairroSuggestions, setBairroSuggestions] = useState([]);
  const [showBairroSuggestions, setShowBairroSuggestions] = useState(false);

  // Estados dos Relatórios
  const [relatorioStats, setRelatorioStats] = useState({
    primeira_visita: 0,
    encaminhamento_celula: 0,
    pedido_oracao: 0,
    nao_atribuidos: 0,
    total: 0,
    concluidos: 0
  });

  const userName = userData?.name || user?.displayName || "Líder";

  // Carregar dados ao iniciar
  useEffect(() => {
    loadAllData();
  }, []);

  // Recalcular estatísticas sempre que visitantes ou concluídos mudarem
  useEffect(() => {
    calculateStats(visitantes, visitantesConcluidos);
  }, [visitantes, visitantesConcluidos]);

 const loadAllData = async () => {
    setLoading(true);
    try {
      await loadVisitantes();
      const concluidosData = await loadVisitantesConcluidos();
      await loadRelatoriosEnviados(); // ADICIONAR
      
      const visitantesAtivos = visitantes.length > 0 ? visitantes : [];
      calculateStats(visitantesAtivos, concluidosData);
    } catch (error) {
      console.log("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar visitantes em acompanhamento
  const loadVisitantes = async () => {
    try {
      const visitantesRef = collection(db, "churchBasico", "ministerios", "conteudo", "conexao", "visitantes");
      const q = query(visitantesRef, orderBy("criadoEm", "desc"));
      const querySnapshot = await getDocs(q);
      
      const visitantesData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.concluido) { // Só visitantes não concluídos
          visitantesData.push({ id: doc.id, ...data });
        }
      });
      
      setVisitantes(visitantesData);
      console.log("Visitantes em acompanhamento:", visitantesData.length);
    } catch (error) {
      console.log("Erro ao carregar visitantes:", error);
    }
  };

  // Carregar visitantes concluídos
  const loadVisitantesConcluidos = async () => {
    try {
      const visitantesRef = collection(db, "churchBasico", "ministerios", "conteudo", "conexao", "visitantes");
      // Removendo orderBy para evitar erro de índice
      const q = query(visitantesRef, where("concluido", "==", true));
      const querySnapshot = await getDocs(q);
      
      const concluidosData = [];
      querySnapshot.forEach((doc) => {
        concluidosData.push({ id: doc.id, ...doc.data() });
      });
      
      // Ordenar manualmente por data de conclusão (mais recentes primeiro)
      concluidosData.sort((a, b) => {
        if (!a.concluidoEm || !b.concluidoEm) return 0;
        return b.concluidoEm.seconds - a.concluidoEm.seconds;
      });
      
      setVisitantesConcluidos(concluidosData);
      console.log("Visitantes concluídos carregados:", concluidosData.length);
      return concluidosData;
    } catch (error) {
      console.log("Erro ao carregar visitantes concluídos:", error);
      return [];
    }
  };
  // NOVO: Carregar relatórios enviados
  const loadRelatoriosEnviados = async () => {
    try {
      const relatoriosRef = collection(db, "churchBasico", "ministerios", "conteudo", "conexao", "RelatorioConexao");
      const q = query(relatoriosRef, orderBy("criadoEm", "desc"));
      const querySnapshot = await getDocs(q);
      
      const relatoriosData = [];
      querySnapshot.forEach((doc) => {
        relatoriosData.push({ id: doc.id, ...doc.data() });
      });
      
      setRelatoriosEnviados(relatoriosData);
    } catch (error) {
      console.log("Erro ao carregar relatórios:", error);
    }
  };

  // NOVO: Enviar relatório para o Firebase
const enviarRelatorio = async () => {
  try {
    setLoading(true);

    const dadosRelatorio = {
      geradoPor: userName,
      geradoPorId: user.uid,
      criadoEm: serverTimestamp(),
      
      estatisticasGerais: {
        totalVisitantes: visitantes.length,
        totalConcluidos: visitantesConcluidos.length,
        totalGeral: visitantes.length + visitantesConcluidos.length
      },

      estatisticasPorEtapa: {
        primeira_visita: relatorioStats.primeira_visita,
        encaminhamento_celula: relatorioStats.encaminhamento_celula,
        pedido_oracao: relatorioStats.pedido_oracao,
        nao_atribuidos: relatorioStats.nao_atribuidos
      },

      // NOVO: Estatísticas de concluídos por etapa
      estatisticasConcluidosPorEtapa: {
        primeira_visita: visitantesConcluidos.filter(v => v.etapa === 'primeira_visita').length,
        encaminhamento_celula: visitantesConcluidos.filter(v => v.etapa === 'encaminhamento_celula').length,
        pedido_oracao: visitantesConcluidos.filter(v => v.etapa === 'pedido_oracao').length,
        nao_atribuidos: visitantesConcluidos.filter(v => !v.etapa || v.etapa === 'nao_atribuido').length
      },

      visitantesAtivos: visitantes.map(v => ({
        nome: v.nomeCompleto,
        bairro: v.bairro,
        telefone: v.telefone,
        etapa: v.etapa || "nao_atribuido",
        etapaLabel: getEtapaInfo(v.etapa)?.label || "Não Atribuído",
        observacoes: v.observacoes || ""
      })),

      observacoes: observacoesRelatorio.trim()
    };

    const relatorioId = `relatorio_${Date.now()}`;
    const relatorioRef = doc(db, "churchBasico", "ministerios", "conteudo", "conexao", "RelatorioConexao", relatorioId);
    
    await setDoc(relatorioRef, dadosRelatorio);

    Alert.alert(
      "Relatório Enviado!",
      "O relatório foi enviado com sucesso para a liderança.",
      [{ text: "OK", onPress: () => {
        setEnviarRelatorioModalVisible(false);
        setObservacoesRelatorio("");
        loadRelatoriosEnviados();
      }}]
    );

  } catch (error) {
    console.log("Erro ao enviar relatório:", error);
    Alert.alert("Erro", "Não foi possível enviar o relatório.");
  } finally {
    setLoading(false);
  }
};


  // NOVO: Desfazer conclusão de visitante
  const desfazerConclusao = (visitante) => {
    Alert.alert(
      "Desfazer Conclusão",
      `Tem certeza que deseja reativar o acompanhamento de ${visitante.nomeCompleto}? O visitante voltará para a lista de visitantes ativos.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Reativar",
          style: "default",
          onPress: async () => {
            try {
              setLoading(true);
              
              const visitanteRef = doc(db, "churchBasico", "ministerios", "conteudo", "conexao", "visitantes", visitante.id);
              await updateDoc(visitanteRef, {
                concluido: false,
                concluidoEm: null,
                concluidoPor: null,
                reativadoEm: serverTimestamp(),
                reativadoPor: userName,
                atualizadoEm: serverTimestamp()
              });

              Alert.alert("Sucesso", "Visitante reativado com sucesso!");
              await loadAllData();
              
            } catch (error) {
              console.log("Erro ao reativar visitante:", error);
              Alert.alert("Erro", "Não foi possível reativar o visitante.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };
  // Calcular estatísticas para o relatório
  const calculateStats = (visitantesData, concluidosData = visitantesConcluidos) => {
    const stats = {
      primeira_visita: 0,
      encaminhamento_celula: 0,
      pedido_oracao: 0,
      nao_atribuidos: 0,
      total: visitantesData.length,
      concluidos: concluidosData.length
    };

    visitantesData.forEach(visitante => {
      if (visitante.etapa) {
        stats[visitante.etapa]++;
      } else {
        stats.nao_atribuidos++;
      }
    });

    setRelatorioStats(stats);
  };

  // Buscar bairros baseado no texto digitado
  const searchBairros = (text) => {
    setBairroSearchText(text);
    setVisitanteForm(prev => ({ ...prev, bairro: text }));

    if (text.length >= 2) {
      const filtered = BAIRROS_VARGINHA.filter(bairro =>
        bairro.toLowerCase().includes(text.toLowerCase())
      );
      setBairroSuggestions(filtered);
      setShowBairroSuggestions(true);
    } else {
      setBairroSuggestions([]);
      setShowBairroSuggestions(false);
    }
  };

  // Selecionar bairro da lista de sugestões
  const selectBairro = (bairro) => {
    setBairroSearchText(bairro);
    setVisitanteForm(prev => ({ ...prev, bairro: bairro }));
    setShowBairroSuggestions(false);
    setBairroSuggestions([]);
  };

  // Resetar formulário de visitante
  const resetVisitanteForm = () => {
    setVisitanteForm({
      nomeCompleto: "",
      telefone: "",
      bairro: "",
      observacoes: ""
    });
    setBairroSearchText("");
    setBairroSuggestions([]);
    setShowBairroSuggestions(false);
    setEditingVisitante(null);
  };

  // Abrir modal para novo visitante
  const openAddVisitanteModal = () => {
    resetVisitanteForm();
    setVisitanteModalVisible(true);
  };

  // Abrir modal para editar visitante
  const openEditVisitanteModal = (visitante) => {
    setEditingVisitante(visitante);
    setVisitanteForm({
      nomeCompleto: visitante.nomeCompleto || "",
      telefone: visitante.telefone || "",
      bairro: visitante.bairro || "",
      observacoes: visitante.observacoes || ""
    });
    setBairroSearchText(visitante.bairro || "");
    setVisitanteModalVisible(true);
  };

  // Abrir modal para atribuir etapa
  const openEtapaModal = (visitante) => {
    setSelectedVisitante(visitante);
    setEtapaModalVisible(true);
  };

  // Salvar visitante (sem etapa inicial)
  const saveVisitante = async () => {
    if (!visitanteForm.nomeCompleto.trim()) {
      Alert.alert("Erro", "Por favor, informe o nome completo do visitante.");
      return;
    }

    if (!visitanteForm.telefone.trim()) {
      Alert.alert("Erro", "Por favor, informe o telefone do visitante.");
      return;
    }

    if (!visitanteForm.bairro.trim()) {
      Alert.alert("Erro", "Por favor, selecione o bairro do visitante.");
      return;
    }

    try {
      setLoading(true);

      const visitanteData = {
        nomeCompleto: visitanteForm.nomeCompleto.trim(),
        telefone: visitanteForm.telefone.trim(),
        bairro: visitanteForm.bairro.trim(),
        observacoes: visitanteForm.observacoes.trim(),
        etapa: null, // Sem etapa inicial
        concluido: false,
        registradoPor: user.uid,
        registradoPorNome: userName,
        criadoEm: editingVisitante ? editingVisitante.criadoEm : serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      };

      const visitanteId = editingVisitante ? editingVisitante.id : `visitante_${Date.now()}`;
      const visitanteRef = doc(db, "churchBasico", "ministerios", "conteudo", "conexao", "visitantes", visitanteId);

      await setDoc(visitanteRef, visitanteData);
      
      Alert.alert(
        "Sucesso", 
        editingVisitante ? "Visitante atualizado com sucesso!" : "Visitante cadastrado com sucesso!"
      );

      setVisitanteModalVisible(false);
      resetVisitanteForm();
      await loadVisitantes();

    } catch (error) {
      console.log("Erro ao salvar visitante:", error);
      Alert.alert("Erro", `Não foi possível salvar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Atribuir etapa ao visitante
  const atribuirEtapa = async (etapaId) => {
    if (!selectedVisitante) return;

    try {
      setLoading(true);
      
      const visitanteRef = doc(db, "churchBasico", "ministerios", "conteudo", "conexao", "visitantes", selectedVisitante.id);
      await updateDoc(visitanteRef, {
        etapa: etapaId,
        etapaAtribuidaEm: serverTimestamp(),
        etapaAtribuidaPor: userName,
        atualizadoEm: serverTimestamp()
      });

      setEtapaModalVisible(false);
      setSelectedVisitante(null);
      await loadVisitantes();
      Alert.alert("Sucesso", "Etapa atribuída com sucesso!");

    } catch (error) {
      console.log("Erro ao atribuir etapa:", error);
      Alert.alert("Erro", "Não foi possível atribuir a etapa.");
    } finally {
      setLoading(false);
    }
  };

  // Concluir acompanhamento do visitante
  const concluirAcompanhamento = (visitante) => {
    Alert.alert(
      "Concluir Acompanhamento",
      `Tem certeza que deseja concluir o acompanhamento de ${visitante.nomeCompleto}? O visitante será movido para a lista de concluídos.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Concluir",
          style: "default",
          onPress: async () => {
            try {
              setLoading(true);
              
              const visitanteRef = doc(db, "churchBasico", "ministerios", "conteudo", "conexao", "visitantes", visitante.id);
              await updateDoc(visitanteRef, {
                concluido: true,
                concluidoEm: serverTimestamp(),
                concluidoPor: userName,
                atualizadoEm: serverTimestamp()
              });

              console.log("Visitante marcado como concluído:", visitante.nomeCompleto);
              Alert.alert("Sucesso", "Acompanhamento concluído com sucesso!");
              
              // Recarregar TODOS os dados
              await loadVisitantes(); // Remove da lista de ativos
              const concluidosData = await loadVisitantesConcluidos(); // Adiciona na lista de concluídos
              calculateStats(visitantes.filter(v => v.id !== visitante.id), concluidosData); // Recalcula stats
              
            } catch (error) {
              console.log("Erro ao concluir acompanhamento:", error);
              Alert.alert("Erro", "Não foi possível concluir o acompanhamento.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Deletar visitante
  const deleteVisitante = (visitante) => {
    Alert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja remover ${visitante.nomeCompleto}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await deleteDoc(doc(db, "churchBasico", "ministerios", "conteudo", "conexao", "visitantes", visitante.id));
              Alert.alert("Sucesso", "Visitante removido com sucesso!");
              await loadAllData();
            } catch (error) {
              console.log("Erro ao remover visitante:", error);
              Alert.alert("Erro", "Não foi possível remover. Tente novamente.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Obter informações da etapa
  const getEtapaInfo = (etapaId) => {
    return ETAPAS_VISITANTE.find(etapa => etapa.id === etapaId) || null;
  };

  // Obter estatísticas dos visitantes
  const getVisitantesStats = () => {
    return { total: visitantes.length };
  };

  // Renderizar lista de visitantes
  const renderVisitantes = () => {
    const stats = getVisitantesStats();
    const visitantesToShow = visitantesExpanded ? visitantes : visitantes.slice(0, 3);

    return (
      <ScrollView style={styles.container}>
        <View style={styles.visitantesHeader}>
          <Text style={styles.tabTitle}>Visitantes em Acompanhamento</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="people" size={24} color="#B8986A" />
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total de Visitantes</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.addButton} onPress={openAddVisitanteModal}>
            <Ionicons name="person-add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Cadastrar Visitante</Text>
          </TouchableOpacity>
        </View>

        {/* CARD EXPANSÍVEL DE VISITANTES */}
        <View style={styles.visitantesExpandableCard}>
          <View style={styles.visitantesCardHeader}>
            <Text style={styles.visitantesCardTitle}>
              Lista de Visitantes ({visitantes.length})
            </Text>
            
            {visitantes.length > 3 && (
              <TouchableOpacity 
                style={styles.visitantesExpandButton}
                onPress={() => setVisitantesExpanded(!visitantesExpanded)}
              >
                <Text style={styles.visitantesExpandText}>
                  {visitantesExpanded ? "Mostrar menos" : `Ver todos (${visitantes.length})`}
                </Text>
                <Ionicons 
                  name={visitantesExpanded ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#B8986A" 
                />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.visitantesExpandedContent}>
            {visitantesToShow.length > 0 ? (
              <FlatList
                data={visitantesToShow}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => {
                  const etapaInfo = getEtapaInfo(item.etapa);
                  return (
                    <TouchableOpacity 
                      style={styles.visitanteCard}
                      onPress={() => openEtapaModal(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.visitanteContent}>
                        <View style={styles.visitanteHeader}>
                          <Text style={styles.visitanteNome}>{item.nomeCompleto}</Text>
                          {etapaInfo ? (
                            <View style={[styles.etapaBadge, { backgroundColor: etapaInfo.color }]}>
                              <Ionicons name={etapaInfo.icon} size={12} color="#fff" />
                              <Text style={styles.etapaBadgeText}>{etapaInfo.label}</Text>
                            </View>
                          ) : (
                            <View style={[styles.etapaBadge, { backgroundColor: "#999" }]}>
                              <Ionicons name="help" size={12} color="#fff" />
                              <Text style={styles.etapaBadgeText}>Não Atribuído</Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.visitanteInfo}>
                          <Text style={styles.visitanteDetail}>📞 {item.telefone}</Text>
                          <Text style={styles.visitanteDetail}>📍 {item.bairro}</Text>
                          {item.observacoes && (
                            <Text style={styles.visitanteObservacoes}>📝 {item.observacoes}</Text>
                          )}
                        </View>

                        <Text style={styles.clickHint}>Toque para atribuir/alterar etapa</Text>
                      </View>

                      <View style={styles.visitanteActions}>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            openEditVisitanteModal(item);
                          }}
                        >
                          <Ionicons name="pencil" size={18} color="#B8986A" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={styles.concludeButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            concluirAcompanhamento(item);
                          }}
                        >
                          <Ionicons name="checkmark-circle" size={14} color="#50C878" />
                          <Text style={styles.concludeButtonText}>Concluir</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            deleteVisitante(item);
                          }}
                        >
                          <Ionicons name="trash" size={18} color="#ff4444" />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                }}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <Text style={styles.emptyText}>Nenhum visitante cadastrado ainda</Text>
            )}
          </View>
        </View>
      </ScrollView>
    );
  };

  // Renderizar relatório
  const renderRelatorio = () => (
    <View style={styles.container}>
      <View style={styles.relatorioHeader}>
        <Text style={styles.tabTitle}>Relatórios</Text>
        
        <View style={styles.relatorioHeaderActions}>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={() => {
              setLoading(true);
              loadAllData().finally(() => setLoading(false));
            }}
          >
            <Ionicons name="refresh" size={16} color="#666" />
            <Text style={styles.refreshButtonText}>Atualizar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.sendReportButton} 
            onPress={() => setEnviarRelatorioModalVisible(true)}
          >
            <Ionicons name="send" size={16} color="#fff" />
            <Text style={styles.sendReportButtonText}>Enviar Relatório</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.relatorioContent}>
        {/* Lista de Relatórios Enviados */}
        {relatoriosEnviados.length > 0 && (
          <View style={styles.relatorioCard}>
            <Text style={styles.relatorioCardTitle}>Relatórios Enviados</Text>
            
            {relatoriosEnviados.slice(0, 3).map((relatorio) => {
              const dataEnvio = relatorio.criadoEm ? 
                new Date(relatorio.criadoEm.seconds * 1000).toLocaleString('pt-BR') : 
                'Data não disponível';
              
              return (
                <View key={relatorio.id} style={styles.relatorioEnviadoItem}>
                  <View style={styles.relatorioEnviadoHeader}>
                    <Ionicons name="document-text" size={20} color="#B8986A" />
                    <View style={styles.relatorioEnviadoInfo}>
                      <Text style={styles.relatorioEnviadoData}>{dataEnvio}</Text>
                      <Text style={styles.relatorioEnviadoDetalhes}>
                        {relatorio.estatisticasGerais?.totalVisitantes || 0} visitantes • {relatorio.estatisticasGerais?.totalConcluidos || 0} concluídos
                      </Text>
                    </View>
                  </View>
                  <View style={styles.relatorioEnviadoStatus}>
                    <Ionicons name="checkmark-circle" size={16} color="#50C878" />
                    <Text style={styles.relatorioEnviadoStatusText}>Enviado</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Card de estatísticas gerais */}
        <View style={styles.relatorioCard}>
          <Text style={styles.relatorioCardTitle}>Estatísticas Gerais</Text>
          
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={32} color="#B8986A" />
              <Text style={styles.statBigNumber}>{relatorioStats.total}</Text>
              <Text style={styles.statBigLabel}>Em Acompanhamento</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={32} color="#50C878" />
              <Text style={styles.statBigNumber}>{relatorioStats.concluidos}</Text>
              <Text style={styles.statBigLabel}>Concluídos</Text>
            </View>
          </View>
        </View>

        {/* Card de Visitantes Não Atribuídos */}
        {relatorioStats.nao_atribuidos > 0 && (
          <View style={[styles.alertCard]}>
            <View style={styles.alertCardHeader}>
              <Ionicons name="alert-circle" size={24} color="#ff6b35" />
              <Text style={styles.alertCardTitle}>Visitantes Não Atribuídos</Text>
            </View>
            
            <Text style={styles.alertCardNumber}>{relatorioStats.nao_atribuidos}</Text>
            <Text style={styles.alertCardText}>
              Visitantes aguardando atribuição de etapa. Clique nos visitantes na aba "Visitantes" para atribuir uma etapa.
            </Text>
          </View>
        )}

        {/* Cards de etapas */}
        {ETAPAS_VISITANTE.map((etapa) => {
          const count = relatorioStats[etapa.id];
          const percentage = relatorioStats.total > 0 ? (count / relatorioStats.total * 100).toFixed(1) : 0;
          
          if (count === 0) return null;
          
          return (
            <View key={etapa.id} style={[styles.etapaCard, { borderLeftColor: etapa.color }]}>
              <View style={styles.etapaCardHeader}>
                <Ionicons name={etapa.icon} size={24} color={etapa.color} />
                <Text style={styles.etapaCardTitle}>{etapa.label}</Text>
              </View>
              
              <View style={styles.etapaCardStats}>
                <Text style={[styles.etapaCardNumber, { color: etapa.color }]}>{count}</Text>
                <Text style={styles.etapaCardPercentage}>{percentage}%</Text>
              </View>
              
              <View style={[styles.etapaProgressBar, { backgroundColor: `${etapa.color}20` }]}>
                <View 
                  style={[
                    styles.etapaProgressFill, 
                    { backgroundColor: etapa.color, width: `${percentage}%` }
                  ]} 
                />
              </View>
            </View>
          );
        })}

        {/* Lista de visitantes por etapa */}
        <View style={styles.relatorioCard}>
          <Text style={styles.relatorioCardTitle}>Detalhamento por Etapa</Text>
          
          {relatorioStats.nao_atribuidos > 0 && (
            <View style={styles.etapaDetailSection}>
              <View style={styles.etapaDetailHeader}>
                <Ionicons name="help" size={16} color="#999" />
                <Text style={[styles.etapaDetailTitle, { color: "#999" }]}>
                  Não Atribuídos ({relatorioStats.nao_atribuidos})
                </Text>
              </View>
              
              {visitantes.filter(v => !v.etapa).map((visitante) => (
                <Text key={visitante.id} style={styles.etapaDetailItem}>
                  • {visitante.nomeCompleto} - {visitante.bairro}
                </Text>
              ))}
            </View>
          )}

          {ETAPAS_VISITANTE.map((etapa) => {
            const visitantesDaEtapa = visitantes.filter(v => v.etapa === etapa.id);
            
            if (visitantesDaEtapa.length === 0) return null;
            
            return (
              <View key={etapa.id} style={styles.etapaDetailSection}>
                <View style={styles.etapaDetailHeader}>
                  <Ionicons name={etapa.icon} size={16} color={etapa.color} />
                  <Text style={[styles.etapaDetailTitle, { color: etapa.color }]}>
                    {etapa.label} ({visitantesDaEtapa.length})
                  </Text>
                </View>
                
                {visitantesDaEtapa.map((visitante) => (
                  <Text key={visitante.id} style={styles.etapaDetailItem}>
                    • {visitante.nomeCompleto} - {visitante.bairro}
                  </Text>
                ))}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  // NOVO: Renderizar visitantes concluídos com card expansível
  const renderConcluidos = () => {
    const concluidosToShow = concluidosExpanded ? visitantesConcluidos : visitantesConcluidos.slice(0, 5);
    
    return (
      <View style={styles.container}>
        <View style={styles.concluidosHeader}>
          <Text style={styles.tabTitle}>Visitantes Concluídos</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={24} color="#50C878" />
              <Text style={styles.statNumber}>{visitantesConcluidos.length}</Text>
              <Text style={styles.statLabel}>Total Concluídos</Text>
            </View>
          </View>
        </View>

        {/* CARD EXPANSÍVEL DE CONCLUÍDOS */}
        <View style={styles.concluidosExpandableCard}>
          <View style={styles.concluidosCardHeader}>
            <Text style={styles.concluidosCardTitle}>
              Lista de Concluídos ({visitantesConcluidos.length})
            </Text>
            
            {visitantesConcluidos.length > 5 && (
              <TouchableOpacity 
                style={styles.concluidosExpandButton}
                onPress={() => setConcluidosExpanded(!concluidosExpanded)}
              >
                <Text style={styles.concluidosExpandText}>
                  {concluidosExpanded ? "Mostrar menos" : `Ver todos (${visitantesConcluidos.length})`}
                </Text>
                <Ionicons 
                  name={concluidosExpanded ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#50C878" 
                />
              </TouchableOpacity>
            )}
          </View>
          
          <ScrollView style={styles.concluidosExpandedContent}>
            {concluidosToShow.length > 0 ? (
              concluidosToShow.map((item) => {
                const etapaInfo = getEtapaInfo(item.etapa);
                const dataConclusao = item.concluidoEm ? 
                  new Date(item.concluidoEm.seconds * 1000).toLocaleDateString('pt-BR') : 
                  'Data não disponível';
                
                return (
                  <View key={item.id} style={styles.concluidoCard}>
                    <View style={styles.concluidoContent}>
                      <View style={styles.concluidoHeader}>
                        <Text style={styles.concluidoNome}>{item.nomeCompleto}</Text>
                        <View style={styles.concluidoBadge}>
                          <Ionicons name="checkmark-circle" size={16} color="#50C878" />
                          <Text style={styles.concluidoBadgeText}>Concluído</Text>
                        </View>
                      </View>

                      <View style={styles.concluidoInfo}>
                        <Text style={styles.concluidoDetail}>📞 {item.telefone}</Text>
                        <Text style={styles.concluidoDetail}>📍 {item.bairro}</Text>
                        {etapaInfo && (
                          <Text style={styles.concluidoDetail}>
                            🎯 Última etapa: {etapaInfo.label}
                          </Text>
                        )}
                        <Text style={styles.concluidoDetail}>
                          ✅ Concluído por: {item.concluidoPor}
                        </Text>
                        <Text style={styles.concluidoDetail}>
                          📅 Data: {dataConclusao}
                        </Text>
                      </View>

                      {item.observacoes && (
                        <Text style={styles.concluidoObservacoes}>📝 {item.observacoes}</Text>
                      )}
                    </View>

                    {/* NOVO: Botão Desfazer */}
                    <View style={styles.concluidoActions}>
                      <TouchableOpacity
                        style={styles.undoButton}
                        onPress={() => desfazerConclusao(item)}
                      >
                        <Ionicons name="return-up-back" size={16} color="#ff6b35" />
                        <Text style={styles.undoButtonText}>Desfazer</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>Nenhum acompanhamento concluído ainda</Text>
            )}
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conexão - Admin</Text>
        <Text style={styles.leaderName}>{userName}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "visitantes" && styles.activeTab]}
          onPress={() => setActiveTab("visitantes")}
        >
          <Ionicons 
            name="people" 
            size={18} 
            color={activeTab === "visitantes" ? "#B8986A" : "#666"} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === "visitantes" && styles.activeTabText
          ]}>
            Visitantes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "relatorio" && styles.activeTab]}
          onPress={() => setActiveTab("relatorio")}
        >
          <Ionicons 
            name="analytics" 
            size={18} 
            color={activeTab === "relatorio" ? "#B8986A" : "#666"} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === "relatorio" && styles.activeTabText
          ]}>
            Relatório
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "concluidos" && styles.activeTab]}
          onPress={() => setActiveTab("concluidos")}
        >
          <Ionicons 
            name="checkmark-done" 
            size={18} 
            color={activeTab === "concluidos" ? "#B8986A" : "#666"} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === "concluidos" && styles.activeTabText
          ]}>
            Concluídos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#B8986A" />
          </View>
        )}

        {activeTab === "visitantes" && renderVisitantes()}
        {activeTab === "relatorio" && renderRelatorio()}
        {activeTab === "concluidos" && renderConcluidos()}
      </View>

      {/* Modal de Cadastrar/Editar Visitante */}
      <Modal
        visible={visitanteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setVisitanteModalVisible(false);
          resetVisitanteForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingVisitante ? "Editar Visitante" : "Cadastrar Visitante"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setVisitanteModalVisible(false);
                  resetVisitanteForm();
                }}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Nome Completo */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome Completo:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite o nome completo"
                  value={visitanteForm.nomeCompleto}
                  onChangeText={(text) => setVisitanteForm({ ...visitanteForm, nomeCompleto: text })}
                  autoFocus
                />
              </View>

              {/* Telefone */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Telefone:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="(35) 99999-9999"
                  value={visitanteForm.telefone}
                  onChangeText={(text) => setVisitanteForm({ ...visitanteForm, telefone: text })}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Bairro */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Bairro:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite o bairro..."
                  value={bairroSearchText}
                  onChangeText={searchBairros}
                />
                
                {showBairroSuggestions && bairroSuggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    <ScrollView 
                      style={styles.suggestionsList}
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={false}
                    >
                      {bairroSuggestions.slice(0, 5).map((item, index) => (
                        <TouchableOpacity
                          key={`${item}_${index}`}
                          style={styles.suggestionItem}
                          onPress={() => selectBairro(item)}
                        >
                          <Text style={styles.suggestionText}>{item}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Observações */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Observações:</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Observações sobre o visitante"
                  value={visitanteForm.observacoes}
                  onChangeText={(text) => setVisitanteForm({ ...visitanteForm, observacoes: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setVisitanteModalVisible(false);
                    resetVisitanteForm();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={saveVisitante}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {editingVisitante ? "Atualizar" : "Cadastrar"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Atribuição de Etapa */}
      <Modal
        visible={etapaModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setEtapaModalVisible(false);
          setSelectedVisitante(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Atribuir Etapa</Text>
              <TouchableOpacity
                onPress={() => {
                  setEtapaModalVisible(false);
                  setSelectedVisitante(null);
                }}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedVisitante && (
              <View style={styles.selectedVisitanteInfo}>
                <Text style={styles.selectedVisitanteNome}>{selectedVisitante.nomeCompleto}</Text>
                <Text style={styles.selectedVisitanteDetail}>{selectedVisitante.bairro}</Text>
                
                {selectedVisitante.etapa && (
                  <View style={styles.currentEtapaInfo}>
                    <Text style={styles.currentEtapaLabel}>Etapa atual:</Text>
                    <View style={styles.currentEtapaBadge}>
                      <Text style={styles.currentEtapaText}>
                        {getEtapaInfo(selectedVisitante.etapa)?.label || "Não definida"}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            <Text style={styles.etapaSelectionTitle}>Selecione a nova etapa:</Text>

            <View style={styles.etapaSelectionList}>
              {ETAPAS_VISITANTE.map((etapa) => (
                <TouchableOpacity
                  key={etapa.id}
                  style={styles.etapaSelectionItem}
                  onPress={() => atribuirEtapa(etapa.id)}
                >
                  <Ionicons 
                    name={etapa.icon} 
                    size={24} 
                    color={etapa.color} 
                  />
                  <Text style={[styles.etapaSelectionItemText, { color: etapa.color }]}>
                    {etapa.label}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="#ccc" />
                </TouchableOpacity>
              ))}
            </View>

            {selectedVisitante?.etapa && (
              <TouchableOpacity
                style={styles.removeEtapaButton}
                onPress={() => atribuirEtapa(null)}
              >
                <Ionicons name="remove-circle" size={20} color="#ff4444" />
                <Text style={styles.removeEtapaText}>Remover Etapa</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
      // NOVO: Modal de Enviar Relatório com estatísticas detalhadas
<Modal
  visible={enviarRelatorioModalVisible}
  animationType="slide"
  transparent={true}
  onRequestClose={() => {
    setEnviarRelatorioModalVisible(false);
    setObservacoesRelatorio("");
  }}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Enviar Relatório</Text>
        <TouchableOpacity
          onPress={() => {
            setEnviarRelatorioModalVisible(false);
            setObservacoesRelatorio("");
          }}
        >
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.relatorioPreview}>
          <Text style={styles.relatorioPreviewTitle}>Resumo do Relatório</Text>
          
          {/* Estatísticas Gerais */}
          <View style={styles.relatorioPreviewStats}>
            <View style={styles.relatorioPreviewStatItem}>
              <Text style={styles.relatorioPreviewStatNumber}>{visitantes.length}</Text>
              <Text style={styles.relatorioPreviewStatLabel}>Visitantes Ativos</Text>
            </View>
            <View style={styles.relatorioPreviewStatItem}>
              <Text style={styles.relatorioPreviewStatNumber}>{visitantesConcluidos.length}</Text>
              <Text style={styles.relatorioPreviewStatLabel}>Concluídos</Text>
            </View>
            <View style={styles.relatorioPreviewStatItem}>
              <Text style={styles.relatorioPreviewStatNumber}>{visitantes.length + visitantesConcluidos.length}</Text>
              <Text style={styles.relatorioPreviewStatLabel}>Total Geral</Text>
            </View>
          </View>

          {/* NOVO: Estatísticas Detalhadas por Etapa */}
          <View style={styles.etapasDetalhadas}>
            <Text style={styles.etapasDetalhadasTitle}>Estatísticas por Etapa</Text>
            
            {/* Primeira Visita */}
            <View style={styles.etapaDetalhadaItem}>
              <View style={styles.etapaDetalhadaHeader}>
                <View style={styles.etapaDetalhadaIcon}>
                  <Ionicons name="person-add" size={16} color="#4CAF50" />
                </View>
                <Text style={styles.etapaDetalhadaNome}>Primeira Visita</Text>
              </View>
              <View style={styles.etapaDetalhadaStats}>
                <Text style={styles.etapaDetalhadaAtivos}>{relatorioStats.primeira_visita} ativos</Text>
                <Text style={styles.etapaDetalhadaConcluidos}>
                  {visitantesConcluidos.filter(v => v.etapa === 'primeira_visita').length} concluídos
                </Text>
              </View>
            </View>

            {/* Encaminhamento Célula */}
            <View style={styles.etapaDetalhadaItem}>
              <View style={styles.etapaDetalhadaHeader}>
                <View style={styles.etapaDetalhadaIcon}>
                  <Ionicons name="people" size={16} color="#2196F3" />
                </View>
                <Text style={styles.etapaDetalhadaNome}>Encaminhamento Célula</Text>
              </View>
              <View style={styles.etapaDetalhadaStats}>
                <Text style={styles.etapaDetalhadaAtivos}>{relatorioStats.encaminhamento_celula} ativos</Text>
                <Text style={styles.etapaDetalhadaConcluidos}>
                  {visitantesConcluidos.filter(v => v.etapa === 'encaminhamento_celula').length} concluídos
                </Text>
              </View>
            </View>

            {/* Pedido de Oração */}
            <View style={styles.etapaDetalhadaItem}>
              <View style={styles.etapaDetalhadaHeader}>
                <View style={styles.etapaDetalhadaIcon}>
                  <Ionicons name="heart" size={16} color="#FF9800" />
                </View>
                <Text style={styles.etapaDetalhadaNome}>Pedido de Oração</Text>
              </View>
              <View style={styles.etapaDetalhadaStats}>
                <Text style={styles.etapaDetalhadaAtivos}>{relatorioStats.pedido_oracao} ativos</Text>
                <Text style={styles.etapaDetalhadaConcluidos}>
                  {visitantesConcluidos.filter(v => v.etapa === 'pedido_oracao').length} concluídos
                </Text>
              </View>
            </View>

            {/* Não Atribuídos */}
            <View style={styles.etapaDetalhadaItem}>
              <View style={styles.etapaDetalhadaHeader}>
                <View style={styles.etapaDetalhadaIcon}>
                  <Ionicons name="help-circle" size={16} color="#9E9E9E" />
                </View>
                <Text style={styles.etapaDetalhadaNome}>Não Atribuídos</Text>
              </View>
              <View style={styles.etapaDetalhadaStats}>
                <Text style={styles.etapaDetalhadaAtivos}>{relatorioStats.nao_atribuidos} ativos</Text>
                <Text style={styles.etapaDetalhadaConcluidos}>
                  {visitantesConcluidos.filter(v => !v.etapa || v.etapa === 'nao_atribuido').length} concluídos
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.relatorioPreviewInfo}>
            Este relatório será enviado para a liderança com todas as informações detalhadas do ministério.
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Observações Adicionais (Opcional):</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Adicione observações, comentários ou situações especiais..."
            value={observacoesRelatorio}
            onChangeText={setObservacoesRelatorio}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButton]}
            onPress={() => {
              setEnviarRelatorioModalVisible(false);
              setObservacoesRelatorio("");
            }}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modalButton, styles.sendReportModalButton]}
            onPress={enviarRelatorio}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={16} color="#fff" />
                <Text style={styles.sendReportModalButtonText}>Enviar Relatório</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  </View>
</Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  leaderName: {
    fontSize: 14,
    color: "#666",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    gap: 5,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#B8986A",
  },
  tabText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#B8986A",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    zIndex: 1000,
  },
  
  // Visitantes Styles
  visitantesHeader: {
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  tabTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#B8986A",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Adicione estes estilos ao seu StyleSheet

etapasDetalhadas: {
  marginTop: 20,
  backgroundColor: '#f8f9fa',
  borderRadius: 12,
  padding: 16,
},

etapasDetalhadasTitle: {
  fontSize: 16,
  fontWeight: '600',
  color: '#333',
  marginBottom: 12,
  textAlign: 'center',
},

etapaDetalhadaItem: {
  backgroundColor: '#fff',
  borderRadius: 10,
  padding: 12,
  marginBottom: 8,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 1,
  },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  elevation: 1,
},

etapaDetalhadaHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
},

etapaDetalhadaIcon: {
  width: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: '#f0f0f0',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 10,
},

etapaDetalhadaNome: {
  fontSize: 14,
  fontWeight: '500',
  color: '#333',
  flex: 1,
},

etapaDetalhadaStats: {
  alignItems: 'flex-end',
},

etapaDetalhadaAtivos: {
  fontSize: 14,
  fontWeight: '600',
  color: '#4CAF50',
  marginBottom: 2,
},

etapaDetalhadaConcluidos: {
  fontSize: 12,
  color: '#666',
  fontStyle: 'italic',
},
  // Card Expansível de Visitantes
  visitantesExpandableCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  visitantesCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  visitantesCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  visitantesExpandButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  visitantesExpandText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B8986A",
  },
  visitantesExpandedContent: {
    padding: 16,
  },

  visitanteCard: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  visitanteContent: {
    flex: 1,
  },
  visitanteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  visitanteNome: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  etapaBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  etapaBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  visitanteInfo: {
    marginBottom: 8,
  },
  visitanteDetail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  visitanteObservacoes: {
    fontSize: 12,
    color: "#777",
    fontStyle: "italic",
    marginTop: 5,
  },
  clickHint: {
    fontSize: 11,
    color: "#B8986A",
    fontStyle: "italic",
  },
  visitanteActions: {
    justifyContent: "space-between",
    alignItems: "center",
    marginLeft: 10,
    gap: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#f0f8ff",
  },
  concludeButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#e6ffe6",
    gap: 4,
  },
  concludeButtonText: {
    fontSize: 11,
    color: "#50C878",
    fontWeight: "600",
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#ffe6e6",
  },

  // Relatório Styles
  relatorioHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  refreshButtonText: {
    color: "#666",
    fontSize: 12,
    fontWeight: "600",
  },
  relatorioContent: {
    padding: 20,
  },
  relatorioCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  relatorioCardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    padding: 15,
  },
  statBigNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#B8986A",
    marginTop: 8,
  },
  statBigLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
    textAlign: "center",
  },

  // Card de Alerta para Não Atribuídos
  alertCard: {
    backgroundColor: "#fff5f0",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#ff6b35",
    elevation: 1,
  },
  alertCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  alertCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ff6b35",
  },
  alertCardNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ff6b35",
    textAlign: "center",
    marginBottom: 10,
  },
  alertCardText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },

  etapaCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  etapaCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 10,
  },
  etapaCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  etapaCardStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  etapaCardNumber: {
    fontSize: 24,
    fontWeight: "bold",
  },
  etapaCardPercentage: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  etapaProgressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  etapaProgressFill: {
    height: "100%",
    borderRadius: 4,
  },
  etapaDetailSection: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  etapaDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  etapaDetailTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  etapaDetailItem: {
    fontSize: 13,
    color: "#666",
    marginBottom: 3,
    paddingLeft: 24,
  },

  // Concluídos Styles
  concluidosHeader: {
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  concluidosList: {
    padding: 20,
  },
  concluidoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    borderLeftWidth: 4,
    borderLeftColor: "#50C878",
  },
  concluidoContent: {
    flex: 1,
  },
  concluidoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  concluidoNome: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  concluidoBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#e6ffe6",
    gap: 4,
  },
  concluidoBadgeText: {
    color: "#50C878",
    fontSize: 10,
    fontWeight: "600",
  },
  concluidoInfo: {
    marginBottom: 8,
  },
  concluidoDetail: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  concluidoObservacoes: {
    fontSize: 11,
    color: "#777",
    fontStyle: "italic",
    marginTop: 5,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 15,
    width: "90%",
    maxHeight: "85%",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  suggestionsContainer: {
    marginTop: 5,
    maxHeight: 150,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  suggestionsList: {
    maxHeight: 150,
  },
  suggestionItem: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  suggestionText: {
    fontSize: 14,
    color: "#333",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  saveButton: {
    backgroundColor: "#B8986A",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Modal de Etapa Styles
  selectedVisitanteInfo: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#B8986A",
  },
  selectedVisitanteNome: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  selectedVisitanteDetail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  currentEtapaInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  currentEtapaLabel: {
    fontSize: 12,
    color: "#666",
  },
  currentEtapaBadge: {
    backgroundColor: "#B8986A",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentEtapaText: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "600",
  },
  etapaSelectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  etapaSelectionList: {
    gap: 8,
    marginBottom: 20,
  },
  etapaSelectionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    gap: 15,
  },
  etapaSelectionItemText: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  removeEtapaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffe6e6",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  removeEtapaText: {
    color: "#ff4444",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    paddingVertical: 40,
  },
  // Header actions do relatório
  relatorioHeaderActions: {
    flexDirection: "collumn",
    gap: 10,
  },
  
  // Botão Enviar Relatório
  sendReportButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#B8986A",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  sendReportButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  
  // Estilos para relatórios enviados
  relatorioEnviadoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#B8986A",
  },
  relatorioEnviadoHeader: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  relatorioEnviadoInfo: {
    flex: 1,
  },
  relatorioEnviadoData: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  relatorioEnviadoDetalhes: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  relatorioEnviadoStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  relatorioEnviadoStatusText: {
    fontSize: 11,
    color: "#50C878",
    fontWeight: "600",
  },

  // Card Expansível de Concluídos
  concluidosExpandableCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  concluidosCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  concluidosCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  concluidosExpandButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  concluidosExpandText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#50C878",
  },
  concluidosExpandedContent: {
    maxHeight: 400,
    padding: 16,
  },
  
  // Ações dos concluídos
  concluidoActions: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  undoButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#fff5f0",
    gap: 4,
  },
  undoButtonText: {
    fontSize: 11,
    color: "#ff6b35",
    fontWeight: "600",
  },

  // Estilos do Modal de Enviar Relatório
  relatorioPreview: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#B8986A",
  },
  relatorioPreviewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  relatorioPreviewStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
  },
  relatorioPreviewStatItem: {
    alignItems: "center",
  },
  relatorioPreviewStatNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#B8986A",
  },
  relatorioPreviewStatLabel: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
    textAlign: "center",
  },
  relatorioPreviewInfo: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    lineHeight: 16,
  },
  sendReportModalButton: {
    backgroundColor: "#B8986A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sendReportModalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});