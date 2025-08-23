import React from "react";
import { Image, View, StyleSheet } from "react-native";

export default function Topo() {
  return (
    <View style={styles.containerTopo}>
      <Image
        style={styles.logoTopo}
        source={require("../../assets/logo.png")}
        resizeMode="contain"
      />
    </View>
  );
}
const styles = StyleSheet.create({
  containerTopo: {
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:"#fff",
    width:'100%',
  },
  logoTopo: {
    width: 100,
  },
});
