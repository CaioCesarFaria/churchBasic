// MiniPlayer.js - FIXO NA ÁREA DE TRABALHO COM CONTROLES COMPLETOS
import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Slider,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRadio } from "../context/RadioContext";

const { width } = Dimensions.get("window");

export default function MiniPlayer() {
  const {
    radioInfo,
    isPlaying,
    isLoading,
    togglePlayback,
    volume,
    adjustVolume,
    stopRadio,
    showMiniPlayer,
  } = useRadio();

  const [muted, setMuted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;

  // Animação do letreiro
  useEffect(() => {
    if (showMiniPlayer && radioInfo) {
      scrollAnim.setValue(width);
      const animation = Animated.loop(
        Animated.timing(scrollAnim, {
          toValue: -width * 2,
          duration: 25000,
          useNativeDriver: true,
        })
      );
      animation.start();
      
      return () => animation.stop();
    }
  }, [showMiniPlayer, radioInfo, scrollAnim]);

  // Animação de expansão
  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: expanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [expanded]);

  const toggleMute = () => {
    const newVolume = muted ? 1 : 0;
    adjustVolume(newVolume);
    setMuted(!muted);
  };

  const handleVolumeChange = (value) => {
    adjustVolume(value);
    setMuted(value === 0);
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  // Se não deve mostrar, não exibe
  if (!showMiniPlayer || !radioInfo) {
    return null;
  }

  // Status text baseado no estado
  const getStatusText = () => {
    if (isLoading) return "Conectando...";
    if (isPlaying) return "♪ Ao vivo";
    return "Pausado";
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height: expandAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [60, 120],
          }),
        },
      ]}
    >
      {/* Linha principal - sempre visível */}
      <View style={styles.mainRow}>
        {/* Info da rádio */}
        <TouchableOpacity 
          style={styles.radioInfoContainer}
          onPress={toggleExpand}
        >
          <View style={styles.radioIcon}>
            <Ionicons 
              name="radio" 
              size={20} 
              color="#B8986A" 
            />
            {isPlaying && (
              <View style={styles.liveIndicator} />
            )}
          </View>
          
          <View style={styles.textContainer}>
            <View style={styles.letreiroContainer}>
              <Animated.Text
                style={[
                  styles.letreiroText,
                  { transform: [{ translateX: scrollAnim }] },
                ]}
                numberOfLines={1}
              >
                {radioInfo.name}
              </Animated.Text>
            </View>
            <Text style={styles.statusText}>
              {getStatusText()}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Controles principais */}
        <View style={styles.controlsContainer}>
          {/* Botão Play/Pause */}
          <TouchableOpacity 
            onPress={togglePlayback} 
            style={[styles.playButton, isLoading && styles.playButtonLoading]}
            disabled={isLoading}
          >
            {isLoading ? (
              <Animated.View
                style={{
                  transform: [{
                    rotate: scrollAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    })
                  }]
                }}
              >
                <Ionicons name="refresh" size={20} color="#fff" />
              </Animated.View>
            ) : (
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={20}
                color="#fff"
              />
            )}
          </TouchableOpacity>

          {/* Botão Expandir/Recolher */}
          <TouchableOpacity 
            onPress={toggleExpand}
            style={styles.expandButton}
          >
            <Ionicons
              name={expanded ? "chevron-down" : "chevron-up"}
              size={16}
              color="#666"
            />
          </TouchableOpacity>

          {/* Botão Fechar */}
          <TouchableOpacity 
            onPress={stopRadio}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Linha expandida - controles avançados */}
      {expanded && (
        <Animated.View
          style={[
            styles.expandedRow,
            {
              opacity: expandAnim,
              transform: [{
                translateY: expandAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                })
              }]
            }
          ]}
        >
          {/* Controle de Volume */}
          <View style={styles.volumeContainer}>
            <TouchableOpacity onPress={toggleMute} style={styles.volumeButton}>
              <Ionicons
                name={muted || volume === 0 ? "volume-mute" : volume < 0.5 ? "volume-low" : "volume-high"}
                size={18}
                color="#666"
              />
            </TouchableOpacity>
            
            <Slider
              style={styles.volumeSlider}
              minimumValue={0}
              maximumValue={1}
              value={volume}
              onValueChange={handleVolumeChange}
              minimumTrackTintColor="#B8986A"
              maximumTrackTintColor="#ddd"
              thumbStyle={styles.sliderThumb}
            />
            
            <Text style={styles.volumeText}>
              {Math.round(volume * 100)}%
            </Text>
          </View>

          {/* Info adicional */}
          <View style={styles.additionalInfo}>
            <Text style={styles.radioLocation}>
              {radioInfo.city}, {radioInfo.state}
            </Text>
            <Text style={styles.radioCategory}>
              {radioInfo.category}
            </Text>
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 65,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingHorizontal: 15,
    paddingVertical: 8,
    zIndex: 999,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: -3 },
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
  },
  radioInfoContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  radioIcon: {
    position: "relative",
    marginRight: 12,
    padding: 2,
  },
  liveIndicator: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ff4757",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  letreiroContainer: {
    overflow: "hidden",
    height: 18,
    justifyContent: "center",
  },
  letreiroText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    width: width * 2,
  },
  statusText: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  playButton: {
    backgroundColor: "#B8986A",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  playButtonLoading: {
    opacity: 0.7,
  },
  expandButton: {
    padding: 8,
    borderRadius: 15,
    backgroundColor: "#f5f5f5",
  },
  closeButton: {
    padding: 8,
    borderRadius: 15,
    backgroundColor: "#f5f5f5",
  },
  expandedRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    marginTop: 8,
  },
  volumeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  volumeButton: {
    marginRight: 12,
    padding: 4,
  },
  volumeSlider: {
    flex: 1,
    height: 30,
  },
  sliderThumb: {
    backgroundColor: "#B8986A",
    width: 16,
    height: 16,
  },
  volumeText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 12,
    minWidth: 35,
    textAlign: "center",
  },
  additionalInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  radioLocation: {
    fontSize: 12,
    color: "#999",
  },
  radioCategory: {
    fontSize: 12,
    color: "#B8986A",
    fontWeight: "500",
    textTransform: "capitalize",
  },
});