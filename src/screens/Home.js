// Home.js
import React from "react";
import { StyleSheet, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DisplayUser from "../components/DisplayUser";
import Topo from "../components/Topo";
import CardVideo from "../components/CardVideo";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.containerHome} edges={["bottom", "top"]}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <Topo />
      <DisplayUser />
      {/* Seção 1 */}
      <View style={styles.section}>
        

        <CardVideo
          thumbnail="https://img.youtube.com/vi/mX8A3M7pL3k/maxresdefault.jpg"
          title="Jireh"
          subtitle="Ministério • Elevation"
          category="Louvor"
          videoId="mX8A3M7pL3k"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  containerHome: {
    backgroundColor: "#e0e0e0",
    flex: 1,
    alignItems:'center'
  },
});
