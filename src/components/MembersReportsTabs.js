// MembersReportsTabs.js
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const MembersReportsTabs = ({
  activeTab,
  members,
  membersExpanded,
  setMembersExpanded,
  openAddMemberModal,
  deleteMember,
  relatorios,
  relatoriosExpanded,
  toggleRelatorioExpansion,
  canManageCelulas,
  canViewReports,
}) => {
  const renderMembros = () => {
    const membersToShow = membersExpanded ? members : members.slice(0, 3);
    
    return (
      <ScrollView style={styles.content}>
        <View style={styles.membersHeader}>
          <Text style={styles.tabTitle}>Membros do Ministério</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="people" size={24} color="#B8986A" />
              <Text style={styles.statNumber}>{members.length}</Text>
              <Text style={styles.statLabel}>Total de Membros</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.addMemberButton} onPress={openAddMemberModal}>
            <Ionicons name="person-add" size={20} color="#fff" />
            <Text style={styles.addMemberButtonText}>Adicionar Membro</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.membersExpandableCard}>
          <View style={styles.membersCardHeader}>
            <Text style={styles.membersCardTitle}>
              Lista de Membros ({members.length})
            </Text>
            
            {members.length > 3 && (
              <TouchableOpacity 
                style={styles.membersExpandButton}
                onPress={() => setMembersExpanded(!membersExpanded)}
              >
                <Text style={styles.membersExpandText}>
                  {membersExpanded ? "Mostrar menos" : `Ver todos (${members.length})`}
                </Text>
                <Ionicons 
                  name={membersExpanded ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#B8986A" 
                />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.membersExpandedContent}>
            {membersToShow.length > 0 ? (
              <FlatList
                data={membersToShow}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.memberCard}>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{item.nome}</Text>
                      <Text style={styles.memberRole}>
                        {item.role === "responsavel" ? "Responsável" : "Membro"}
                      </Text>
                      {item.telefone && (
                        <Text style={styles.memberContact}>📞 {item.telefone}</Text>
                      )}
                      {item.email && (
                        <Text style={styles.memberContact}>📧 {item.email}</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.deleteMemberButton}
                      onPress={() => deleteMember(item)}
                    >
                      <Ionicons name="trash" size={18} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                )}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <Text style={styles.emptyText}>Nenhum membro cadastrado ainda</Text>
            )}
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderRelatorios = () => {
    const relatoriosGrouped = relatorios.reduce((acc, relatorio) => {
      const celulaId = relatorio.celulaId;
      if (!acc[celulaId]) {
        acc[celulaId] = {
          celulaNome: relatorio.celulaNome,
          relatorios: []
        };
      }
      acc[celulaId].relatorios.push(relatorio);
      return acc;
    }, {});

    return (
      <ScrollView style={styles.content}>
        <View style={styles.relatoriosHeader}>
          <Text style={styles.tabTitle}>Relatórios das Células</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="document-text" size={24} color="#4A90E2" />
              <Text style={styles.statNumber}>{relatorios.length}</Text>
              <Text style={styles.statLabel}>Total de Relatórios</Text>
            </View>
          </View>
        </View>

        {Object.keys(relatoriosGrouped).length > 0 ? (
          Object.entries(relatoriosGrouped).map(([celulaId, grupo]) => (
            <View key={celulaId} style={styles.relatoriosGroup}>
              <View style={styles.relatoriosGroupHeader}>
                <Ionicons name="people" size={20} color="#B8986A" />
                <Text style={styles.relatoriosGroupTitle}>
                  {grupo.celulaNome} ({grupo.relatorios.length} relatórios)
                </Text>
              </View>
              
              {grupo.relatorios.map((relatorio) => (
                <TouchableOpacity
                  key={relatorio.id}
                  style={styles.relatorioItem}
                  onPress={() => toggleRelatorioExpansion(relatorio.id)}
                >
                  <View style={styles.relatorioHeader}>
                    <View style={styles.relatorioInfo}>
                      <Text style={styles.relatorioDate}>
                        📅 {relatorio.dataEncontro}
                      </Text>
                      <Text style={styles.relatorioSummary}>
                        👥 {relatorio.quantidadeMembros} membros
                        {relatorio.quantidadeVisitantes > 0 && ` • 👋 ${relatorio.quantidadeVisitantes} visitantes`}
                      </Text>
                      <Text style={styles.relatorioAuthor}>
                        Por: {relatorio.createdByName}
                      </Text>
                    </View>
                    <Ionicons 
                      name={relatoriosExpanded[relatorio.id] ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#666" 
                    />
                  </View>
                  
                  {relatoriosExpanded[relatorio.id] && (
                    <View style={styles.relatorioDetails}>
                      {relatorio.problemas && (
                        <View style={styles.relatorioSection}>
                          <Text style={styles.relatorioSectionTitle}>⚠ Problemas/Dificuldades:</Text>
                          <Text style={styles.relatorioSectionText}>{relatorio.problemas}</Text>
                        </View>
                      )}
                      
                      {relatorio.motivosOracao && (
                        <View style={styles.relatorioSection}>
                          <Text style={styles.relatorioSectionTitle}>🙏 Motivos de Oração:</Text>
                          <Text style={styles.relatorioSectionText}>{relatorio.motivosOracao}</Text>
                        </View>
                      )}
                      
                      <View style={styles.relatorioFooter}>
                        <Text style={styles.relatorioCreateDate}>
                          Enviado em: {relatorio.createdAt ? 
                            new Date(relatorio.createdAt.toDate()).toLocaleString() : 
                            'Data não disponível'
                          }
                        </Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))
        ) : (
          <View style={styles.emptyRelatoriosContainer}>
            <Ionicons name="document-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Nenhum Relatório Encontrado</Text>
            <Text style={styles.emptyText}>
              Os relatórios das células aparecerão aqui quando enviados.
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  if (activeTab === "membros" && canManageCelulas) {
    return renderMembros();
  }

  if (activeTab === "relatorios" && canViewReports) {
    return renderRelatorios();
  }

  return null;
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  membersHeader: {
    paddingBottom: 20,
  },
  relatoriosHeader: {
    paddingBottom: 20,
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
  addMemberButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#B8986A",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    gap: 8,
  },
  addMemberButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  membersExpandableCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  membersCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  membersCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  membersExpandButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  membersExpandText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B8986A",
  },
  membersExpandedContent: {
    padding: 16,
  },
  memberCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  memberRole: {
    fontSize: 12,
    color: "#B8986A",
    fontWeight: "600",
    marginBottom: 4,
  },
  memberContact: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  deleteMemberButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#ffe6e6",
  },
  relatoriosGroup: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  relatoriosGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  relatoriosGroupTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 10,
  },
  relatorioItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#f8f9fa",
  },
  relatorioHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  relatorioInfo: {
    flex: 1,
  },
  relatorioDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  relatorioSummary: {
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
  },
  relatorioAuthor: {
    fontSize: 12,
    color: "#999",
  },
  relatorioDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#f8f9fa",
  },
  relatorioSection: {
    marginBottom: 12,
  },
  relatorioSectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  relatorioSectionText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  relatorioFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  relatorioCreateDate: {
    fontSize: 11,
    color: "#999",
    fontStyle: "italic",
  },
  emptyRelatoriosContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
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
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    paddingVertical: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginTop: 20,
    marginBottom: 8,
  },
});

export default MembersReportsTabs;