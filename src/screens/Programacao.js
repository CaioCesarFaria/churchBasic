import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function ProgramacaoScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const eventos = [
    {
      id: 1,
      title: "Culto de Domingo",
      time: "09:00",
      location: "Auditório Principal",
      description: "Culto de adoração e palavra",
      type: "culto",
    },
    {
      id: 2,
      title: "Escola Dominical",
      time: "08:00",
      location: "Salas de Aula",
      description: "Estudo bíblico por faixa etária",
      type: "estudo",
    },
    {
      id: 3,
      title: "Culto da Juventude",
      time: "19:30",
      location: "Auditório Principal",
      description: "Culto direcionado aos jovens",
      type: "culto",
    },
    {
      id: 4,
      title: "Reunião de Oração",
      time: "19:00",
      location: "Sala de Oração",
      description: "Momento de intercessão",
      type: "oracao",
    },
    {
      id: 5,
      title: "Mesa da Família Silva",
      time: "20:00",
      location: "Casa da Família Silva",
      description: "Encontro do grupo pequeno",
      type: "mesa",
    },
  ];

  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  
  const getWeekDays = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay);
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDays.push(date);
    }
    return weekDays;
  };

  const formatDate = (date) => {
    return date.getDate().toString().padStart(2, '0');
  };

  const isSameDate = (date1, date2) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const getEventIcon = (type) => {
    switch (type) {
      case "culto":
        return "musical-notes-outline";
      case "estudo":
        return "book-outline";
      case "oracao":
        return "hand-left-outline";
      case "mesa":
        return "home-outline";
      default:
        return "calendar-outline";
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case "culto":
        return "#B8986A";
      case "estudo":
        return "#4A90E2";
      case "oracao":
        return "#7B68EE";
      case "mesa":
        return "#FF6B6B";
      default:
        return "#666";
    }
  };

  const handleEventPress = (evento) => {
    Alert.alert(
      evento.title,
      `${evento.description}\n\nHorário: ${evento.time}\nLocal: ${evento.location}`,
      [
        { text: "Fechar", style: "cancel" },
        { text: "Participar", onPress: () => Alert.alert("Confirmado!", "Presença confirmada no evento") },
      ]
    );
  };

  const EventCard = ({ evento }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => handleEventPress(evento)}
    >
      <View style={styles.eventTime}>
        <Text style={styles.timeText}>{evento.time}</Text>
      </View>
      
      <View style={[styles.eventIcon, { backgroundColor: getEventColor(evento.type) }]}>
        <Ionicons name={getEventIcon(evento.type)} size={20} color="#fff" />
      </View>
      
      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle}>{evento.title}</Text>
        <Text style={styles.eventLocation}>{evento.location}</Text>
        <Text style={styles.eventDescription}>{evento.description}</Text>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Programação</Text>
        <TouchableOpacity style={styles.calendarButton}>
          <Ionicons name="calendar-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Week Days */}
        <View style={styles.weekContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weekContent}
          >
            {getWeekDays().map((date, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayButton,
                  isSameDate(date, selectedDate) && styles.selectedDayButton,
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text
                  style={[
                    styles.dayName,
                    isSameDate(date, selectedDate) && styles.selectedDayText,
                  ]}
                >
                  {diasSemana[date.getDay()]}
                </Text>
                <Text
                  style={[
                    styles.dayNumber,
                    isSameDate(date, selectedDate) && styles.selectedDayText,
                  ]}
                >
                  {formatDate(date)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Current Date */}
        <View style={styles.currentDateContainer}>
          <Text style={styles.currentDateText}>
            {selectedDate.toLocaleDateString('pt-BR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Events List */}
        <View style={styles.eventsContainer}>
          {eventos.map((evento) => (
            <EventCard key={evento.id} evento={evento} />
          ))}
          
          {eventos.length === 0 && (
            <View style={styles.noEventsContainer}>
              <Ionicons name="calendar-outline" size={64} color="#ccc" />
              <Text style={styles.noEventsText}>Nenhum evento programado</Text>
              <Text style={styles.noEventsSubtext}>
                Eventos aparecerão aqui quando forem agendados
              </Text>
            </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
  },
  calendarButton: {
    padding: 10,
    marginRight: -10,
  },
  weekContainer: {
    backgroundColor: "#fff",
    paddingVertical: 15,
  },
  weekContent: {
    paddingHorizontal: 20,
  },
  dayButton: {
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
    borderRadius: 15,
    minWidth: 60,
  },
  selectedDayButton: {
    backgroundColor: "#B8986A",
  },
  dayName: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  selectedDayText: {
    color: "#fff",
  },
  currentDateContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  currentDateText: {
    fontSize: 16,
    color: "#666",
    textTransform: "capitalize",
  },
  eventsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventTime: {
    marginRight: 15,
    minWidth: 50,
  },
  timeText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 12,
    color: "#B8986A",
    marginBottom: 2,
  },
  eventDescription: {
    fontSize: 12,
    color: "#666",
  },
  noEventsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  noEventsText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 20,
    textAlign: "center",
  },
  noEventsSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
});