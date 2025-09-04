// AbbaTvMain.js
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  SafeAreaView
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Ionicons } from '@expo/vector-icons';
import Topo from '../components/Topo'; // Importe o componente Topo

const { width: screenWidth } = Dimensions.get('window');

// Função para extrair o ID do vídeo do YouTube da URL
const extractYouTubeId = (url) => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Dados dos vídeos do YouTube
const videosData = [
  {
    id: '1',
    title: 'Culto de Domingo - Palavra que Transforma',
    youtubeUrl: 'https://www.youtube.com/watch?v=GouNZ7AEtiQ&ab_channel=ABBACHURCHVARGINHA',
    videoId: extractYouTubeId('https://www.youtube.com/watch?v=GouNZ7AEtiQ&ab_channel=ABBACHURCHVARGINHA'),
    thumbnail: 'https://img.youtube.com/vi/GouNZ7AEtiQ/maxresdefault.jpg',
    description: 'Uma palavra poderosa que transforma vidas e traz esperança para todos os corações',
    pastor: 'Pastor João',
    date: '15 de Dezembro, 2024',
  },
  {
    id: '2',
    title: 'Louvor e Adoração - Noite de Milagres',
    youtubeUrl: 'https://www.youtube.com/watch?v=Z1Ns7WL-dDw&ab_channel=ABBACHURCHVARGINHA',
    videoId: extractYouTubeId('https://www.youtube.com/watch?v=Z1Ns7WL-dDw&ab_channel=ABBACHURCHVARGINHA'),
    thumbnail: 'https://img.youtube.com/vi/Z1Ns7WL-dDw/maxresdefault.jpg',
    description: 'Uma noite especial de louvor e adoração onde Deus se manifestou poderosamente',
    pastor: 'Ministério de Louvor',
    date: '10 de Dezembro, 2024',
  },
  {
    id: '3',
    title: 'Conferência de Avivamento 2024',
    youtubeUrl: 'https://www.youtube.com/watch?v=pyV8BCTtYgA&ab_channel=ABBACHURCHVARGINHA',
    videoId: extractYouTubeId('https://www.youtube.com/watch?v=pyV8BCTtYgA&ab_channel=ABBACHURCHVARGINHA'),
    thumbnail: 'https://img.youtube.com/vi/pyV8BCTtYgA/maxresdefault.jpg',
    description: 'Conferência que marcou nossa igreja com mensagens poderosas de avivamento',
    pastor: 'Pr. Carlos Silva',
    date: '5 de Dezembro, 2024',
  },
];

