// MinisteriosAdm.js
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { db } from "../../Firebase/FirebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export default function MinisteriosAdm() {
  const [ministerios, setMinisterios] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMinisterios = async () => {
    try {
      setLoading(true);
      const lideresRef = collection(db, "churchBasico", "users", "lideres");
      const snapshot = await getDocs(lideresRef);
      const data = snapshot.docs.map(doc => doc.data());
      
      // Agrupar ministérios por nome
      const ministeriosMap = {};
      data.forEach(lider => {
        if (lider.ministerio) {
          if (!ministeriosMap[lider.ministerio]) ministeriosMap[lider.ministerio] = [];
          ministeriosMap[lider.ministerio].push(lider.name);
        }
      });

      const result = Object.keys(ministeriosMap).map(key => ({
        ministerio: key,
        lideres: ministeriosMap[key]
      }));

      setMinisterios(result);
    } catch (error) {
      console.log("Erro ao buscar ministérios:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMinisterios();
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#B8986A" />
      ) : (
        <FlatList
          data={ministerios}
          keyExtractor={item => item.ministerio}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.title}>{item.ministerio}</Text>
              <Text style={styles.subtitle}>Líder(es): {item.lideres.join(", ")}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  item: { padding: 10, borderBottomWidth: 1, borderBottomColor: "#eee" },
  title: { fontWeight: "bold", fontSize: 16 },
  subtitle: { color: "#666" },
});
