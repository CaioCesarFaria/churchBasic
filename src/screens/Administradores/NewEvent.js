// NewEvent.js
// NewEvent.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { db } from "../../Firebase/FirebaseConfig";

export default function NewEvent({ navigation }) {
  const [nomeEvento, setNomeEvento] = useState("");
  const [dataEvento, setDataEvento] = useState(new Date());
  const [horarioEvento, setHorarioEvento] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Função para formatar data
  const formatarData = (date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Função para formatar horário
  const formatarHorario = (time) => {
    return time.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handler para mudança de data
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || dataEvento;
    setShowDatePicker(Platform.OS === 'ios');
    setDataEvento(currentDate);
  };

  // Handler para mudança de horário
  const onTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || horarioEvento;
    setShowTimePicker(Platform.OS === 'ios');
    setHorarioEvento(currentTime);
  };

  // Função para criar a estrutura inicial de escalas
  const criarEstruturaEscalas = async (eventoId) => {
    try {
      // Criar documento placeholder para a subcoleção "escalas"
      // Isso garante que a subcoleção exista e possa ser acessada
      const escalasPlaceholderRef = doc(db, "churchBasico", "sistema", "eventos", eventoId, "escalas", "_placeholder");
      
      await setDoc(escalasPlaceholderRef, {
        info: "Estrutura criada para receber escalas dos ministérios",
        criadoEm: new Date().toISOString(),
        ativo: true
      });

      console.log("Estrutura de escalas criada com sucesso para o evento:", eventoId);
    } catch (error) {
      console.log("Erro ao criar estrutura de escalas:", error);
      // Não vamos interromper o processo por isso, apenas registrar o erro
    }
  };

  // Função para criar evento
  const criarEvento = async () => {
    if (!nomeEvento.trim()) {
      Alert.alert("Erro", "Por favor, preencha o nome do evento");
      return;
    }

    setLoading(true);

    try {
      // Criar objeto do evento
      const novoEvento = {
        nome: nomeEvento.trim(),
        data: formatarData(dataEvento),
        horario: formatarHorario(horarioEvento),
        dataCompleta: dataEvento.toISOString(),
        horarioCompleto: horarioEvento.toISOString(),
        criadoEm: new Date().toISOString(),
        ativo: true,
        // Campos para controle de escalas dos ministérios
        escalaComunicacao: null,
        escalaLouvor: null,
        escalaRecepcao: null,
        escalaInfantil: null,
        // Total de escalas criadas
        totalEscalas: 0
      };

      // Salvar o evento no Firebase
      const eventoRef = await addDoc(collection(db, "churchBasico", "sistema", "eventos"), novoEvento);
      
      // Criar a estrutura de escalas para este evento
      await criarEstruturaEscalas(eventoRef.id);

      Alert.alert(
        "Sucesso", 
        "Evento criado com sucesso! A estrutura para escalas foi preparada automaticamente.",
        [
          {
            text: "OK",
            onPress: () => {
              // Limpar campos
              setNomeEvento("");
              setDataEvento(new Date());
              setHorarioEvento(new Date());
              // Voltar para AdminMaster
              navigation.goBack();
            }
          }
        ]
      );

    } catch (error) {
      console.log("Erro ao criar evento:", error);
      Alert.alert("Erro", "Erro ao criar evento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

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
        
        <Text style={styles.headerTitle}>Cadastrar Evento</Text>
        
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Formulário */}
        <View style={styles.formContainer}>
          
          {/* Nome do Evento */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome do Evento:</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite o nome do evento"
              value={nomeEvento}
              onChangeText={setNomeEvento}
              editable={!loading}
            />
          </View>

          {/* Data do Evento */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Data do Evento:</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
              disabled={loading}
            >
              <Ionicons name="calendar-outline" size={20} color="#B8986A" />
              <Text style={styles.dateButtonText}>
                {formatarData(dataEvento)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Horário do Evento */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Horário:</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowTimePicker(true)}
              disabled={loading}
            >
              <Ionicons name="time-outline" size={20} color="#B8986A" />
              <Text style={styles.dateButtonText}>
                {formatarHorario(horarioEvento)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Informação sobre escalas */}
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={20} color="#B8986A" />
            <Text style={styles.infoText}>
              Ao criar este evento, a estrutura para receber escalas dos ministérios será criada automaticamente.
            </Text>
          </View>

          {/* Botão Criar Evento */}
          <TouchableOpacity 
            style={[styles.createButton, { opacity: loading ? 0.7 : 1 }]}
            onPress={criarEvento}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.createButtonText}>Criar Evento</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={dataEvento}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={horarioEvento}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}
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
  formContainer: {
    paddingTop: 30,
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    color: "#333",
  },
  dateButton: {
    backgroundColor: "#fff",
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
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
    marginBottom: 25,
    borderLeftWidth: 4,
    borderLeftColor: "#B8986A",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    marginLeft: 10,
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: "#B8986A",
    borderRadius: 25,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    marginBottom: 40,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});