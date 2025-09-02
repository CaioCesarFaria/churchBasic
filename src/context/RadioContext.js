// RadioContext.js
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Alert, AppState } from 'react-native';

const RadioContext = createContext();

export const useRadio = () => {
  const context = useContext(RadioContext);
  if (!context) {
    throw new Error('useRadio deve ser usado dentro de um RadioProvider');
  }
  return context;
};

export const RadioProvider = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [error, setError] = useState(null);
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);
  
  const radioInfo = {
    name: "Rádio Abba Church Varginha",
    slug: "radio-abba-church-varginha",
    city: "Varginha",
    state: "MG",
    streamUrl: "https://stream.zeno.fm/kdol61ijgr5uv",
    category: "gospel",
    type: "WebRádio",
  };

  // Criar o player de áudio usando o hook do expo-audio
  const player = useAudioPlayer(radioInfo.streamUrl);
  const appState = useRef(AppState.currentState);

  // Configurar o modo de áudio ao inicializar
  useEffect(() => {
    const setupAudioMode = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          allowsRecording: false,
        });
      } catch (error) {
        console.log('Erro ao configurar modo de áudio:', error);
      }
    };

    setupAudioMode();
  }, []);

  // Monitorar mudanças no estado do app (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App voltou para o foreground
        console.log('App voltou ao foreground');
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => subscription?.remove();
  }, []);

  // Monitorar o estado do player
  useEffect(() => {
    const updatePlayingState = () => {
      setIsPlaying(player.playing);
      setIsLoading(player.isBuffering);
    };

    // Verificar estado inicial
    updatePlayingState();

    // Configurar listener para mudanças de estado
    const interval = setInterval(updatePlayingState, 1000);

    return () => clearInterval(interval);
  }, [player.playing, player.isBuffering]);

  // Função para iniciar a reprodução
  const playRadio = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!player.isLoaded) {
        // Se ainda não carregou, aguardar um pouco
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      await player.play();
      setIsPlaying(true);
      setShowMiniPlayer(true);
      
    } catch (error) {
      console.log('Erro ao reproduzir rádio:', error);
      setError('Não foi possível conectar à rádio. Verifique sua conexão.');
      Alert.alert(
        'Erro de Conexão',
        'Não foi possível conectar à rádio. Verifique sua conexão com a internet.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Função para pausar a reprodução
  const pauseRadio = () => {
    try {
      player.pause();
      setIsPlaying(false);
    } catch (error) {
      console.log('Erro ao pausar rádio:', error);
    }
  };

  // Função para parar completamente
  const stopRadio = () => {
    try {
      player.pause();
      setIsPlaying(false);
      setShowMiniPlayer(false);
    } catch (error) {
      console.log('Erro ao parar rádio:', error);
    }
  };

  // Função para alternar play/pause
  const togglePlayback = async () => {
    if (isPlaying) {
      pauseRadio();
    } else {
      await playRadio();
    }
  };

  // Função para ajustar volume
  const adjustVolume = (newVolume) => {
    try {
      const clampedVolume = Math.max(0, Math.min(1, newVolume));
      player.volume = clampedVolume;
      setVolume(clampedVolume);
    } catch (error) {
      console.log('Erro ao ajustar volume:', error);
    }
  };

  // Função para mostrar/esconder mini player
  const toggleMiniPlayer = () => {
    setShowMiniPlayer(!showMiniPlayer);
  };

  const value = {
    // Estado
    isPlaying,
    isLoading,
    volume,
    error,
    showMiniPlayer,
    radioInfo,
    
    // Funções de controle
    playRadio,
    pauseRadio,
    stopRadio,
    togglePlayback,
    adjustVolume,
    toggleMiniPlayer,
    
    // Player object (caso seja necessário acesso direto)
    player,
  };

  return (
    <RadioContext.Provider value={value}>
      {children}
    </RadioContext.Provider>
  );
};