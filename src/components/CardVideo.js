import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function CardVideo({
  thumbnail,
  title,
  subtitle,
  category,
  videoId,
}) {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate("ConteudoVideo", {
          videoId,
          title,
          subtitle,
          category,
          thumbnail,
        })
      }
    >
        
      <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <Text style={styles.category}>{category}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 10,
    marginTop:10,
    elevation: 2,
    minWidth:'90%',
    alignItems:'baseline',
  },
  thumbnail: {
    width: "100%",
    height: 180,
  },
  textContainer: {
    padding: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#555",
    fontSize: 14,
    marginTop: 2,
  },
  category: {
    fontSize: 14,
    color: "#777",
    marginTop: 2,
  },
});
