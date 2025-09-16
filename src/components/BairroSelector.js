// BairroSelector.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

// Lista de bairros de Varginha
const BAIRROS_VARGINHA = [
  "Aeroporto", "Alta Villa", "Alto da Figueira II", "Alto da Figueira III",
  "Área Rural de Varginha", "Bela Vista", "Bom Pastor", "Campos Elíseos",
  "Centro", "Condomínio Lagamar", "Condomínio Pássaro", "Condomínio Residencial Urupês",
  "Conjunto Habitacional Centenário", "Conjunto Habitacional Sion", "Conjunto Habitacional Sion II",
  "Conjunto Minas Gerais", "Conjunto Residencial Jetcon", "Cruzeiro do Sul", "Damasco",
  "Distrito Industrial Cláudio Galvão Nogueira", "Distrito Industrial Miguel de Luca",
  "Dos Carvalhos", "Eldorado", "Fausto Ribeiro", "Imaculada Conceição", "Imperial",
  "Industrial JK", "Industrial Reinaldo Foresti", "Jardim Alvorada", "Jardim Andere",
  "Jardim Atlântico Sul", "Jardim Áurea", "Jardim Bouganville", "Jardim Canaã",
  "Jardim Cidade Nova", "Jardim Colonial", "Jardim Corcetti I", "Jardim das Oliveiras",
  "Jardim dos Pássaros", "Jardim Estrela I", "Jardim Estrela II", "Jardim Europa",
  "Jardim Itália", "Jardim Mariana", "Jardim Mont Serrat", "Jardim Morada do Sol",
  "Jardim Oriente", "Jardim Orlândia", "Jardim Panorama", "Jardim Petrópolis",
  "Jardim Renata", "Jardim Ribeiro", "Jardim Rio Verde", "Jardim Santa Mônica",
  "Jardim Santa Tereza", "Jardim São Joaquim", "Jardim Simões", "Jardim Sion",
  "Jardim Vale dos Ipês", "Jardim Vale Verde", "Jardim Zinoca", "Lagamar",
  "Loteamento Sete de Outubro", "Minas Gerais", "Nossa Senhora Aparecida",
  "Nossa Senhora das Graças III", "Nossa Senhora de Fátima", "Nossa Senhora de Lourdes",
  "Nova Varginha", "Novo Horizonte", "Padre Vitor", "Park Imperial", "Park Rinaldo",
  "Parque Alto da Figueira", "Parque Boa Vista", "Parque Catanduvas", "Parque das Acácias",
  "Parque das Américas", "Parque das Grevíleas", "Parque de Exposições", "Parque Ileana",
  "Parque Mariela", "Parque Nossa Senhora das Graças", "Parque Ozanam",
  "Parque Residencial Jardins do Ágape", "Parque Residencial Rio Verde", "Parque Retiro",
  "Parque São José", "Parque Urupês", "Parque Urupês III", "Penedo", "Pinheiros",
  "Primavera", "Princesa do Sul", "Residencial Alto Pinheiros", "Residencial Belo Horizonte",
  "Residencial Parque Imperador", "Residencial Vale das Palmeiras", "Rezende",
  "Rio Verde II", "Riviera do Lago", "Sagrado Coração", "Sagrado Coração II",
  "San Marino", "Santa Luiza", "Santa Maria", "Santa Terezinha", "Santana",
  "São Francisco", "São José", "São Lucas", "São Miguel Arcanjo", "São Sebastião",
  "Três Bicas", "Treviso", "Vargem", "Vila Adelaide", "Vila Andere I", "Vila Andere II",
  "Vila Avelar", "Vila Barcelona", "Vila Belmiro", "Vila Bueno", "Vila do Pontal",
  "Vila Dona Josefina", "Vila Flamengo", "Vila Floresta", "Vila Ipiranga", "Vila Isabel",
  "Vila Limborco", "Vila Maria", "Vila Maristela", "Vila Martins", "Vila Mendes",
  "Vila Monte Castelo", "Vila Monteiro", "Vila Morais", "Vila Murad", "Vila Nogueira",
  "Vila Nossa Senhora dos Anjos", "Vila Paiva", "Vila Pinto", "Vila Registânea",
  "Vila Santa Cruz", "Vila São Geraldo", "Vila Verde", "Vila Verônica"
];

const BairroSelector = ({ 
  value, 
  onValueChange, 
  placeholder = "Digite o bairro...",
  label = "Bairro:",
  style,
  inputStyle,
  required = false,
  maxSuggestions = 5
}) => {
  const [searchText, setSearchText] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Sincronizar com valor externo
  useEffect(() => {
    if (value !== searchText) {
      setSearchText(value || '');
    }
  }, [value]);

  // Buscar bairros baseado no texto digitado
  const handleTextChange = (text) => {
    setSearchText(text);
    onValueChange(text);

    if (text.length >= 2) {
      const filtered = BAIRROS_VARGINHA.filter(bairro =>
        bairro.toLowerCase().includes(text.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Selecionar bairro da lista
  const selectBairro = (bairro) => {
    setSearchText(bairro);
    onValueChange(bairro);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Fechar sugestões quando o input perde o foco
  const handleBlur = () => {
    // Pequeno delay para permitir clique nas sugestões
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <TextInput
        style={[styles.input, inputStyle]}
        placeholder={placeholder}
        value={searchText}
        onChangeText={handleTextChange}
        onFocus={() => {
          if (searchText.length >= 2) {
            setShowSuggestions(true);
          }
        }}
        onBlur={handleBlur}
        autoCapitalize="words"
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <ScrollView 
            style={styles.suggestionsList}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {suggestions.slice(0, maxSuggestions).map((item, index) => (
              <TouchableOpacity
                key={`${item}_${index}`}
                style={styles.suggestionItem}
                onPress={() => selectBairro(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.suggestionText}>{item}</Text>
              </TouchableOpacity>
            ))}
            
            {suggestions.length > maxSuggestions && (
              <View style={styles.moreItemsIndicator}>
                <Text style={styles.moreItemsText}>
                  +{suggestions.length - maxSuggestions} outros bairros...
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}
      
      {showSuggestions && suggestions.length === 0 && searchText.length >= 2 && (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>
            Nenhum bairro encontrado para "{searchText}"
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
    zIndex: 1000,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  required: {
    color: '#ff4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: 200,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 1001,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
  },
  moreItemsIndicator: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#e9ecef',
  },
  moreItemsText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  noResultsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  noResultsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default BairroSelector;