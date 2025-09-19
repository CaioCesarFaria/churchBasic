// CelulasList.js - CORRIGIDO
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const CelulasList = ({
  celulas,
  loading,
  expandedCelulas,
  setExpandedCelulas,
  canManageCelulas,
  canCreateReports,
  isMember, // Nova prop para identificar membros
  openAddModal,
  openEditModal,
  openReportModal,
  deleteCelula,
}) => {
  const formatPhone = (phone) => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 11) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    } else if (clean.length === 10) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
    }
    return phone;
  };

  return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* BOTÃO NOVA CÉLULA - APENAS PARA ADMINS */}
      {canManageCelulas && (
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Nova Célula +</Text>
        </TouchableOpacity>
      )}

      {/* BOTÃO RELATÓRIO - APENAS PARA MEMBROS */}
      {canCreateReports && isMember && (
        <TouchableOpacity 
          style={styles.generateReportButton} 
          onPress={() => {
            if (celulas.length === 0) {
              Alert.alert("Aviso", "Você não é responsável por nenhuma célula.");
              return;
            }
            if (celulas.length === 1) {
              openReportModal(celulas[0]);
            } else {
              Alert.alert(
                "Selecionar Célula",
                "Escolha uma célula para gerar o relatório nos botões azuis ao lado de cada célula."
              );
            }
          }}
        >
          <Ionicons name="document-text" size={24} color="#fff" />
          <Text style={styles.generateReportButtonText}>
            Gerar Relatório da Minha Célula
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity 
        style={styles.expandableCard}
        onPress={() => setExpandedCelulas(!expandedCelulas)}
      >
        <View style={styles.cardHeader}>
          <Ionicons name="people-outline" size={24} color="#B8986A" />
          <Text style={styles.cardTitle}>
            {isMember ? "Minha Célula" : `Células Cadastradas (${celulas.length})`}
          </Text>
          <Ionicons 
            name={expandedCelulas ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#666" 
          />
        </View>
        
        {expandedCelulas && (
          <View style={styles.cardContent}>
            {loading ? (
              <ActivityIndicator size="small" color="#B8986A" />
            ) : celulas.length > 0 ? (
              celulas.map((celula) => (
                <View key={celula.id} style={styles.celulaItem}>
                  <View style={styles.celulaInfo}>
                    <Text style={styles.celulaNome}>{celula.nome}</Text>
                    <Text style={styles.celulaDetails}>
                      Responsável: {celula.responsavel?.nome || "Não definido"}
                    </Text>
                    <Text style={styles.celulaDetails}>
                      Telefone: {formatPhone(celula.telefone)}
                    </Text>
                    {celula.createdAt && (
                      <Text style={styles.celulaDate}>
                        Criado em: {new Date(celula.createdAt.toDate()).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.celulaActions}>
                    {/* BOTÃO DE RELATÓRIO - APENAS PARA MEMBROS */}
                    {canCreateReports && isMember && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.reportButton]}
                        onPress={() => openReportModal(celula)}
                      >
                        <Ionicons name="document-text" size={16} color="#4A90E2" />
                      </TouchableOpacity>
                    )}
                    
                    {/* BOTÕES DE GERENCIAMENTO APENAS PARA ADMINS */}
                    {canManageCelulas && (
                      <>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => openEditModal(celula)}
                        >
                          <Ionicons name="pencil" size={16} color="#B8986A" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.deleteButton]}
                          onPress={() => deleteCelula(celula)}
                        >
                          <Ionicons name="trash" size={16} color="#ff4444" />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noCelulasText}>
                {isMember ? 
                  "Você não é responsável por nenhuma célula ainda." :
                  "Nenhuma célula cadastrada ainda."
                }
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>

      {celulas.length > 0 && (
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Estatísticas</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={20} color="#B8986A" />
              <Text style={styles.statNumber}>{celulas.length}</Text>
              <Text style={styles.statLabel}>
                {isMember ? "Minha Célula" : "Células Ativas"}
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  addButton: {
    backgroundColor: "#B8986A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  generateReportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4A90E2",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  generateReportButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  expandableCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 20,
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
  celulaItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  celulaInfo: {
    flex: 1,
    marginRight: 10,
  },
  celulaNome: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  celulaDetails: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  celulaDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  celulaActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#f8f8f8",
  },
  reportButton: {
    backgroundColor: "#e6f3ff",
  },
  deleteButton: {
    backgroundColor: "#ffe6e6",
  },
  noCelulasText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    paddingVertical: 20,
  },
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 100,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: 20,
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
});

export default CelulasList;