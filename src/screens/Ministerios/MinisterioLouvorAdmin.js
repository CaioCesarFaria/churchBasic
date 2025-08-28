import React, { useEffect, useRef, useState } from "react";
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
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../../Firebase/FirebaseConfig";
import {
  doc,
  setDoc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  startAt,
  endAt,
  getDocs,
  onSnapshot,
} from "firebase/firestore";

const formatDateBR = (date) => {
  try {
    return new Date(date).toLocaleDateString("pt-BR");
  } catch {
    return "";
  }
};

export default function MinisterioLouvorAdmin({ route }) {
  const ministerio = route.params?.ministerio || "louvor";
  const navigation = useNavigation();

  // --- Busca e adicionar membros ---
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const searchDebounce = useRef(null);

  const [members, setMembers] = useState([]);
  const [membersExpanded, setMembersExpanded] = useState(true);

  // --- Ensaios ---
  const [ensaios, setEnsaios] = useState([]);
  const [ensaiosExpanded, setEnsaiosExpanded] = useState(true);
  const [showEnsaiosModal, setShowEnsaiosModal] = useState(false);
  const [ensaioNome, setEnsaioNome] = useState("");
  const [ensaioDataStr, setEnsaioDataStr] = useState(formatDateBR(new Date()));
  const [editingEnsaioId, setEditingEnsaioId] = useState(null);
  const [savingEnsaio, setSavingEnsaio] = useState(false);

  // Escuta membros
  useEffect(() => {
    const membersCol = collection(
      db,
      "churchBasico",
      "ministerios",
      "conteudo",
      ministerio,
      "members"
    );
    const unsub = onSnapshot(membersCol, (snap) => {
      const list = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setMembers(list);
    });
    return () => unsub();
  }, [ministerio]);

  // Escuta ensaios
  useEffect(() => {
    const q = query(
      collection(db, "churchBasico", "ministerios", "conteudo", ministerio, "ensaios"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setEnsaios(list);
    });
    return () => unsub();
  }, [ministerio]);

  // Buscar usuários
  const searchUsersByName = async (term) => {
    if (!term || term.trim().length < 2) {
      setSearchResults([]);
      setSelectedUser(null);
      return;
    }
    try {
      const usersCol = collection(db, "churchBasico", "users", "members");
      const q = query(usersCol, orderBy("name"), startAt(term), endAt(term + "\uf8ff"));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
      setSearchResults(list);
    } catch (e) {
      console.log("Erro ao buscar:", e);
      Alert.alert("Erro", "Não foi possível buscar usuários.");
    }
  };

  const onChangeSearch = (text) => {
    setSearchTerm(text);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => searchUsersByName(text.trim()), 300);
  };

  const addMemberToMinisterio = async () => {
    if (!selectedUser || !ministerio) return;
    const uid = selectedUser.uid;
    try {
      setLoading(true);
      await setDoc(
        doc(db, "churchBasico", "ministerios", "conteudo", ministerio, "members", uid),
        {
          uid,
          name: selectedUser.name || "",
          email: selectedUser.email || "",
          phone: selectedUser.phone || "",
          addedAt: serverTimestamp(),
        },
        { merge: true }
      );
      await setDoc(
        doc(db, "churchBasico", "users", uid),
        { userType: "memberMinisterio", ministerio },
        { merge: true }
      );
      Alert.alert("Sucesso", `${selectedUser.name} adicionado!`);
      setSearchTerm("");
      setSearchResults([]);
      setSelectedUser(null);
    } catch (e) {
      console.log("Erro:", e);
      Alert.alert("Erro", "Não foi possível adicionar membro.");
    } finally {
      setLoading(false);
    }
  };

  const saveEnsaio = async () => {
    if (!ensaioNome || !ensaioDataStr) {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }
    try {
      setSavingEnsaio(true);
      if (editingEnsaioId) {
        await updateDoc(
          doc(db, "churchBasico", "ministerios", "conteudo", ministerio, "ensaios", editingEnsaioId),
          { nome: ensaioNome.trim(), dataStr: ensaioDataStr, updatedAt: serverTimestamp() }
        );
        Alert.alert("Sucesso", "Ensaio atualizado!");
        setEditingEnsaioId(null);
      } else {
        await addDoc(
          collection(db, "churchBasico", "ministerios", "conteudo", ministerio, "ensaios"),
          { nome: ensaioNome.trim(), dataStr: ensaioDataStr, createdAt: serverTimestamp(), createdBy: auth.currentUser?.uid || null }
        );
        Alert.alert("Sucesso", "Ensaio criado!");
      }
      setShowEnsaiosModal(false);
      setEnsaioNome("");
      setEnsaioDataStr(formatDateBR(new Date()));
    } catch (e) {
      console.log("Erro ao salvar ensaio:", e);
      Alert.alert("Erro", "Não foi possível salvar ensaio.");
    } finally {
      setSavingEnsaio(false);
    }
  };

  const deleteEnsaio = async (id) => {
    try {
      await deleteDoc(doc(db, "churchBasico", "ministerios", "conteudo", ministerio, "ensaios", id));
      Alert.alert("Sucesso", "Ensaio excluído.");
    } catch (e) {
      console.log(e);
      Alert.alert("Erro", "Não foi possível excluir.");
    }
  };

  const openEditEnsaioModal = (ensaio) => {
    setEnsaioNome(ensaio.nome);
    setEnsaioDataStr(ensaio.dataStr);
    setEditingEnsaioId(ensaio.id);
    setShowEnsaiosModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 10 }}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>

        <Text style={styles.header}>MINISTÉRIO LOUVOR</Text>

        {/* Adicionar Membro */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Adicionar Membro</Text>
          <TextInput
            style={styles.input}
            placeholder="Buscar usuário por nome..."
            value={searchTerm}
            onChangeText={onChangeSearch}
          />
          {searchResults.map((u) => (
            <TouchableOpacity
              key={u.uid}
              style={[styles.searchItem, selectedUser?.uid === u.uid && styles.searchItemSelected]}
              onPress={() => setSelectedUser(u)}
            >
              <Ionicons name="person-circle-outline" size={20} color="#666" />
              <Text style={styles.searchItemName}>{u.name}</Text>
            </TouchableOpacity>
          ))}
          {selectedUser && (
            <TouchableOpacity style={styles.smallAddButton} onPress={addMemberToMinisterio}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.smallAddText}>Adicionar</Text>}
            </TouchableOpacity>
          )}
        </View>

        {/* Membros */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.cardHeader} onPress={() => setMembersExpanded((s) => !s)}>
            <Text style={styles.sectionTitle}>Membros do Ministério</Text>
            <Ionicons name={membersExpanded ? "chevron-up" : "chevron-down"} size={18} />
          </TouchableOpacity>
          {membersExpanded &&
            (members.length === 0 ? (
              <Text style={styles.noInfoText}>Nenhum membro.</Text>
            ) : (
              members.map((m) => <Text key={m.uid} style={styles.memberName}>{m.name}</Text>)
            ))}
        </View>

        {/* Ensaios */}
        <View style={{ alignItems: "flex-end", marginBottom: 10 }}>
          <TouchableOpacity style={styles.escalaBtnTop} onPress={() => setShowEnsaiosModal(true)}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.escalaBtnTopText}>Cadastrar Ensaio +</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <TouchableOpacity style={styles.cardHeader} onPress={() => setEnsaiosExpanded((s) => !s)}>
            <Text style={styles.sectionTitle}>Ensaios Cadastrados</Text>
            <Ionicons name={ensaiosExpanded ? "chevron-up" : "chevron-down"} size={18} />
          </TouchableOpacity>
          {ensaiosExpanded &&
            (ensaios.length === 0 ? (
              <Text style={styles.noInfoText}>Nenhum ensaio.</Text>
            ) : (
              ensaios.map((e) => (
                <View key={e.id} style={styles.escalaResumo}>
                  <Text style={styles.escalaResumoTitulo}>{e.nome}</Text>
                  <Text style={styles.escalaResumoMeta}>{e.dataStr}</Text>
                  <View style={{ flexDirection: "row", marginTop: 6, gap: 10 }}>
                    <TouchableOpacity onPress={() => openEditEnsaioModal(e)} style={styles.actionBtn}>
                      <Ionicons name="pencil-outline" size={18} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteEnsaio(e.id)} style={[styles.actionBtn, { backgroundColor: "#fee" }]}>
                      <Ionicons name="trash-outline" size={18} color="#c00" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ))}
        </View>
      </ScrollView>

      {/* Modal Ensaios */}
      <Modal visible={showEnsaiosModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingEnsaioId ? "Editar Ensaio" : "Novo Ensaio"}</Text>
              <TouchableOpacity onPress={() => setShowEnsaiosModal(false)}>
                <Ionicons name="close" size={22} />
              </TouchableOpacity>
            </View>

            <TextInput style={styles.input} placeholder="Nome do Ensaio" value={ensaioNome} onChangeText={setEnsaioNome} />
            <TextInput style={styles.input} placeholder="Data (DD/MM/AAAA)" value={ensaioDataStr} onChangeText={setEnsaioDataStr} />

            <TouchableOpacity style={styles.saveButtonSmall} onPress={saveEnsaio} disabled={savingEnsaio}>
              {savingEnsaio ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveSmallText}>Salvar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  scroll: { padding: 18, paddingBottom: 40 },
  header: { fontSize: 20, fontWeight: "700", marginBottom: 10 },

  card: { backgroundColor: "#E0E0E0", borderRadius: 12, padding: 12, marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginBottom: 8 },
  searchItem: { flexDirection: "row", alignItems: "center", padding: 8, borderBottomWidth: 1, borderColor: "#eee" },
  searchItemSelected: { backgroundColor: "#eef" },
  searchItemName: { marginLeft: 8, fontSize: 14 },
  smallAddButton: { backgroundColor: "#BE997E", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: "flex-start" },
  smallAddText: { color: "#fff", fontWeight: "600" },
  noInfoText: { fontSize: 13, color: "#777", marginTop: 6 },
  memberName: { fontSize: 14, paddingVertical: 3 },

  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  escalaResumo: { borderTopWidth: 1, borderColor: "#eee", paddingVertical: 6 },
  escalaResumoTitulo: { fontWeight: "700" },
  escalaResumoMeta: { fontSize: 13, color: "#555" },
  actionBtn: { padding: 6, backgroundColor: "#eee", borderRadius: 6 },

  escalaBtnTop: { flexDirection: "row", alignItems: "center", backgroundColor: "#BE997E", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  escalaBtnTopText: { color: "#fff", fontWeight: "700", marginLeft: 4 },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalCard: { backgroundColor: "#fff", borderRadius: 14, padding: 16, width: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: "700" },
  saveButtonSmall: { backgroundColor: "#BE997E", paddingVertical: 10, borderRadius: 8, marginTop: 14, alignItems: "center" },
  saveSmallText: { color: "#fff", fontWeight: "700" },
});


