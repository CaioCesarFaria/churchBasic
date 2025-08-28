// MinisterioComunicacaoAdmin.js
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
import { Picker } from "@react-native-picker/picker";

const formatDateBR = (date) => {
  try {
    return new Date(date).toLocaleDateString("pt-BR");
  } catch {
    return "";
  }
};

const DIAS_SEMANA = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

const FUNCOES_BASE = [
  "Data-Show1",
  "Data-Show2",
  "Data-Show3",
  "Data-Show4",
  "Data-Show5",
  "Data-Show6",
  "Data-Show7",
];

export default function MinisterioComunicacaoAdmin({ route }) {
  const ministerio = route.params?.ministerio || "comunicacao";
  const navigation = useNavigation();
  // busca usuários
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const searchDebounce = useRef(null);
  const [loading, setLoading] = useState(false);

  // membros
  const [members, setMembers] = useState([]);
  const [membersExpanded, setMembersExpanded] = useState(true);

  // escalas
  const [escalasCadastradas, setEscalasCadastradas] = useState([]);
  const [escalasExpanded, setEscalasExpanded] = useState(true);

  // modal escala
  const [showEscalaModal, setShowEscalaModal] = useState(false);
  const [escalaNome, setEscalaNome] = useState("");
  const [escalaDataStr, setEscalaDataStr] = useState(formatDateBR(new Date()));
  const [escalaDia, setEscalaDia] = useState(DIAS_SEMANA[0]);
  const [escalaResponsavelUid, setEscalaResponsavelUid] = useState("");
  const [escalaFuncao, setEscalaFuncao] = useState(FUNCOES_BASE[0]);
  const [funcoes, setFuncoes] = useState(FUNCOES_BASE);
  const [novaFuncao, setNovaFuncao] = useState("");
  const [savingEscala, setSavingEscala] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // escuta membros
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
      if (list.length > 0 && !escalaResponsavelUid)
        setEscalaResponsavelUid(list[0].uid);
    });
    return () => unsub();
  }, [ministerio]);

  // escuta escalas
  useEffect(() => {
    const q = query(
      collection(
        db,
        "churchBasico",
        "ministerios",
        "conteudo",
        ministerio,
        "escalas"
      ),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setEscalasCadastradas(list);
    });
    return () => unsub();
  }, [ministerio]);

  // buscar usuários por nome
  const searchUsersByName = async (term) => {
    if (!term || term.trim().length < 2) {
      setSearchResults([]);
      setSelectedUser(null);
      return;
    }
    try {
      const usersCol = collection(db, "churchBasico", "users", "members");
      const q = query(
        usersCol,
        orderBy("name"),
        startAt(term),
        endAt(term + "\uf8ff")
      );
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
    searchDebounce.current = setTimeout(() => {
      searchUsersByName(text.trim());
    }, 300);
  };

  // adicionar membro
  const addMemberToMinisterio = async () => {
    if (!selectedUser || !ministerio) return;
    const uid = selectedUser.uid;
    try {
      setLoading(true);
      // salva dentro do ministério
      await setDoc(
        doc(
          db,
          "churchBasico",
          "ministerios",
          "conteudo",
          ministerio,
          "members",
          uid
        ),
        {
          uid,
          name: selectedUser.name || "",
          email: selectedUser.email || "",
          phone: selectedUser.phone || "",
          addedAt: serverTimestamp(),
        },
        { merge: true }
      );
      // atualiza userType do usuário
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

  // salvar escala
  const saveEscala = async () => {
    if (
      !escalaNome ||
      !escalaDataStr ||
      !escalaDia ||
      !escalaResponsavelUid ||
      !escalaFuncao
    ) {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }
    try {
      setSavingEscala(true);
      if (editingId) {
        await updateDoc(
          doc(
            db,
            "churchBasico",
            "ministerios",
            "conteudo",
            ministerio,
            "escalas",
            editingId
          ),
          {
            nome: escalaNome.trim(),
            dataStr: escalaDataStr,
            dia: escalaDia,
            responsavelUid: escalaResponsavelUid,
            funcao: escalaFuncao,
            updatedAt: serverTimestamp(),
          }
        );
        Alert.alert("Sucesso", "Escala atualizada!");
        setEditingId(null);
      } else {
        await addDoc(
          collection(
            db,
            "churchBasico",
            "ministerios",
            "conteudo",
            ministerio,
            "escalas"
          ),
          {
            nome: escalaNome.trim(),
            dataStr: escalaDataStr,
            dia: escalaDia,
            responsavelUid: escalaResponsavelUid,
            funcao: escalaFuncao,
            createdAt: serverTimestamp(),
            createdBy: auth.currentUser?.uid || null,
          }
        );
        Alert.alert("Sucesso", "Escala criada!");
      }
      setShowEscalaModal(false);
      resetEscalaFields();
    } catch (e) {
      console.log("Erro ao salvar escala:", e);
      Alert.alert("Erro", "Não foi possível salvar escala.");
    } finally {
      setSavingEscala(false);
    }
  };

  const deleteEscala = async (id) => {
    try {
      await deleteDoc(
        doc(
          db,
          "churchBasico",
          "ministerios",
          "conteudo",
          ministerio,
          "escalas",
          id
        )
      );
      Alert.alert("Sucesso", "Escala excluída.");
    } catch (e) {
      console.log(e);
      Alert.alert("Erro", "Não foi possível excluir.");
    }
  };

  const openEditModal = (escala) => {
    setEscalaNome(escala.nome);
    setEscalaDataStr(escala.dataStr);
    setEscalaDia(escala.dia);
    setEscalaResponsavelUid(escala.responsavelUid);
    setEscalaFuncao(escala.funcao);
    setEditingId(escala.id);
    setShowEscalaModal(true);
  };

  const resetEscalaFields = () => {
    setEscalaNome("");
    setEscalaDataStr(formatDateBR(new Date()));
    setEscalaDia(DIAS_SEMANA[0]);
    setEscalaFuncao(FUNCOES_BASE[0]);
    setEditingId(null);
  };

  const addNovaFuncao = () => {
    const v = (novaFuncao || "").trim();
    if (!v) return;
    if (!funcoes.includes(v)) setFuncoes((p) => [...p, v]);
    setEscalaFuncao(v);
    setNovaFuncao("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.header}>COMUNICAÇÃO</Text>

        {/* Nova Escala */}
        <View style={{ alignItems: "flex-end", marginBottom: 10 }}>
          <TouchableOpacity
            style={styles.escalaBtnTop}
            onPress={() => setShowEscalaModal(true)}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.escalaBtnTopText}>Nova Escala +</Text>
          </TouchableOpacity>
        </View>

        {/* Buscar e adicionar membro */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Adicionar Membro</Text>
          <TextInput
            style={styles.input}
            placeholder="Buscar usuário por nome..."
            value={searchTerm}
            onChangeText={onChangeSearch}
          />
          {searchResults.length > 0 &&
            searchResults.map((u) => (
              <TouchableOpacity
                key={u.uid}
                style={[
                  styles.searchItem,
                  selectedUser?.uid === u.uid && styles.searchItemSelected,
                ]}
                onPress={() => setSelectedUser(u)}
              >
                <Ionicons name="person-circle-outline" size={20} color="#666" />
                <Text style={styles.searchItemName}>{u.name}</Text>
              </TouchableOpacity>
            ))}
          {selectedUser && (
            <TouchableOpacity
              style={styles.smallAddButton}
              onPress={addMemberToMinisterio}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.smallAddText}>Adicionar</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Membros */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.cardHeader}
            onPress={() => setMembersExpanded((s) => !s)}
          >
            <Text style={styles.sectionTitle}>Membros do Ministério</Text>
            <Ionicons
              name={membersExpanded ? "chevron-up" : "chevron-down"}
              size={18}
            />
          </TouchableOpacity>
          {membersExpanded &&
            (members.length === 0 ? (
              <Text style={styles.noInfoText}>Nenhum membro.</Text>
            ) : (
              members.map((m) => (
                <Text key={m.uid} style={styles.memberName}>
                  {m.name}
                </Text>
              ))
            ))}
        </View>

        {/* Escalas */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.cardHeader}
            onPress={() => setEscalasExpanded((s) => !s)}
          >
            <Text style={styles.sectionTitle}>Escalas Cadastradas</Text>
            <Ionicons
              name={escalasExpanded ? "chevron-up" : "chevron-down"}
              size={18}
            />
          </TouchableOpacity>
          {escalasExpanded &&
            (escalasCadastradas.length === 0 ? (
              <Text style={styles.noInfoText}>Nenhuma escala.</Text>
            ) : (
              escalasCadastradas.map((e) => (
                <View key={e.id} style={styles.escalaResumo}>
                  <Text style={styles.escalaResumoTitulo}>{e.nome}</Text>
                  <Text style={styles.escalaResumoMeta}>
                    {e.dataStr} • {e.dia} • {e.funcao}
                  </Text>
                  <View style={{ flexDirection: "row", marginTop: 6, gap: 10 }}>
                    <TouchableOpacity
                      onPress={() => openEditModal(e)}
                      style={styles.actionBtn}
                    >
                      <Ionicons name="pencil-outline" size={18} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteEscala(e.id)}
                      style={[styles.actionBtn, { backgroundColor: "#fee" }]}
                    >
                      <Ionicons name="trash-outline" size={18} color="#c00" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ))}
        </View>
      </ScrollView>

      {/* Modal Escala */}
      <Modal visible={showEscalaModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? "Editar Escala" : "Nova Escala"}
              </Text>
              <TouchableOpacity onPress={() => setShowEscalaModal(false)}>
                <Ionicons name="close" size={22} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Nome da Escala"
              value={escalaNome}
              onChangeText={setEscalaNome}
            />
            <TextInput
              style={styles.input}
              placeholder="Data (DD/MM/AAAA)"
              value={escalaDataStr}
              onChangeText={setEscalaDataStr}
            />

            <Text style={styles.label}>Dia</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={escalaDia}
                onValueChange={(v) => setEscalaDia(v)}
              >
                {DIAS_SEMANA.map((d) => (
                  <Picker.Item key={d} label={d} value={d} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Responsável</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={escalaResponsavelUid}
                onValueChange={(v) => setEscalaResponsavelUid(v)}
              >
                {members.length === 0 ? (
                  <Picker.Item label="Nenhum" value="" />
                ) : (
                  members.map((m) => (
                    <Picker.Item key={m.uid} label={m.name} value={m.uid} />
                  ))
                )}
              </Picker>
            </View>

            <Text style={styles.label}>Função</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={escalaFuncao}
                onValueChange={(v) => setEscalaFuncao(v)}
              >
                {funcoes.map((f) => (
                  <Picker.Item key={f} label={f} value={f} />
                ))}
              </Picker>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Nova função"
                value={novaFuncao}
                onChangeText={setNovaFuncao}
              />
              <TouchableOpacity
                style={styles.addFuncBtn}
                onPress={addNovaFuncao}
              >
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.saveButtonSmall}
              onPress={saveEscala}
              disabled={savingEscala}
            >
              {savingEscala ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveSmallText}>Salvar</Text>
              )}
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

  card: {
    backgroundColor: "#E0E0E0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  searchItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  searchItemSelected: { backgroundColor: "#eef" },
  searchItemName: { marginLeft: 8, fontSize: 14 },
  smallAddButton: {
    backgroundColor: "#BE997E",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  smallAddText: { color: "#fff", fontWeight: "600" },
  noInfoText: { fontSize: 13, color: "#777", marginTop: 6 },
  memberName: { fontSize: 14, paddingVertical: 3 },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  escalaResumo: {
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingVertical: 6,
  },
  escalaResumoTitulo: { fontWeight: "700" },
  escalaResumoMeta: { fontSize: 13, color: "#555" },

  actionBtn: {
    padding: 6,
    backgroundColor: "#eee",
    borderRadius: 6,
  },

  escalaBtnTop: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#BE997E",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  escalaBtnTopText: { color: "#fff", fontWeight: "700", marginLeft: 4 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    width: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: "700" },
  label: { marginTop: 6, fontSize: 13, fontWeight: "500" },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 6,
  },

  addFuncBtn: {
    backgroundColor: "#BE997E",
    padding: 10,
    borderRadius: 8,
    marginLeft: 6,
  },
  saveButtonSmall: {
    backgroundColor: "#BE997E",
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 14,
    alignItems: "center",
  },
  saveSmallText: { color: "#fff", fontWeight: "700" },
});
