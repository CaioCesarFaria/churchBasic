// DiaconatoDizimos.js - COMPLETO COM TODAS AS CORREÇÕES
import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { db } from "../Firebase/FirebaseConfig";
import {
  doc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

export default function DiaconatoDizimos({
  events,
  scales,
  members,
  onRefresh,
  canCreateScales,
  userRole,
  currentUserId,
}) {
  const { user, userData } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [relatorioModalVisible, setRelatorioModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [relatoriosDizimos, setRelatoriosDizimos] = useState([]);
  
  // Estados do formulário de dízimo
  const [dizimoForm, setDizimoForm] = useState({
    valorPix: "",
    valorDinheiro: "",
    observacoes: "",
  });

  const userName = userData?.name || user?.displayName || "Usuario";
  
  // CORREÇÃO: Verificar se é membro do diaconato (qualquer membro pode preencher dízimos)
  const isMemberOfDiaconato = members.some(member => 
    member.userId === user.uid || member.id === user.uid
  );
  
  const isResponsavel = userRole === "responsavel";
  const isLiderTime = userRole === "liderTimeA" || userRole === "liderTimeB";
  
  // NOVO: Qualquer membro do diaconato pode preencher dízimos
  const canFillDizimos = isMemberOfDiaconato || isResponsavel || isLiderTime || canCreateScales;
  const canViewAllDizimos = isResponsavel || isLiderTime || canCreateScales;

  // Carregar relatórios de dízimos existentes
  const loadRelatoriosDizimos = async () => {
    try {
      const relatoriosRef = collection(
        db, 
        "churchBasico", 
        "ministerios", 
        "conteudo", 
        "diaconato", 
        "relatoriosDizimos"
      );
      const q = query(relatoriosRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      const relatoriosData = [];
      querySnapshot.forEach((doc) => {
        relatoriosData.push({ id: doc.id, ...doc.data() });
      });
      
      setRelatoriosDizimos(relatoriosData);
    } catch (error) {
      console.log("Erro ao carregar relatórios de dízimos:", error);
    }
  };

  // Buscar eventos onde há escalas do diaconato (para preencher dízimos)
  const getEventsWithDiaconatoScales = () => {
    return events.filter(event => {
      // Verificar se existe escala do diaconato para este evento
      return scales.some(scale => scale.eventId === event.id);
    });
  };

  // Verificar se já existe relatório para este evento
  const hasRelatorioForEvent = (eventId) => {
    return relatoriosDizimos.some(relatorio => relatorio.eventId === eventId);
  };

  // Abrir modal para criar/editar relatório
  const openRelatorioModal = (event) => {
    const existingRelatorio = relatoriosDizimos.find(r => r.eventId === event.id);
    
    if (existingRelatorio) {
      // Verificar se o usuário atual pode editar este relatório
      if (existingRelatorio.responsavelUserId !== user.uid && !canViewAllDizimos) {
        Alert.alert(
          "Sem Permissão", 
          "Você só pode editar relatórios preenchidos por você. Este relatório foi preenchido por: " + existingRelatorio.responsavelNome
        );
        return;
      }
      
      // Preencher com dados existentes para edição
      setDizimoForm({
        valorPix: existingRelatorio.valorPix?.toString() || "",
        valorDinheiro: existingRelatorio.valorDinheiro?.toString() || "",
        observacoes: existingRelatorio.observacoes || "",
      });
    } else {
      // Reset para novo relatório
      setDizimoForm({
        valorPix: "",
        valorDinheiro: "",
        observacoes: "",
      });
    }
    
    setSelectedEvent(event);
    setRelatorioModalVisible(true);
  };

  // Validar valores monetários
  const validarValor = (valor) => {
    const numeroLimpo = valor.replace(/[^0-9,]/g, '');
    const valorDecimal = parseFloat(numeroLimpo.replace(',', '.'));
    return isNaN(valorDecimal) ? 0 : valorDecimal;
  };

  // Formatar valor para exibição
  const formatarValor = (valor) => {
    const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
    if (isNaN(numero)) return "R$ 0,00";
    return `R$ ${numero.toFixed(2).replace('.', ',')}`;
  };

  // Salvar relatório de dízimo
  const salvarRelatorio = async () => {
    if (!selectedEvent) {
      Alert.alert("Erro", "Evento não selecionado!");
      return;
    }

    const valorPix = validarValor(dizimoForm.valorPix);
    const valorDinheiro = validarValor(dizimoForm.valorDinheiro);
    const valorTotal = valorPix + valorDinheiro;

    if (valorTotal === 0) {
      Alert.alert("Aviso", "Por favor, informe pelo menos um valor (PIX ou Dinheiro).");
      return;
    }

    try {
      setLoading(true);

      const relatorioData = {
        ministerio: "diaconato",
        eventId: selectedEvent.id,
        eventName: selectedEvent.nome,
        eventDate: selectedEvent.data,
        eventTime: selectedEvent.horario,
        valorPix: valorPix,
        valorDinheiro: valorDinheiro,
        valorTotal: valorTotal,
        observacoes: dizimoForm.observacoes.trim(),
        responsavelUserId: user.uid,
        responsavelNome: userName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // ID único baseado no evento
      const relatorioId = `${selectedEvent.id}_dizimo`;
      const relatorioRef = doc(
        db, 
        "churchBasico", 
        "ministerios", 
        "conteudo", 
        "diaconato", 
        "relatoriosDizimos", 
        relatorioId
      );

      await setDoc(relatorioRef, relatorioData);

      Alert.alert("Sucesso", "Relatório de dízimos salvo com sucesso!");
      setRelatorioModalVisible(false);
      await loadRelatoriosDizimos();
      
    } catch (error) {
      console.error("Erro ao salvar relatório:", error);
      Alert.alert("Erro", "Não foi possível salvar o relatório. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados ao montar componente
  useEffect(() => {
    loadRelatoriosDizimos();
  }, []);

  const eventsWithScales = getEventsWithDiaconatoScales();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Relatórios de Dízimos</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadRelatoriosDizimos}>
          <Ionicons name="refresh" size={16} color="#666" />
          <Text style={styles.refreshButtonText}>Atualizar</Text>
        </TouchableOpacity>
      </View>

      {/* Info para diferentes tipos de usuário */}
      {!canFillDizimos && (
        <View style={styles.noAccessContainer}>
          <Ionicons name="lock-closed" size={48} color="#ccc" />
          <Text style={styles.noAccessText}>Acesso Restrito</Text>
          <Text style={styles.noAccessSubText}>
            Apenas membros do diaconato podem preencher relatórios de dízimos.
          </Text>
        </View>
      )}

      {canFillDizimos && (
        <ScrollView style={styles.content}>
          {/* Seção para membros preencherem relatórios */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Eventos Disponíveis para Relatório</Text>
            <Text style={styles.sectionSubtitle}>
              Qualquer membro do diaconato pode preencher os dízimos dos eventos
            </Text>
            
            {eventsWithScales.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>Nenhum evento com escala encontrado</Text>
                <Text style={styles.emptySubText}>
                  Eventos com escalas do diaconato aparecerão aqui para preenchimento dos dízimos.
                </Text>
              </View>
            ) : (
              eventsWithScales.map((event) => {
                const hasRelatorio = hasRelatorioForEvent(event.id);
                const relatorio = relatoriosDizimos.find(r => r.eventId === event.id);
                const canEdit = !relatorio || relatorio.responsavelUserId === user.uid || canViewAllDizimos;
                
                return (
                  <View key={event.id} style={styles.eventCard}>
                    <View style={styles.eventHeader}>
                      <View style={styles.eventInfo}>
                        <Text style={styles.eventName}>{event.nome}</Text>
                        <Text style={styles.eventDate}>{event.data} - {event.horario}</Text>
                      </View>
                      
                      {hasRelatorio ? (
                        <View style={styles.relatorioStatus}>
                          <Ionicons name="checkmark-circle" size={20} color="#50C878" />
                          <Text style={styles.relatorioStatusText}>Preenchido</Text>
                        </View>
                      ) : (
                        <View style={styles.relatorioStatus}>
                          <Ionicons name="time" size={20} color="#FFA500" />
                          <Text style={[styles.relatorioStatusText, { color: "#FFA500" }]}>Pendente</Text>
                        </View>
                      )}
                    </View>

                    {hasRelatorio && relatorio && (
                      <View style={styles.relatorioSummary}>
                        <Text style={styles.summaryText}>
                          PIX: {formatarValor(relatorio.valorPix)} | 
                          Dinheiro: {formatarValor(relatorio.valorDinheiro)} | 
                          Total: {formatarValor(relatorio.valorTotal)}
                        </Text>
                        <Text style={styles.relatorioResponsavel}>
                          Preenchido por: {relatorio.responsavelNome}
                        </Text>
                        {relatorio.observacoes && (
                          <Text style={styles.observacoesPreview}>"{relatorio.observacoes}"</Text>
                        )}
                      </View>
                    )}

                    {canEdit && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => openRelatorioModal(event)}
                      >
                        <Ionicons name={hasRelatorio ? "pencil" : "document-text"} size={16} color="#fff" />
                        <Text style={styles.actionButtonText}>
                          {hasRelatorio ? "Editar Relatório" : "Preencher Relatório"}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {!canEdit && hasRelatorio && (
                      <View style={styles.noEditInfo}>
                        <Ionicons name="information-circle" size={16} color="#666" />
                        <Text style={styles.noEditText}>
                          Apenas quem preencheu ou líderes podem editar este relatório
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>

          {/* Seção para líderes visualizarem todos os relatórios */}
          {canViewAllDizimos && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Todos os Relatórios de Dízimos</Text>
              
              {relatoriosDizimos.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="document-text-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>Nenhum relatório encontrado</Text>
                  <Text style={styles.emptySubText}>
                    Os relatórios de dízimos aparecerão aqui quando preenchidos.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={relatoriosDizimos}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <View style={styles.relatorioCard}>
                      <View style={styles.relatorioCardHeader}>
                        <View style={styles.relatorioCardInfo}>
                          <Text style={styles.relatorioCardTitle}>{item.eventName}</Text>
                          <Text style={styles.relatorioCardDate}>{item.eventDate} - {item.eventTime}</Text>
                          <Text style={styles.relatorioCardResponsavel}>
                            Preenchido por: {item.responsavelNome}
                          </Text>
                        </View>
                        
                        <View style={styles.relatorioCardValues}>
                          <Text style={styles.relatorioCardTotal}>
                            {formatarValor(item.valorTotal)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.relatorioCardDetails}>
                        <View style={styles.valorBreakdown}>
                          <View style={styles.valorItem}>
                            <Ionicons name="card" size={16} color="#4A90E2" />
                            <Text style={styles.valorLabel}>PIX:</Text>
                            <Text style={styles.valorValue}>{formatarValor(item.valorPix)}</Text>
                          </View>
                          
                          <View style={styles.valorItem}>
                            <Ionicons name="cash" size={16} color="#50C878" />
                            <Text style={styles.valorLabel}>Dinheiro:</Text>
                            <Text style={styles.valorValue}>{formatarValor(item.valorDinheiro)}</Text>
                          </View>
                        </View>

                        {item.observacoes && (
                          <View style={styles.observacoesContainer}>
                            <Text style={styles.observacoesTitle}>Observações:</Text>
                            <Text style={styles.observacoesText}>{item.observacoes}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                />
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Modal para preencher relatório */}
      <Modal
        visible={relatorioModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRelatorioModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Relatório de Dízimos</Text>
              <TouchableOpacity onPress={() => setRelatorioModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedEvent && (
                <View style={styles.eventInfoModal}>
                  <Text style={styles.eventInfoTitle}>Evento: {selectedEvent.nome}</Text>
                  <Text style={styles.eventInfoDetail}>Data: {selectedEvent.data}</Text>
                  <Text style={styles.eventInfoDetail}>Horário: {selectedEvent.horario}</Text>
                  <Text style={styles.eventInfoDetail}>
                    Preenchido por: {userName}
                  </Text>
                </View>
              )}

              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>Valores Recebidos</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    <Ionicons name="card" size={16} color="#4A90E2" /> PIX (R$)
                  </Text>
                  <TextInput
                    style={styles.valorInput}
                    placeholder="0,00"
                    value={dizimoForm.valorPix}
                    onChangeText={(text) => setDizimoForm({...dizimoForm, valorPix: text})}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    <Ionicons name="cash" size={16} color="#50C878" /> Dinheiro (R$)
                  </Text>
                  <TextInput
                    style={styles.valorInput}
                    placeholder="0,00"
                    value={dizimoForm.valorDinheiro}
                    onChangeText={(text) => setDizimoForm({...dizimoForm, valorDinheiro: text})}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalValue}>
                    {formatarValor(validarValor(dizimoForm.valorPix) + validarValor(dizimoForm.valorDinheiro))}
                  </Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Observações</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Observações especiais sobre a coleta..."
                  value={dizimoForm.observacoes}
                  onChangeText={(text) => setDizimoForm({...dizimoForm, observacoes: text})}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setRelatorioModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={salvarRelatorio}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Confirmar Valores</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#B8986A" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
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
  noAccessContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  noAccessText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 15,
  },
  noAccessSubText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
    fontStyle: "italic",
  },
  eventCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  eventDate: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  relatorioStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  relatorioStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#50C878",
  },
  relatorioSummary: {
    backgroundColor: "#f8f9fa",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
    marginBottom: 4,
  },
  relatorioResponsavel: {
    fontSize: 12,
    color: "#B8986A",
    fontWeight: "600",
    marginBottom: 4,
  },
  observacoesPreview: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#B8986A",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 5,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  noEditInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f0",
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  noEditText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 15,
  },
  emptySubText: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
  relatorioCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    overflow: "hidden",
  },
  relatorioCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  relatorioCardInfo: {
    flex: 1,
  },
  relatorioCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  relatorioCardDate: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  relatorioCardResponsavel: {
    fontSize: 12,
    color: "#B8986A",
    marginTop: 4,
    fontWeight: "500",
  },
  relatorioCardValues: {
    alignItems: "flex-end",
  },
  relatorioCardTotal: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#50C878",
  },
  relatorioCardDetails: {
    padding: 16,
  },
  valorBreakdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  valorItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  valorLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  valorValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  observacoesContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  observacoesTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  observacoesText: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 15,
    width: "95%",
    maxHeight: "80%",
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
  eventInfoModal: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#B8986A",
  },
  eventInfoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  eventInfoDetail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  formSection: {
    marginBottom: 20,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
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
    fontSize: 16,
    backgroundColor: "#fff",
  },
  valorInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 18,
    backgroundColor: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0f8ff",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4A90E2",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#50C878",
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
});