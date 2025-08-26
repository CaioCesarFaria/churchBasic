import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function MinisteriosScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState("Disponíveis");
  const [searchText, setSearchText] = useState("");

  const ministerios = [
    {
      id: 1,
      name: "ABBA MUSIC",
      description: '"Acreditamos que a música como louvor tem o poder de atrair a realidade do Céus a terra..."',
      status: "disponivel",
    },
    {
      id: 2,
      name: "ABBA CRIATIVE",
      description: "Ministério voltado para criação de conteúdo visual e design",
      status: "disponivel",
    },
    {
      id: 3,
      name: "MESAS",
      description: "Grupos pequenos para comunhão e discipulado",
      status: "disponivel",
    },
    {
      id: 4,
      name: "DIACONIA",
      description: "Ministério de serviço e cuidado aos necessitados",
      status: "pendente",
    },
    {
      id: 5,
      name: "INTERCESSÃO",
      description: "Ministério de oração e intercessão",
      status: "aprovado",
    },
  ];

  const filteredMinisterios = ministerios.filter((ministerio) => {
    const matchesSearch = ministerio.name
      .toLowerCase()
      .includes(searchText.toLowerCase());
    const matchesTab =
      activeTab === "Disponíveis"
        ? ministerio.status === "disponivel"
        : activeTab === "Pendentes"
        ? ministerio.status === "pendente"
        : ministerio.status === "aprovado";
    return matchesSearch && matchesTab;
  });

  const handleParticipar = (ministerio) => {
    Alert.alert(
      "Participar",
      `Deseja se inscrever no ministério ${ministerio.name}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: () =>
            Alert.alert("Sucesso", "Inscrição realizada com sucesso!"),
        },
      ]
    );
  };

  const TabButton = ({ title, isActive, onPress }) => (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.activeTabButton]}
      onPress={onPress}
    >
      <Text style={[styles.tabButtonText, isActive && styles.activeTabButtonText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const MinisterioCard = ({ ministerio }) => (
    <View style={styles.ministerioCard}>
      <Text style={styles.ministerioName}>{ministerio.name}</Text>
      {ministerio.description && (
        <Text style={styles.ministerioDescription}>{ministerio.description}</Text>
      )}
      <TouchableOpacity
        style={[
          styles.participarButton,
          ministerio.status === "pendente" && styles.pendenteButton,
          ministerio.status === "aprovado" && styles.aprovadoButton,
        ]}
        onPress={() => handleParticipar(ministerio)}
        disabled={ministerio.status !== "disponivel"}
      >
        <Text style={styles.participarButtonText}>
          {ministerio.status === "disponivel"
            ? "Participar"
            : ministerio.status === "pendente"
            ? "Pendente"
            : "Aprovado"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ministérios</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TabButton
          title="Disponíveis"
          isActive={activeTab === "Disponíveis"}
          onPress={() => setActiveTab("Disponíveis")}
        />
        <TabButton
          title="Pendentes"
          isActive={activeTab === "Pendentes"}
          onPress={() => setActiveTab("Pendentes")}
        />
        <TabButton
          title="Aprovados"
          isActive={activeTab === "Aprovados"}
          onPress={() => setActiveTab("Aprovados")}
        />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Ministérios List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredMinisterios.map((ministerio) => (
          <MinisterioCard key={ministerio.id} ministerio={ministerio} />
        ))}
        
        {filteredMinisterios.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchText
                ? "Nenhum ministério encontrado"
                : `Nenhum ministério ${activeTab.toLowerCase()}`}
            </Text>
          </View>
        )}
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 10,
    marginLeft: -10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginLeft: 10,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTabButton: {
    borderBottomColor: "#B8986A",
  },
  tabButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  activeTabButtonText: {
    color: "#B8986A",
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  ministerioCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ministerioName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  ministerioDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 15,
  },
  participarButton: {
    backgroundColor: "#B8986A",
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: "center",
  },
  pendenteButton: {
    backgroundColor: "#FFA500",
  },
  aprovadoButton: {
    backgroundColor: "#28A745",
  },
  participarButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});