const AbbaTvMain = ({ navigation }) => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [displayUser] = useState('João Silva');
  const playerRef = useRef(null);

  const handleGoBack = () => {
    if (navigation) {
      navigation.goBack();
    } else {
      Alert.alert('Voltar', 'Função de voltar não disponível');
    }
  };

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    setIsPlaying(true);
  };

  const onStateChange = useCallback((state) => {
    if (state === 'ended') {
      setIsPlaying(false);
      Alert.alert('Vídeo finalizado', 'O vídeo chegou ao fim!');
    }
  }, []);

  const togglePlaying = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const onReady = useCallback(() => {
    console.log('Player está pronto!');
  }, []);

  const onError = useCallback((error) => {
    console.log('Erro no player:', error);
    Alert.alert('Erro', 'Não foi possível carregar o vídeo. Verifique sua conexão.');
  }, []);

  const VideoCard = ({ video, onPress }) => (
    <TouchableOpacity
      style={[
        styles.videoCard,
        selectedVideo?.id === video.id && styles.selectedVideoCard
      ]}
      onPress={() => onPress(video)}
      activeOpacity={0.8}
    >
      <View style={styles.thumbnailContainer}>
        <Image 
          source={{ uri: video.thumbnail }} 
          style={styles.thumbnail}
          resizeMode="cover"
        />
        <View style={styles.playOverlay}>
          <View style={styles.playButton}>
            <Ionicons name="play" size={20} color="#fff" />
          </View>
        </View>
        {selectedVideo?.id === video.id && (
          <View style={styles.playingIndicator}>
            <Ionicons name="musical-notes" size={16} color="#333" />
            <Text style={styles.playingText}>Reproduzindo</Text>
          </View>
        )}
      </View>
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {video.title}
        </Text>
        <Text style={styles.videoMeta}>
          {video.pastor} • {video.date}
        </Text>
        <Text style={styles.videoDescription} numberOfLines={2}>
          {video.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Usando o componente Topo */}
      <Topo 
        title="ABBA TV"
        onBack={handleGoBack}
        displayUser={displayUser}
        showBackButton={true}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Player de vídeo do YouTube */}
        {selectedVideo && (
          <View style={styles.playerContainer}>
            <View style={styles.playerWrapper}>
              <YoutubePlayer
                ref={playerRef}
                height={220}
                play={isPlaying}
                videoId={selectedVideo.videoId}
                onChangeState={onStateChange}
                onReady={onReady}
                onError={onError}
                webViewStyle={styles.webView}
                webViewProps={{
                  androidLayerType: 'hardware',
                }}
              />
            </View>
            
            {/* Controles customizados */}
            <View style={styles.playerControls}>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={togglePlaying}
              >
                <Ionicons 
                  name={isPlaying ? "pause" : "play"} 
                  size={24} 
                  color="#333" 
                />
                <Text style={styles.controlText}>
                  {isPlaying ? 'Pausar' : 'Reproduzir'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => {
                  setSelectedVideo(null);
                  setIsPlaying(false);
                }}
              >
                <Ionicons name="close" size={24} color="#666" />
                <Text style={styles.controlText}>Fechar</Text>
              </TouchableOpacity>
            </View>

            {/* Informações do vídeo atual */}
            <View style={styles.videoDetails}>
              <Text style={styles.currentVideoTitle}>{selectedVideo.title}</Text>
              <Text style={styles.currentVideoMeta}>
                {selectedVideo.pastor} • {selectedVideo.date}
              </Text>
              <Text style={styles.currentVideoDescription}>
                {selectedVideo.description}
              </Text>
            </View>
          </View>
        )}

        {/* Título da seção */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Vídeos em Destaque</Text>
          <Text style={styles.sectionSubtitle}>
            Assista aos melhores momentos da ABBA Church Varginha
          </Text>
        </View>

        {/* Lista de vídeos */}
        <View style={styles.videosContainer}>
          {videosData.map((video) => (
            <VideoCard 
              key={video.id} 
              video={video} 
              onPress={handleVideoSelect}
            />
          ))}
        </View>

        {/* Informações sobre o canal */}
        <View style={styles.channelInfo}>
          <View style={styles.channelHeader}>
            <Ionicons name="tv" size={24} color="#333" />
            <Text style={styles.channelTitle}>ABBA Church Varginha</Text>
          </View>
          <Text style={styles.channelDescription}>
            Acompanhe todos os cultos, conferências e eventos especiais da nossa igreja. 
            Seja edificado através da Palavra de Deus e testemunhe os milagres que Ele faz.
          </Text>
        </View>

        {/* Rodapé */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Feito com ❤️ para a família ABBA Church
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  playerContainer: {
    backgroundColor: '#000',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  playerWrapper: {
    backgroundColor: '#000',
  },
  webView: {
    backgroundColor: '#000',
  },
  playerControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  controlText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  videoDetails: {
    padding: 20,
    backgroundColor: '#fff',
  },
  currentVideoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    lineHeight: 26,
  },
  currentVideoMeta: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontWeight: '500',
  },
  currentVideoDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  videosContainer: {
    paddingHorizontal: 15,
  },
  videoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  selectedVideoCard: {
    borderWidth: 2,
    borderColor: '#333',
    elevation: 6,
  },
  thumbnailContainer: {
    position: 'relative',
    height: 200,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playButton: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playingIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
  },
  playingText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  videoInfo: {
    padding: 16,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    lineHeight: 24,
  },
  videoMeta: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  videoDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  channelInfo: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  channelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  channelDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

// Exportação padrão do componente
export default AbbaTvMain;