import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function MaisScreen() {
  return (
    <View style={styles.container}>
      <Text>MAIS SCREEN</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
});