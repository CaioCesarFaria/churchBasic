// CelulaModals.js
import React from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const CelulaModals = ({
  // Modal de Célula
  modalVisible,
  setModalVisible,
  editMode,
  celulaForm,
  setCelulaForm,
  resetForm,
  saveCelula,
  loading,
  responsavelSearch,
  setResponsavelSearch,
  searchUsers,
  searchingUsers,
  selectResponsavel,
  removeResponsavel,
  canManageCelulas,
  
  // Modal de Membro
  memberModalVisible,
  setMemberModalVisible,
  userSearchText,
  setUserSearchText,
  addMemberFromUser,
  
  // Modal de Relatório
  reportModalVisible,
  setReportModalVisible,
  relatorioForm,
  setRelatorioForm,
  resetRelatorioForm,
  saveRelatorio,
}) => {
  const renderResponsavelSelector = () => {
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Responsável pela Célula: *</Text>
        <View style={styles.responsavelSelectorContainer}>
          {celulaForm.responsavel ? (
            <View style={styles.selectedResponsavel}>
              <Text style={styles.selectedResponsavelName}>{celulaForm.responsavel.nome}</Text>
              <TouchableOpacity onPress={removeResponsavel} style={styles.removeResponsavelButton}>
                <Ionicons name="close" size={16} color="#ff4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <TextInput
                style={styles.responsavelSearchInput}
                placeholder="Buscar responsável..."
                value={responsavelSearch}
                onChangeText={setResponsavelSearch}
              />
              
              {searchingUsers && (
                <View style={styles.searchingContainer}>
                  <ActivityIndicator size="small" color="#B8986A" />
                  <Text style={styles.searchingText}>Buscando usuários...</Text>
                </View>
              )}
              
              {searchUsers.length > 0 && (
                <View style={styles.searchResultsContainer}>
                  {searchUsers.map((user) => (
                    <TouchableOpacity
                      key={user.id}
                      style={styles.userSearchResult}
                      onPress={() => selectResponsavel(user)}
                    >
                      <View style={styles.userInfo}>
                        <Text style={styles.userSearchResultText}>{user.name}</Text>
                        {user.email && (
                          <Text style={styles.userEmailText}>{user.email}</Text>
                        )}
                      </View>
                      <Ionicons name="add-circle-outline" size={20} color="#B8986A" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              {responsavelSearch.length >= 2 && searchUsers.length === 0 && !searchingUsers && (
                <Text style={styles.noResultsText}>Nenhum usuário encontrado</Text>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <>
      {/* Modal de Cadastro/Edição de Célula */}
      {canManageCelulas && (
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setModalVisible(false);
            resetForm();
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editMode ? "Editar Célula" : "Nova Célula"}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nome da Célula: *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Digite o nome da célula"
                    value={celulaForm.nome}
                    onChangeText={(text) => setCelulaForm({ ...celulaForm, nome: text })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Telefone de Contato: *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="(DD) 9XXXX-XXXX"
                    value={celulaForm.telefone}
                    onChangeText={(text) => setCelulaForm({ ...celulaForm, telefone: text })}
                    keyboardType="phone-pad"
                    maxLength={15}
                  />
                </View>

                {renderResponsavelSelector()}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setModalVisible(false);
                      resetForm();
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={saveCelula}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.saveButtonText}>
                        {editMode ? "Atualizar" : "Salvar"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Modal de Adicionar Membro */}
      {canManageCelulas && (
        <Modal
          visible={memberModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setMemberModalVisible(false);
            setUserSearchText("");
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Adicionar Membro</Text>
                <TouchableOpacity
                  onPress={() => {
                    setMemberModalVisible(false);
                    setUserSearchText("");
                  }}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Procurar Membro:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite o nome para buscar..."
                  value={userSearchText}
                  onChangeText={setUserSearchText}
                  autoFocus
                />
              </View>

              {searchingUsers && (
                <View style={styles.searchingContainer}>
                  <ActivityIndicator size="small" color="#B8986A" />
                  <Text style={styles.searchingText}>Buscando usuários...</Text>
                </View>
              )}

              <FlatList
                data={searchUsers}
                keyExtractor={(item) => item.id}
                style={styles.usersList}
                ListEmptyComponent={() => {
                  if (searchingUsers) return null;
                  if (userSearchText.length >= 2 && searchUsers.length === 0) {
                    return <Text style={styles.emptyText}>Nenhum usuário encontrado</Text>;
                  }
                  if (userSearchText.length < 2) {
                    return <Text style={styles.emptyText}>Digite pelo menos 2 caracteres para buscar</Text>;
                  }
                  return null;
                }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.userItem}
                    onPress={() => addMemberFromUser(item)}
                  >
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{item.name}</Text>
                      {item.email && (
                        <Text style={styles.userEmail}>{item.email}</Text>
                      )}
                    </View>
                    <Ionicons name="add-circle" size={24} color="#B8986A" />
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Modal de Relatório */}
      <Modal
        visible={reportModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setReportModalVisible(false);
          resetRelatorioForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gerar Relatório da Célula</Text>
              <TouchableOpacity
                onPress={() => {
                  setReportModalVisible(false);
                  resetRelatorioForm();
                }}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Célula:</Text>
                <View style={styles.selectedCelulaContainer}>
                  <Text style={styles.selectedCelulaText}>
                    {relatorioForm.celulaNome || "Nenhuma célula selecionada"}
                  </Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Data do Encontro: *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/AAAA"
                  value={relatorioForm.dataEncontro}
                  onChangeText={(text) => setRelatorioForm({ ...relatorioForm, dataEncontro: text })}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Quantidade de Membros Presentes: *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 12"
                  value={relatorioForm.quantidadeMembros}
                  onChangeText={(text) => setRelatorioForm({ ...relatorioForm, quantidadeMembros: text })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Quantidade de Visitantes: (opcional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 3"
                  value={relatorioForm.quantidadeVisitantes}
                  onChangeText={(text) => setRelatorioForm({ ...relatorioForm, quantidadeVisitantes: text })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Problemas/Dificuldades:</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Descreva qualquer problema ou dificuldade encontrada..."
                  value={relatorioForm.problemas}
                  onChangeText={(text) => setRelatorioForm({ ...relatorioForm, problemas: text })}
                  multiline={true}
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Motivos de Oração:</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Compartilhe os pedidos de oração da célula..."
                  value={relatorioForm.motivosOracao}
                  onChangeText={(text) => setRelatorioForm({ ...relatorioForm, motivosOracao: text })}
                  multiline={true}
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setReportModalVisible(false);
                    resetRelatorioForm();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={saveRelatorio}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Enviar Relatório</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
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
  selectedCelulaContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#f8f9fa",
  },
  selectedCelulaText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  responsavelSelectorContainer: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
  },
  selectedResponsavel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#B8986A",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  selectedResponsavelName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  removeResponsavelButton: {
    padding: 2,
  },
  responsavelSearchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#fff",
    marginBottom: 5,
  },
  searchResultsContainer: {
    maxHeight: 150,
    backgroundColor: "#f8f9fa",
    borderRadius: 6,
    paddingVertical: 5,
  },
  userSearchResult: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  userSearchResultText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  userEmailText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  searchingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 10,
  },
  searchingText: {
    fontSize: 14,
    color: "#666",
  },
  noResultsText: {
    textAlign: "center",
    color: "#999",
    fontSize: 12,
    fontStyle: "italic",
    paddingVertical: 10,
  },
  usersList: {
    maxHeight: 300,
    marginTop: 10,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    paddingVertical: 20,
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
});

export default CelulaModals;