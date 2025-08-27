// MembersAdm.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  where,
} from "firebase/firestore";
import { db } from "../../Firebase/FirebaseConfig";

export default function MembersAdm() {
  const [members, setMembers] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const pageSize = 10;

  const membersRef = collection(db, "churchBasico", "users", "members");

  // 🔹 Carregar primeira página
  const fetchMembers = async () => {
    setLoading(true);
    try {
      const q = query(membersRef, orderBy("name"), limit(pageSize));
      const snapshot = await getDocs(q);

      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMembers(list);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
    } catch (error) {
      console.log("Erro ao buscar membros:", error);
    }
    setLoading(false);
  };

  // 🔹 Paginação
  const fetchMore = async () => {
    if (!lastDoc || searching) return;

    setLoading(true);
    try {
      const q = query(
        membersRef,
        orderBy("name"),
        startAfter(lastDoc),
        limit(pageSize)
      );

      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      setMembers((prev) => [...prev, ...list]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
    } catch (error) {
      console.log("Erro ao carregar mais membros:", error);
    }
    setLoading(false);
  };

  // 🔹 Busca global no banco
  const handleSearch = async (text) => {
    setSearchText(text);

    if (text.trim() === "") {
      setSearching(false);
      fetchMembers();
      return;
    }

    setSearching(true);
    setLoading(true);

    try {
      const q = query(
        membersRef,
        orderBy("name"),
        where("name", ">=", text),
        where("name", "<=", text + "\uf8ff")
      );

      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMembers(list);
    } catch (error) {
      console.log("Erro na busca:", error);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        setSelectedMember(item);
        setModalVisible(true);
      }}
    >
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text style={styles.cardSubtitle}>{item.email || "Sem email"}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Campo de busca */}
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar membro..."
        value={searchText}
        onChangeText={handleSearch}
      />

      {/* Lista */}
      {loading && members.length === 0 ? (
        <ActivityIndicator size="large" color="#B8986A" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          onEndReached={fetchMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loading && !searching ? (
              <ActivityIndicator size="small" color="#B8986A" />
            ) : null
          }
        />
      )}

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            {selectedMember && (
              <>
                <Text style={styles.modalTitle}>{selectedMember.name}</Text>
                <Text style={styles.modalText}>
                  Email: {selectedMember.email || "Não informado"}
                </Text>
                <Text style={styles.modalText}>
                  Telefone: {selectedMember.phone || "Não informado"}
                </Text>
              </>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f9f9f9" },
  searchInput: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  cardSubtitle: { fontSize: 14, color: "#666" },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    width: "85%",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10, color: "#333" },
  modalText: { fontSize: 16, marginBottom: 8, color: "#555" },
  closeButton: {
    marginTop: 15,
    backgroundColor: "#B8986A",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  closeText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

