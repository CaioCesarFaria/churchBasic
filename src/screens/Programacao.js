import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ProgramacaoScreen() {
  return (
    <View style={styles.container}>
      <Text>PROGRAMAÇÃO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
});