// AdminMaster.js
import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { AuthContext } from "../../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth, db } from "../../Firebase/FirebaseConfig";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

export default function AdminMaster({ navigation }) {
  const { user, userData, setUserData } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const [membersCount, setMembersCount] = useState(0);
  const [leadersCount, setLeadersCount] = useState(0);
  const [ministeriosCount, setMinisteriosCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  // Estados para eventos
  const [eventos, setEventos] = useState([]);
  const [loadingEventos, setLoadingEventos] = useState(false);

  // Estados para modal de edição
  const [modalVisible, setModalVisible] = useState(false);
  const [eventoEditando, setEventoEditando] = useState(null);
  const [nomeEventoEdit, setNomeEventoEdit] = useState("");
  const [dataEventoEdit, setDataEventoEdit] = useState(new Date());
  const [horarioEventoEdit, setHorarioEventoEdit] = useState(new Date());
  const [showDatePickerEdit, setShowDatePickerEdit] = useState(false);
  const [showTimePickerEdit, setShowTimePickerEdit] = useState(false);

  const handleLogout = async () => {
    Alert.alert("Sair", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
            setUserData(null);
            navigation.reset({
              index: 0,
              routes: [{ name: "HomeTab" }],
            });
          } catch (error) {
            console.log("Erro ao sair:", error);
            Alert.alert("Erro", "Erro ao sair do sistema");
          }
        },
      },
    ]);
  };

  const navigateToNewEvent = () => {
    navigation.navigate("NewEvent");
  };

  const navigateToNewLider = () => {
    navigation.navigate("NewLider");
  };

  // Buscar estatísticas
  const fetchStatistics = async () => {
    try {
      setLoadingStats(true);

      // Membros
      const membersSnapshot = await getDocs(
        collection(db, "churchBasico", "users", "members")
      );
      const leadersSnapshot = await getDocs(
        collection(db, "churchBasico", "users", "lideres")
      );

      // Atualiza membros e líderes
      setMembersCount(membersSnapshot.size + leadersSnapshot.size);
      setLeadersCount(leadersSnapshot.size);

      // Contar ministérios únicos dos líderes
      const ministeriosSet = new Set();
      leadersSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.ministerio) ministeriosSet.add(data.ministerio);
      });
      setMinisteriosCount(ministeriosSet.size);
    } catch (error) {
      console.log("Erro ao buscar estatísticas:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Buscar eventos
  const fetchEventos = async () => {
    try {
      setLoadingEventos(true);
      const eventosSnapshot = await getDocs(
        collection(db, "churchBasico", "sistema", "eventos")
      );

      const eventosArray = [];
      eventosSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.ativo) {
          eventosArray.push({ id: doc.id, ...data });
        }
      });

      // Ordenar por data
      eventosArray.sort(
        (a, b) => new Date(a.dataCompleta) - new Date(b.dataCompleta)
      );
      setEventos(eventosArray);
    } catch (error) {
      console.log("Erro ao buscar eventos:", error);
    } finally {
      setLoadingEventos(false);
    }
  };

  // Deletar evento
  const deletarEvento = (evento) => {
    Alert.alert(
      "Deletar Evento",
      `Tem certeza que deseja deletar o evento "${evento.nome}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Deletar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(
                doc(db, "churchBasico", "sistema", "eventos", evento.id)
              );
              Alert.alert("Sucesso", "Evento deletado com sucesso!");
              fetchEventos(); // Recarregar lista
            } catch (error) {
              console.log("Erro ao deletar evento:", error);
              Alert.alert("Erro", "Erro ao deletar evento");
            }
          },
        },
      ]
    );
  };

  // Abrir modal de edição
  const abrirModalEdicao = (evento) => {
    setEventoEditando(evento);
    setNomeEventoEdit(evento.nome);

    // Converter strings de data de volta para Date objects
    const dataEvento = new Date(evento.dataCompleta);
    const horarioEvento = new Date(evento.horarioCompleto);

    setDataEventoEdit(dataEvento);
    setHorarioEventoEdit(horarioEvento);
    setModalVisible(true);
  };

  // Salvar edição
  const salvarEdicao = async () => {
    if (!nomeEventoEdit.trim()) {
      Alert.alert("Erro", "Por favor, preencha o nome do evento");
      return;
    }

    try {
      const eventoAtualizado = {
        nome: nomeEventoEdit.trim(),
        data: dataEventoEdit.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        horario: horarioEventoEdit.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        dataCompleta: dataEventoEdit.toISOString(),
        horarioCompleto: horarioEventoEdit.toISOString(),
      };

      await updateDoc(
        doc(db, "churchBasico", "sistema", "eventos", eventoEditando.id),
        eventoAtualizado
      );

      Alert.alert("Sucesso", "Evento atualizado com sucesso!");
      setModalVisible(false);
      fetchEventos(); // Recarregar lista
    } catch (error) {
      console.log("Erro ao atualizar evento:", error);
      Alert.alert("Erro", "Erro ao atualizar evento");
    }
  };

  // Handlers para date/time pickers do modal
  const onDateChangeEdit = (event, selectedDate) => {
    const currentDate = selectedDate || dataEventoEdit;
    setShowDatePickerEdit(Platform.OS === "ios");
    setDataEventoEdit(currentDate);
  };

  const onTimeChangeEdit = (event, selectedTime) => {
    const currentTime = selectedTime || horarioEventoEdit;
    setShowTimePickerEdit(Platform.OS === "ios");
    setHorarioEventoEdit(currentTime);
  };

  useEffect(() => {
    fetchStatistics();
    fetchEventos();
  }, []);

  // Atualizar eventos quando a tela recebe foco
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchEventos();
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>ABBA</Text>
          </View>
          <Text style={styles.churchText}>CHURCH</Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              Olá, {userData?.name || user?.displayName || user?.email}!
            </Text>
            <Text style={styles.userType}>Admin Master</Text>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#B8986A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Admin Action Buttons */}
      <View style={styles.adminButtonsContainer}>
        <TouchableOpacity
          style={styles.adminButton}
          onPress={navigateToNewEvent}
          disabled={loading}
        >
          <Ionicons name="calendar-outline" size={24} color="#fff" />
          <Text style={styles.adminButtonText}>Cadastrar Evento</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.adminButton}
          onPress={navigateToNewLider}
          disabled={loading}
        >
          <Ionicons name="person-add-outline" size={24} color="#fff" />
          <Text style={styles.adminButtonText}>Cadastrar Líder</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Painel Administrativo</Text>
          <Text style={styles.welcomeSubtitle}>
            Gerencie ministérios, líderes e administre o sistema
          </Text>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate("MembersAdm")}
          >
            <Ionicons name="people-outline" size={32} color="#B8986A" />
            <Text style={styles.statNumber}>
              {loadingStats ? "--" : membersCount}
            </Text>
            <Text style={styles.statLabel}>Membros</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate("MinisteriosAdm")}
          >
            <Ionicons name="business-outline" size={32} color="#B8986A" />
            <Text style={styles.statNumber}>
              {loadingStats ? "--" : ministeriosCount}
            </Text>
            <Text style={styles.statLabel}>Ministérios</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate("LideresAdm")}
          >
            <Ionicons name="person-outline" size={32} color="#B8986A" />
            <Text style={styles.statNumber}>
              {loadingStats ? "--" : leadersCount}
            </Text>
            <Text style={styles.statLabel}>Líderes</Text>
          </TouchableOpacity>
        </View>

        {/* Eventos Cadastrados */}
        <View style={styles.eventosContainer}>
          <Text style={styles.sectionTitle}>Eventos Cadastrados</Text>

          {loadingEventos ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#B8986A" />
              <Text style={styles.loadingText}>Carregando eventos...</Text>
            </View>
          ) : eventos.length > 0 ? (
            eventos.map((evento) => (
              <View key={evento.id} style={styles.eventoCard}>
                <View style={styles.eventoInfo}>
                  <Text style={styles.eventoNome}>{evento.nome}</Text>
                  <View style={styles.eventoDetalhes}>
                    <View style={styles.eventoDetalhe}>
                      <Ionicons
                        name="calendar-outline"
                        size={16}
                        color="#666"
                      />
                      <Text style={styles.eventoTexto}>{evento.data}</Text>
                    </View>
                    <View style={styles.eventoDetalhe}>
                      <Ionicons name="time-outline" size={16} color="#666" />
                      <Text style={styles.eventoTexto}>{evento.horario}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.eventoAcoes}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => abrirModalEdicao(evento)}
                  >
                    <Ionicons name="pencil" size={16} color="#4CAF50" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deletarEvento(evento)}
                  >
                    <Ionicons name="trash" size={16} color="#f44336" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Nenhum evento cadastrado</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal de Edição */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Evento</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {/* Nome do Evento */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome do Evento:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite o nome do evento"
                  value={nomeEventoEdit}
                  onChangeText={setNomeEventoEdit}
                />
              </View>

              {/* Data do Evento */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Data do Evento:</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePickerEdit(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#B8986A" />
                  <Text style={styles.dateButtonText}>
                    {dataEventoEdit.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Horário do Evento */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Horário:</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowTimePickerEdit(true)}
                >
                  <Ionicons name="time-outline" size={20} color="#B8986A" />
                  <Text style={styles.dateButtonText}>
                    {horarioEventoEdit.toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Botões */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={salvarEdicao}
                >
                  <Text style={styles.saveButtonText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>

        {/* Date/Time Pickers para Modal */}
        {showDatePickerEdit && (
          <DateTimePicker
            value={dataEventoEdit}
            mode="date"
            display="default"
            onChange={onDateChangeEdit}
            minimumDate={new Date()}
          />
        )}

        {showTimePickerEdit && (
          <DateTimePicker
            value={horarioEventoEdit}
            mode="time"
            display="default"
            onChange={onTimeChangeEdit}
          />
        )}
      </Modal>
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
  logoContainer: {
    alignItems: "center",
  },
  logoBox: {
    borderWidth: 2,
    borderColor: "#000",
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 5,
  },
  logoText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    letterSpacing: 1,
  },
  churchText: {
    fontSize: 10,
    color: "#000",
    letterSpacing: 4,
    fontWeight: "300",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  userInfo: {
    alignItems: "flex-end",
    marginRight: 15,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  userType: {
    fontSize: 12,
    color: "#B8986A",
    fontWeight: "500",
  },
  logoutButton: {
    padding: 8,
  },
  adminButtonsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  adminButton: {
    flex: 1,
    backgroundColor: "#B8986A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  adminButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeSection: {
    marginBottom: 25,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  eventosContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
  },
  eventoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventoInfo: {
    flex: 1,
  },
  eventoNome: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  eventoDetalhes: {
    flexDirection: "row",
    gap: 15,
  },
  eventoDetalhe: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  eventoTexto: {
    fontSize: 14,
    color: "#666",
  },
  eventoAcoes: {
    flexDirection: "row",
    gap: 10,
  },
  editButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#f0f8f0",
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#fef0f0",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "90%",
    maxHeight: "80%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  modalForm: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    color: "#333",
  },
  dateButton: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    flexDirection: "row",
    alignItems: "center",
  },
  dateButtonText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#B8986A",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
