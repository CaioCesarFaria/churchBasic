// MinisterioConexaoRelatorio.js
import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../context/AuthContext";
import { db } from "../../Firebase/FirebaseConfig";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  orderBy,
  query,
} from "firebase/firestore";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function MinisterioConexaoRelatorio({ navigation }) {
  const { user, userData } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [relatorios, setRelatorios] = useState([]);
  const [expanded, setExpanded] = useState(null);

  const userName = userData?.name || user?.displayName || "Admin";

  // Etapas principais (mesmas chaves, ícones e cores usadas no admin)
  const etapasConfig = [
    { key: "primeira_visita", label: "Primeira Visita", icon: "hand-left", color: "#3498db" },
    { key: "pedido_oracao", label: "Pedido de Oração", icon: "heart", color: "#e74c3c" },
    { key: "encaminhamento_celula", label: "Encaminhamento", icon: "people", color: "#f39c12" },
  ];

  const loadRelatorios = async () => {
    setLoading(true);
    try {
      const ref = collection(
        db,
        "churchBasico",
        "ministerios",
        "conteudo",
        "conexao",
        "RelatorioConexao"
      );
      const q = query(ref, orderBy("criadoEm", "desc"));
      const snap = await getDocs(q);
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setRelatorios(arr);
    } catch (error) {
      console.log("Erro ao carregar relatórios:", error);
      Alert.alert("Erro", "Não foi possível carregar os relatórios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRelatorios();
  }, []);

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(expanded === id ? null : id);
  };

  const marcarVerificado = async (relatorio) => {
    try {
      const ref = doc(
        db,
        "churchBasico",
        "ministerios",
        "conteudo",
        "conexao",
        "RelatorioConexao",
        relatorio.id
      );
      await updateDoc(ref, {
        verificado: true,
        verificadoEm: new Date(),
        verificadoPor: userName,
      });
      Alert.alert("Sucesso", "Relatório marcado como verificado.");
      loadRelatorios();
    } catch (err) {
      console.log("Erro verificar:", err);
      Alert.alert("Erro", "Não foi possível marcar como verificado.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#666" />
        </TouchableOpacity>
        <Text style={styles.title}>Relatórios — Conexão</Text>
        <Text style={styles.userName}>{userName}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#B8986A" />
          <Text style={{ marginTop: 8, color: "#666" }}>Carregando relatórios...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.section}>Relatórios Enviados</Text>

          {relatorios.length === 0 && (
            <Text style={styles.empty}>Nenhum relatório enviado.</Text>
          )}

          {relatorios.map((r) => {
            // Data formatada
            const enviadoEm = r.criadoEm?.seconds
              ? new Date(r.criadoEm.seconds * 1000).toLocaleString("pt-BR")
              : r.criadoEm?.toDate
              ? r.criadoEm.toDate().toLocaleString("pt-BR")
              : "—";

            // usar estatisticasConcluidosPorEtapa (salvas durante o envio do relatório)
            const concluidos = r.estatisticasConcluidosPorEtapa || {
              primeira_visita: 0,
              pedido_oracao: 0,
              encaminhamento_celula: 0,
            };

            const totalConcluidos =
              (concluidos.primeira_visita || 0) +
              (concluidos.pedido_oracao || 0) +
              (concluidos.encaminhamento_celula || 0);

            return (
              <View key={r.id} style={styles.card}>
                <TouchableOpacity
                  style={styles.cardHeader}
                  onPress={() => toggleExpand(r.id)}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="document-text" size={20} color="#B8986A" />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.cardTitle}>{r.geradoPor || "Relatório"}</Text>
                      <Text style={styles.cardSub}>{enviadoEm}</Text>
                    </View>
                  </View>

                  <Ionicons
                    name={expanded === r.id ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="#666"
                  />
                </TouchableOpacity>

                {expanded === r.id && (
                  <View style={styles.cardBody}>
                    {r.observacoes ? (
                      <Text style={styles.obs}>📝 {r.observacoes}</Text>
                    ) : null}

                    <View style={styles.summaryRow}>
                      <View style={styles.summaryBox}>
                        <Text style={styles.summaryNumber}>
                          {r.estatisticasGerais?.totalVisitantes ?? "0"}
                        </Text>
                        <Text style={styles.summaryLabel}>Visitantes</Text>
                      </View>
                      <View style={styles.summaryBox}>
                        <Text style={styles.summaryNumber}>
                          {r.estatisticasGerais?.totalConcluidos ?? totalConcluidos ?? "0"}
                        </Text>
                        <Text style={styles.summaryLabel}>Concluídos</Text>
                      </View>
                    </View>

                    <Text style={styles.chartTitle}>Etapas concluídas (distribuição)</Text>

                    {totalConcluidos === 0 ? (
                      <Text style={styles.emptySmall}>Nenhum visitante concluído neste relatório.</Text>
                    ) : (
                      etapasConfig.map((etapa) => {
                        const count = concluidos[etapa.key] || 0;
                        const percent = Math.round((count / totalConcluidos) * 100);
                        return (
                          <View key={etapa.key} style={styles.etapaRow}>
                            <View style={styles.etapaLeft}>
                              <View style={styles.iconWrap}>
                                <Ionicons name={etapa.icon} size={16} color={etapa.color} />
                              </View>
                              <View style={styles.barWrap}>
                                <View style={styles.barBg}>
                                  <View style={[styles.barFill, { width: `${percent}%`, backgroundColor: etapa.color }]} />
                                </View>
                                <Text style={styles.etapaLabelBelow}>{etapa.label}</Text>
                              </View>
                            </View>

                            <View style={styles.percentBox}>
                              <Text style={[styles.percentText, { color: etapa.color }]}>{percent}%</Text>
                              <Text style={styles.countText}>{count}</Text>
                            </View>
                          </View>
                        );
                      })
                    )}

                    {/* Verificado */}
                    <View style={{ marginTop: 12 }}>
                      {r.verificado ? (
                        <View style={styles.verified}>
                          <Ionicons name="checkmark-circle" size={16} color="#50C878" />
                          <Text style={styles.verifiedText}>Verificado por {r.verificadoPor}</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.verifyBtn}
                          onPress={() => marcarVerificado(r)}
                        >
                          <Ionicons name="checkmark" size={16} color="#fff" />
                          <Text style={styles.verifyText}>Relatório Verificado</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: { fontSize: 16, fontWeight: "600", color: "#333" },
  userName: { color: "#B8986A", fontWeight: "600" },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 16, paddingBottom: 40 },
  section: { fontSize: 18, fontWeight: "700", marginBottom: 12, color: "#333" },
  empty: { textAlign: "center", color: "#666", marginTop: 30 },
  card: { backgroundColor: "#fff", borderRadius: 12, marginBottom: 14, overflow: "hidden", elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#333" },
  cardSub: { fontSize: 12, color: "#777" },
  cardBody: { padding: 14, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  obs: { fontSize: 13, color: "#444", marginBottom: 8 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  summaryBox: { flex: 1, backgroundColor: "#fafafa", borderRadius: 10, padding: 12, alignItems: "center" },
  summaryNumber: { fontSize: 20, fontWeight: "800", color: "#333" },
  summaryLabel: { fontSize: 12, color: "#666", marginTop: 4 },
  chartTitle: { fontSize: 14, fontWeight: "700", marginTop: 14, marginBottom: 8, color: "#333" },
  emptySmall: { color: "#666", fontStyle: "italic" },

  etapaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  etapaLeft: { flex: 1, flexDirection: "row", alignItems: "center" },
  iconWrap: { width: 36, alignItems: "center", justifyContent: "center" },
  barWrap: { flex: 1, marginLeft: 6 },
  barBg: { height: 18, backgroundColor: "#eee", borderRadius: 9, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 9 },
  etapaLabelBelow: { fontSize: 12, color: "#555", marginTop: 6 },

  percentBox: { width: 64, alignItems: "flex-end" },
  percentText: { fontSize: 14, fontWeight: "700" },
  countText: { fontSize: 12, color: "#666" },

  verifyBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#50C878", padding: 10, borderRadius: 8 },
  verifyText: { color: "#fff", fontWeight: "700", marginLeft: 8 },
  verified: { flexDirection: "row", alignItems: "center" },
  verifiedText: { color: "#50C878", marginLeft: 6, fontWeight: "700" },
});


