// RadioMain.js
import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useRadio } from '../context/RadioContext';
import DisplayUser from '../components/DisplayUser';
import MiniPlayer from '../components/MiniPlayer';

export default function RadioMain({ navigation }) {
  const { user, userData } = useContext(AuthContext);
  const {
    isPlaying,
    isLoading,
    radioInfo,
    playRadio,
    pauseRadio,
    togglePlayback,
    error,
  } = useRadio();

  const userName = userData?.name || user?.displayName || user?.email || "Visitante";

  const handlePlayRadio = async () => {
    try {
      if (isPlaying) {
        pauseRadio();
      } else {
        await playRadio();
      }
    } catch (error) {
      console.log('Erro ao controlar rádio:', error);
      Alert.alert(
        'Erro',
        'Não foi possível conectar à rádio. Verifique sua conexão com a internet.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleInfoRadio = () => {
    Alert.alert(
      radioInfo.name,
      `Local: ${radioInfo.city}, ${radioInfo.state}\nCategoria: ${radioInfo.category}\nTipo: ${radioInfo.type}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header com DisplayUser */}
      <DisplayUser userName={userName} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Título da página */}
        <View style={styles.header}>
          <Ionicons name="radio" size={32} color="#B8986A" />
          <Text style={styles.title}>RÁDIO</Text>
        </View>

        {/* Card Principal da Rádio */}
        <View style={styles.radioCard}>
          <View style={styles.radioIconContainer}>
            <Ionicons name="radio" size={60} color="#B8986A" />
            {isPlaying && (
              <View style={styles.liveBadge}>
                <View style={styles.liveIndicator} />
                <Text style={styles.liveText}>AO VIVO</Text>
              </View>
            )}
          </View>

          <View style={styles.radioInfo}>
            <Text style={styles.radioName}>{radioInfo.name}</Text>
            <Text style={styles.radioLocation}>
              {radioInfo.city}, {radioInfo.state}
            </Text>
            <Text style={styles.radioCategory}>
              {radioInfo.category} • {radioInfo.type}
            </Text>
          </View>

          <View style={styles.radioStatus}>
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <Text style={[
                styles.statusText,
                isPlaying && styles.statusTextPlaying
              ]}>
                {isLoading ? 'Conectando...' : isPlaying ? 'Transmitindo ao vivo' : 'Rádio offline'}
              </Text>
            )}
          </View>

          {/* Botão Principal */}
          <TouchableOpacity
            style={[styles.playButton, isLoading && styles.playButtonDisabled]}
            onPress={handlePlayRadio}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <>
                <Ionicons 
                  name={isPlaying ? "pause" : "play"} 
                  size={32} 
                  color="#fff" 
                />
                <Text style={styles.playButtonText}>
                  {isPlaying ? 'PAUSAR' : 'OUVIR'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Botões secundários */}
          <View style={styles.secondaryButtons}>
            <TouchableOpacity 
              style={styles.infoButton}
              onPress={handleInfoRadio}
            >
              <Ionicons name="information-circle-outline" size={20} color="#B8986A" />
              <Text style={styles.infoButtonText}>Info</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card de Informações */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <Ionicons name="musical-notes" size={24} color="#B8986A" />
            <Text style={styles.infoCardTitle}>Sobre a Rádio</Text>
          </View>
          
          <View style={styles.infoCardContent}>
            <Text style={styles.infoText}>
              Ouça a {radioInfo.name}, transmitindo música gospel e conteúdo cristão 
              diretamente de {radioInfo.city}, {radioInfo.state}.
            </Text>
            <Text style={styles.infoText}>
              Nossa programação inclui:
            </Text>
            <View style={styles.programList}>
              <Text style={styles.programItem}>🎵 Música Gospel</Text>
              <Text style={styles.programItem}>🙏 Momentos de Oração</Text>
              <Text style={styles.programItem}>📖 Estudos Bíblicos</Text>
              <Text style={styles.programItem}>💬 Mensagens Inspiradoras</Text>
            </View>
            <Text style={styles.infoFooter}>
              Mantenha-se conectado com Deus através da nossa programação 24 horas.
            </Text>
          </View>
        </View>

        {/* Card de Recursos */}
        <View style={styles.featuresCard}>
          <View style={styles.featuresHeader}>
            <Ionicons name="star" size={24} color="#B8986A" />
            <Text style={styles.featuresTitle}>Recursos</Text>
          </View>
          
          <View style={styles.featuresGrid}>
            <View style={styles.featureItem}>
              <Ionicons name="headset" size={24} color="#B8986A" />
              <Text style={styles.featureText}>Alta Qualidade</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="wifi" size={24} color="#B8986A" />
              <Text style={styles.featureText}>Stream Online</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="phone-portrait" size={24} color="#B8986A" />
              <Text style={styles.featureText}>Multitarefa</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="heart" size={24} color="#B8986A" />
              <Text style={styles.featureText}>Gospel</Text>
            </View>
          </View>
        </View>

        {/* Espaço extra para o mini player */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Mini Player */}
      <MiniPlayer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 15,
  },
  radioCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 25,
    marginBottom: 20,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  radioIconContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  liveBadge: {
    position: 'absolute',
    top: -5,
    right: -10,
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
  radioInfo: {
    alignItems: "center",
    marginBottom: 15,
  },
  radioName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 5,
  },
  radioLocation: {
    fontSize: 16,
    color: "#666",
    marginBottom: 3,
  },
  radioCategory: {
    fontSize: 14,
    color: "#999",
    textTransform: "capitalize",
  },
  radioStatus: {
    marginBottom: 25,
  },
  statusText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  statusTextPlaying: {
    color: "#B8986A",
    fontWeight: "600",
  },
  errorText: {
    fontSize: 14,
    color: "#ff4444",
    textAlign: "center",
  },
  playButton: {
    backgroundColor: "#B8986A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 20,
  },
  playButtonDisabled: {
    opacity: 0.7,
  },
  playButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  secondaryButtons: {
    flexDirection: "row",
  },
  infoButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: "#f8f8f8",
  },
  infoButtonText: {
    color: "#B8986A",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 5,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  infoCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginLeft: 10,
  },
  infoCardContent: {
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  programList: {
    marginLeft: 10,
    gap: 5,
  },
  programItem: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  infoFooter: {
    fontSize: 14,
    color: "#B8986A",
    fontWeight: "600",
    textAlign: "center",
    marginTop: 10,
  },
  featuresCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  featuresHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginLeft: 10,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  featureItem: {
    width: "45%",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    marginBottom: 10,
  },
  featureText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },
  bottomSpacer: {
    height: 100, // Espaço para o mini player
  }
});