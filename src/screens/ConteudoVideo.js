import React from "react";
import { View, StyleSheet } from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";

export default function ConteudoVideo({ route }) {
  const { videoId } = route.params;

  return (
    <View style={styles.container}>
      <YoutubePlayer height={250} play={true} videoId={videoId} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e8e8e8",
  },
});
