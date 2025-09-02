// MiniPlayer.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import Slider from '@react-native-community/slider'
import { Ionicons } from '@expo/vector-icons';
import { useRadio } from '../context/RadioContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MiniPlayer() {
  const {
    isPlaying,
    isLoading,
    volume,
    radioInfo,
    togglePlayback,
    stopRadio,
    adjustVolume,
    showMiniPlayer,
    toggleMiniPlayer,
  } = useRadio();

  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Animar entrada do mini player
  React.useEffect(() => {
    if (showMiniPlayer) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showMiniPlayer, fadeAnim]);

  if (!showMiniPlayer) {
    return null;
  }

  const handlePlayPause = async () => {
    await togglePlayback();
  };

  const handleStop = () => {
    stopRadio();
  };

  const handleExpand = () => {
    setShowFullPlayer(true);
  };

  const handleCollapse = () => {
    setShowFullPlayer(false);
  };

  const handleVolumeChange = (value) => {
    adjustVolume(value);
  };

  // Mini Player (versão compacta)
  const renderMiniPlayer = () => (
    <Animated.View style={[styles.miniPlayer, { opacity: fadeAnim }]}>
      <TouchableOpacity style={styles.miniPlayerContent} onPress={handleExpand}>
        <View style={styles.radioIcon}>
          <Ionicons name="radio" size={20} color="#B8986A" />
        </View>
        
        <View style={styles.radioInfo}>
          <Text style={styles.radioName} numberOfLines={1}>
            {radioInfo.name}
          </Text>
          <Text style={styles.radioStatus} numberOfLines={1}>
            {isLoading ? 'Conectando...' : isPlaying ? 'Ao vivo' : 'Pausado'}
          </Text>
        </View>
        
        <View style={styles.miniControls}>
          <TouchableOpacity 
            style={styles.miniControlButton} 
            onPress={handlePlayPause}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#B8986A" />
            ) : (
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={20} 
                color="#B8986A" 
              />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.miniControlButton} 
            onPress={handleStop}
          >
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  // Full Player (versão expandida)
  const renderFullPlayer = () => (
    <Modal
      visible={showFullPlayer}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCollapse}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.fullPlayer}>
          {/* Header */}
          <View style={styles.fullPlayerHeader}>
            <TouchableOpacity onPress={handleCollapse}>
              <Ionicons name="chevron-down" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.fullPlayerTitle}>Rádio</Text>
            <TouchableOpacity onPress={handleStop}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Radio Icon */}
          <View style={styles.radioIconLarge}>
            <Ionicons name="radio" size={80} color="#B8986A" />
            {isPlaying && (
              <View style={styles.liveBadge}>
                <View style={styles.liveIndicator} />
                <Text style={styles.liveText}>AO VIVO</Text>
              </View>
            )}
          </View>

          {/* Radio Info */}
          <View style={styles.fullRadioInfo}>
            <Text style={styles.fullRadioName}>{radioInfo.name}</Text>
            <Text style={styles.fullRadioLocation}>
              {radioInfo.city}, {radioInfo.state}
            </Text>
            <Text style={styles.fullRadioCategory}>
              {radioInfo.category} • {radioInfo.type}
            </Text>
            <Text style={styles.fullRadioStatus}>
              {isLoading ? 'Conectando...' : isPlaying ? 'Transmissão ao vivo' : 'Rádio pausada'}
            </Text>
          </View>

          {/* Controls */}
          <View style={styles.fullControls}>
            <TouchableOpacity 
              style={[styles.fullControlButton, isLoading && styles.disabledButton]} 
              onPress={handlePlayPause}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="large" color="#fff" />
              ) : (
                <Ionicons 
                  name={isPlaying ? "pause" : "play"} 
                  size={32} 
                  color="#fff" 
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Volume Control */}
          <View style={styles.volumeContainer}>
            <Ionicons name="volume-low" size={20} color="#666" />
            <Slider
              style={styles.volumeSlider}
              minimumValue={0}
              maximumValue={1}
              value={volume}
              onValueChange={handleVolumeChange}
              minimumTrackTintColor="#B8986A"
              maximumTrackTintColor="#ddd"
              thumbStyle={styles.volumeThumb}
            />
            <Ionicons name="volume-high" size={20} color="#666" />
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      {renderMiniPlayer()}
      {renderFullPlayer()}
    </>
  );
}

const styles = StyleSheet.create({
  // Mini Player Styles
  miniPlayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: -2 },
    zIndex: 1000,
  },
  miniPlayerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  radioIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioInfo: {
    flex: 1,
    marginRight: 12,
  },
  radioName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  radioStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  miniControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniControlButton: {
    padding: 8,
    marginLeft: 8,
  },

  // Full Player Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  fullPlayer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingBottom: 40,
    paddingHorizontal: 20,
    minHeight: '60%',
    maxHeight: '80%',
  },
  fullPlayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  fullPlayerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  radioIconLarge: {
    alignItems: 'center',
    marginVertical: 30,
    position: 'relative',
  },
  liveBadge: {
    position: 'absolute',
    top: -10,
    right: -20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4757',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  fullRadioInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  fullRadioName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  fullRadioLocation: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  fullRadioCategory: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  fullRadioStatus: {
    fontSize: 14,
    color: '#B8986A',
    fontWeight: '600',
  },
  fullControls: {
    alignItems: 'center',
    marginBottom: 30,
  },
  fullControlButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#B8986A',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  disabledButton: {
    opacity: 0.7,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  volumeSlider: {
    flex: 1,
    marginHorizontal: 15,
  },
  volumeThumb: {
    backgroundColor: '#B8986A',
    width: 20,
    height: 20,
  },
});