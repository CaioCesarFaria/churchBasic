import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Topo from '../components/Topo';
import DisplayUser from '../components/DisplayUser';
import { AuthContext } from '../context/AuthContext';
import { db } from '../Firebase/FirebaseConfig';

// Importar os dados JSON das versões
import NVI_DATA from '../data/ACF.json';
import ACF_DATA from '../data/ACF.json';

const { width, height } = Dimensions.get('window');

const BibliaMain = ({ navigation }) => {
    const { user, userData } = useContext(AuthContext);
    const userName = userData?.name || user?.displayName || user?.email || "Visitante";
  const [selectedVersion, setSelectedVersion] = useState('NVI');
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedVerse, setSelectedVerse] = useState(null);
  
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [showVerseModal, setShowVerseModal] = useState(false);
  
  const [bibliaData, setBibliaData] = useState(NVI_DATA);
  const [currentText, setCurrentText] = useState('');

  const versions = [
    { key: 'NVI', name: 'Nova Versão Internacional', data: NVI_DATA },
    { key: 'ACF', name: 'Nova Corrigida e Fiel', data: ACF_DATA },
  ];

  useEffect(() => {
    const versionData = versions.find(v => v.key === selectedVersion);
    if (versionData) {
      setBibliaData(versionData.data);
      // Reset selections when version changes
      setSelectedBook(null);
      setSelectedChapter(null);
      setSelectedVerse(null);
      setCurrentText('');
    }
  }, [selectedVersion]);

  useEffect(() => {
    if (selectedBook && selectedChapter !== null && selectedVerse !== null) {
      const book = bibliaData.find(b => b.abbrev === selectedBook.abbrev);
      if (book && book.chapters[selectedChapter] && book.chapters[selectedChapter][selectedVerse]) {
        setCurrentText(book.chapters[selectedChapter][selectedVerse]);
      }
    }
  }, [selectedBook, selectedChapter, selectedVerse, bibliaData]);

  const handleVersionSelect = (version) => {
    setSelectedVersion(version.key);
    setShowVersionModal(false);
  };

  const handleBookSelect = (book) => {
    setSelectedBook(book);
    setSelectedChapter(null);
    setSelectedVerse(null);
    setShowBookModal(false);
  };

  const handleChapterSelect = (chapterIndex) => {
    setSelectedChapter(chapterIndex);
    setSelectedVerse(null);
    setShowChapterModal(false);
  };

  const handleVerseSelect = (verseIndex) => {
    setSelectedVerse(verseIndex);
    setShowVerseModal(false);
  };

  const renderModal = (visible, onClose, title, items, onSelect, keyExtractor) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {items.map((item, index) => (
              <TouchableOpacity
                key={keyExtractor ? keyExtractor(item, index) : index}
                style={styles.modalItem}
                onPress={() => onSelect(item, index)}
              >
                <Text style={styles.modalItemText}>
                  {typeof item === 'string' ? item : 
                   item.name || item.book || `${item.abbrev ? `${item.abbrev} - ` : ''}${item.book || item}`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const getChapterNumbers = () => {
    if (!selectedBook) return [];
    const book = bibliaData.find(b => b.abbrev === selectedBook.abbrev);
    return book ? book.chapters.map((_, index) => `Capítulo ${index + 1}`) : [];
  };

  const getVerseNumbers = () => {
    if (!selectedBook || selectedChapter === null) return [];
    const book = bibliaData.find(b => b.abbrev === selectedBook.abbrev);
    if (book && book.chapters[selectedChapter]) {
      return book.chapters[selectedChapter].map((_, index) => `Versículo ${index + 1}`);
    }
    return [];
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Topo */}
      <Topo />
      
      {/* Display User */}
      <DisplayUser userName={userName}/>

      {/* Conteúdo Principal */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>📖 Bíblia Sagrada</Text>
          
          {/* Seletores */}
          <View style={styles.selectorsContainer}>
            {/* Seletor de Versão */}
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowVersionModal(true)}
            >
              <View style={styles.selectorContent}>
                <Ionicons name="book" size={20} color="#4A90E2" />
                <Text style={styles.selectorLabel}>Versão</Text>
              </View>
              <Text style={styles.selectorValue}>
                {versions.find(v => v.key === selectedVersion)?.key || 'Selecionar'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>

            {/* Seletor de Livro */}
            <TouchableOpacity
              style={[styles.selector, !bibliaData.length && styles.disabledSelector]}
              onPress={() => bibliaData.length && setShowBookModal(true)}
              disabled={!bibliaData.length}
            >
              <View style={styles.selectorContent}>
                <Ionicons name="library" size={20} color="#4A90E2" />
                <Text style={styles.selectorLabel}>Livro</Text>
              </View>
              <Text style={styles.selectorValue}>
                {selectedBook?.book || 'Selecionar'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>

            {/* Seletor de Capítulo */}
            <TouchableOpacity
              style={[styles.selector, !selectedBook && styles.disabledSelector]}
              onPress={() => selectedBook && setShowChapterModal(true)}
              disabled={!selectedBook}
            >
              <View style={styles.selectorContent}>
                <Ionicons name="document-text" size={20} color="#4A90E2" />
                <Text style={styles.selectorLabel}>Capítulo</Text>
              </View>
              <Text style={styles.selectorValue}>
                {selectedChapter !== null ? `${selectedChapter + 1}` : 'Selecionar'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>

            {/* Seletor de Versículo */}
            <TouchableOpacity
              style={[styles.selector, selectedChapter === null && styles.disabledSelector]}
              onPress={() => selectedChapter !== null && setShowVerseModal(true)}
              disabled={selectedChapter === null}
            >
              <View style={styles.selectorContent}>
                <Ionicons name="chatbubble-ellipses" size={20} color="#4A90E2" />
                <Text style={styles.selectorLabel}>Versículo</Text>
              </View>
              <Text style={styles.selectorValue}>
                {selectedVerse !== null ? `${selectedVerse + 1}` : 'Selecionar'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Área de Texto */}
          {currentText ? (
            <View style={styles.textContainer}>
              <View style={styles.referenceContainer}>
                <Text style={styles.reference}>
                  {selectedBook?.book} {selectedChapter + 1}:{selectedVerse + 1} ({selectedVersion})
                </Text>
              </View>
              <Text style={styles.verseText}>{currentText}</Text>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="book-outline" size={48} color="#DDD" />
              <Text style={styles.placeholderText}>
                Selecione uma versão, livro, capítulo e versículo para ler a Palavra de Deus
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      {renderModal(
        showVersionModal,
        () => setShowVersionModal(false),
        'Selecionar Versão',
        versions,
        handleVersionSelect,
        (item) => item.key
      )}

      {renderModal(
        showBookModal,
        () => setShowBookModal(false),
        'Selecionar Livro',
        bibliaData,
        handleBookSelect,
        (item) => item.abbrev
      )}

      {renderModal(
        showChapterModal,
        () => setShowChapterModal(false),
        'Selecionar Capítulo',
        getChapterNumbers(),
        (item, index) => handleChapterSelect(index)
      )}

      {renderModal(
        showVerseModal,
        () => setShowVerseModal(false),
        'Selecionar Versículo',
        getVerseNumbers(),
        (item, index) => handleVerseSelect(index)
      )}

      
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
    textAlign: 'center',
  },
  selectorsContainer: {
    marginBottom: 20,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  disabledSelector: {
    opacity: 0.5,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectorLabel: {
    fontSize: 16,
    color: '#495057',
    marginLeft: 10,
    fontWeight: '500',
  },
  selectorValue: {
    fontSize: 14,
    color: '#6C757D',
    marginHorizontal: 10,
    textAlign: 'right',
    flex: 1,
  },
  textContainer: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  referenceContainer: {
    marginBottom: 15,
  },
  reference: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
    textAlign: 'center',
  },
  verseText: {
    fontSize: 18,
    lineHeight: 28,
    color: '#2C3E50',
    textAlign: 'justify',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    minHeight: 200,
  },
  placeholderText: {
    fontSize: 16,
    color: '#ADB5BD',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    maxHeight: height * 0.6,
  },
  modalItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  modalItemText: {
    fontSize: 16,
    color: '#495057',
  },
});

export default BibliaMain;