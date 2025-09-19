// RadioContext.js - VERSÃO SIMPLIFICADA SEM NOTIFICAÇÕES
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Alert, AppState, Platform } from 'react-native';

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
  const [playerReady, setPlayerReady] = useState(false);
  
  const radioInfo = {
    name: "Rádio Abba Church Varginha",
    slug: "radio-abba-church-varginha",
    city: "Varginha",
    state: "MG",
    streamUrl: "https://stream.zeno.fm/kdol61ijgr5uv",
    category: "gospel",
    type: "WebRádio",
  };

  const player = useAudioPlayer();
  const appStateRef = useRef(AppState.currentState);
  const streamUrlRef = useRef(null);

  // Configuração inicial do sistema
  useEffect(() => {
    const configurarSistema = async () => {
      try {
        if (Platform.OS === 'ios') {
          await setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: true,
            allowsRecording: false,
            interruptionMode: 'duckOthers',
            shouldRouteThroughEarpiece: false,
            category: 'playback',
            mode: 'default',
            categoryOptions: ['mixWithOthers', 'duckOthers'],
            iosCategory: 'AVAudioSessionCategoryPlayback',
            iosMode: 'AVAudioSessionModeDefault',
            iosCategoryOptions: [
              'AVAudioSessionCategoryOptionMixWithOthers',
              'AVAudioSessionCategoryOptionDuckOthers'
            ]
          });
          console.log("✅ iOS: Configuração de áudio background aplicada");
        } else {
          await setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: true,
            allowsRecording: false,
            interruptionMode: 'duckOthers',
            shouldRouteThroughEarpiece: false,
          });
          console.log("✅ Android: Configuração de áudio background aplicada");
        }
        
        setPlayerReady(true);
      } catch (err) {
        console.error("❌ Erro na configuração inicial:", err);
        setPlayerReady(true); // Mesmo com erro, permitir uso
      }
    };

    configurarSistema();
  }, []);

  // Monitor de estado do app
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      const prevAppState = appStateRef.current;
      appStateRef.current = nextAppState;

      console.log(`📱 App state: ${prevAppState} → ${nextAppState}`);

      if (Platform.OS === 'ios') {
        if (nextAppState === 'background' && isPlaying) {
          console.log("🎵 iOS: Áudio continua em background");
          // Verificar se o player ainda está tocando
          setTimeout(() => {
            if (streamUrlRef.current && player && !player.playing) {
              console.log("🔄 iOS: Tentando reativar player");
              player.play().catch(console.error);
            }
          }, 1000);
        } else if (nextAppState === 'active') {
          console.log("📱 iOS: App voltou para foreground");
          // Sincronizar estado
          if (player && player.playing && !player.paused) {
            setIsPlaying(true);
            setShowMiniPlayer(true);
          }
        }
      } else {
        if (nextAppState === 'background' && isPlaying) {
          console.log("🤖 Android: App em background - áudio deve continuar");
        } else if (nextAppState === 'active') {
          console.log("🤖 Android: App voltou para foreground");
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isPlaying, player]);

  // Configuração do player
  const setupPlayer = async () => {
    if (!radioInfo.streamUrl || !playerReady) return;

    try {
      console.log(`🎵 Configurando stream: ${radioInfo.name}`);
      
      // Re-configurar áudio antes de cada stream (especialmente importante no iOS)
      if (Platform.OS === 'ios') {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          allowsRecording: false,
          interruptionMode: 'duckOthers',
          shouldRouteThroughEarpiece: false,
          category: 'playback',
          mode: 'default',
          categoryOptions: ['mixWithOthers', 'duckOthers'],
          iosCategory: 'AVAudioSessionCategoryPlayback',
          iosMode: 'AVAudioSessionModeDefault',
          iosCategoryOptions: [
            'AVAudioSessionCategoryOptionMixWithOthers',
            'AVAudioSessionCategoryOptionDuckOthers'
          ]
        });
      }
      
      // Configurar stream com metadados para Control Center (iOS)
      const streamConfig = { 
        uri: radioInfo.streamUrl,
        metadata: {
          title: radioInfo.name || "Rádio Abba Church",
          artist: `${radioInfo.city || ''}-${radioInfo.state || ''}`.replace(/^-|-$/g, '') || "Varginha-MG",
          albumArtist: "Abba Church",
          album: "Rádio Cristã",
          genre: radioInfo.category || "gospel",
        }
      };
      
      // Parar stream anterior se necessário
      if (player.playing) {
        player.pause();
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Configurar novo stream
      player.replace(streamConfig);
      streamUrlRef.current = radioInfo.streamUrl;
      player.volume = volume;
      
      console.log(`✅ Stream configurado: ${radioInfo.name}`);
      
    } catch (err) {
      console.error("❌ Erro ao configurar player:", err);
      setError('Erro ao configurar stream de áudio');
    }
  };

  // Monitor do player
  useEffect(() => {
    if (!player || !playerReady) return;
    
    const checkPlayerState = () => {
      const playerIsPlaying = player.playing && !player.paused;
      
      if (playerIsPlaying !== isPlaying) {
        setIsPlaying(playerIsPlaying);
        console.log(`🎵 Estado do player: ${playerIsPlaying ? 'TOCANDO' : 'PARADO'}`);
      }

      setIsLoading(player.isBuffering || false);
    };
    
    checkPlayerState();
    const interval = setInterval(checkPlayerState, 2000);
    return () => clearInterval(interval);
  }, [player.playing, player.paused, player.isBuffering, isPlaying, playerReady]);

  // Funções de controle
  const playRadio = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!playerReady) {
        console.log("⏳ Aguardando player ficar pronto...");
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      await setupPlayer();

      if (player && playerReady) {
        // iOS: Garantir configuração antes de tocar
        if (Platform.OS === 'ios') {
          await setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: true,
            category: 'playback',
            categoryOptions: ['mixWithOthers', 'duckOthers'],
            iosCategory: 'AVAudioSessionCategoryPlayback',
            iosCategoryOptions: [
              'AVAudioSessionCategoryOptionMixWithOthers',
              'AVAudioSessionCategoryOptionDuckOthers'
            ]
          });
        }
        
        await player.play();
        setIsPlaying(true);
        setShowMiniPlayer(true);
        
        console.log("▶️ PLAY executado - Background ativo");
      }
    } catch (error) {
      console.error("❌ Erro ao reproduzir rádio:", error);
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

  const pauseRadio = async () => {
    try {
      if (player && playerReady) {
        player.pause();
        setIsPlaying(false);
        console.log("⏸️ PAUSE executado");
      }
    } catch (err) {
      console.error("❌ Erro ao pausar rádio:", err);
    }
  };

  const stopRadio = async () => {
    try {
      if (player) {
        player.pause();
      }
      
      setIsPlaying(false);
      setShowMiniPlayer(false);
      streamUrlRef.current = null;
      
      console.log("⏹️ Player parado completamente");
    } catch (err) {
      console.error("❌ Erro ao parar:", err);
    }
  };

  const togglePlayback = async () => {
    console.log(`🔄 Toggle play - Estado atual: ${isPlaying}`);
    
    if (isPlaying) {
      await pauseRadio();
    } else {
      await playRadio();
    }
  };

  const adjustVolume = (newVolume) => {
    try {
      const clampedVolume = Math.max(0, Math.min(1, newVolume));
      if (player && playerReady) {
        player.volume = clampedVolume;
      }
      setVolume(clampedVolume);
    } catch (error) {
      console.log('Erro ao ajustar volume:', error);
    }
  };

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
    playerReady,
    
    // Funções de controle
    playRadio,
    pauseRadio,
    stopRadio,
    togglePlayback,
    adjustVolume,
    toggleMiniPlayer,
    
    // Aliases para compatibilidade
    setVolume: adjustVolume,
    
    // Player object
    player,
  };

  return (
    <RadioContext.Provider value={value}>
      {children}
    </RadioContext.Provider>
  );
};