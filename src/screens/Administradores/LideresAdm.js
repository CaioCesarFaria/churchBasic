// LideresAdm.js
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { db } from "../../Firebase/FirebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export default function LideresAdm() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaders = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "churchBasico", "users", "lideres"));
      const data = snapshot.docs.map(doc => doc.data());
      setLeaders(data);
    } catch (error) {
      console.log("Erro ao buscar líderes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaders();
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#B8986A" />
      ) : (
        <FlatList
          data={leaders}
          keyExtractor={item => item.uid}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.subtitle}>{item.ministerio || "Sem ministério"}</Text>
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
  name: { fontWeight: "bold", fontSize: 16 },
  subtitle: { color: "#666" },
});
