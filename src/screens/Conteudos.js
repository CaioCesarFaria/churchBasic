import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import CardVideo from "../components/CardVideo";

export default function ConteudosScreen() {
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  const categories = ["Todos", "Louvor", "Adoração", "Pregação", "Testemunho"];

  const videos = [
    {
      id: 1,
      thumbnail: "https://img.youtube.com/vi/mX8A3M7pL3k/maxresdefault.jpg",
      title: "Jireh",
      subtitle: "Ministério • Elevation",
      category: "Louvor",
      videoId: "mX8A3M7pL3k",
    },
    {
      id: 2,
      thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      title: "Grande é o Senhor",
      subtitle: "Ministério • ABBA Music",
      category: "Adoração",
      videoId: "dQw4w9WgXcQ",
    },
    {
      id: 3,
      thumbnail: "https://img.youtube.com/vi/kJQP7kiw5Fk/maxresdefault.jpg",
      title: "Despacito",
      subtitle: "Pastor • João Silva",
      category: "Pregação",
      videoId: "kJQP7kiw5Fk",
    },
    {
      id: 4,
      thumbnail: "https://img.youtube.com/vi/JGwWNGJdvx8/maxresdefault.jpg",
      title: "Shape of You",
      subtitle: "Membro • Maria Santos",
      category: "Testemunho",
      videoId: "JGwWNGJdvx8",
    },
    {
      id: 5,
      thumbnail: "https://img.youtube.com/vi/YQHsXMglC9A/maxresdefault.jpg",
      title: "Hello",
      subtitle: "Ministério • ABBA Worship",
      category: "Louvor",
      videoId: "YQHsXMglC9A",
    },
  ];

  const filteredVideos = videos.filter((video) => {
    const matchesSearch = video.title
      .toLowerCase()
      .includes(searchText.toLowerCase());
    const matchesCategory =
      selectedCategory === "Todos" || video.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const CategoryButton = ({ category, isSelected, onPress }) => (
    <TouchableOpacity
      style={[styles.categoryButton, isSelected && styles.selectedCategoryButton]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.categoryButtonText,
          isSelected && styles.selectedCategoryButtonText,
        ]}
      >
        {category}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Conteúdos</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar conteúdos..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <CategoryButton
              key={category}
              category={category}
              isSelected={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
            />
          ))}
        </ScrollView>

        {/* Videos Grid */}
        <View style={styles.videosContainer}>
          {filteredVideos.map((video) => (
            <View key={video.id} style={styles.videoWrapper}>
              <CardVideo
                thumbnail={video.thumbnail}
                title={video.title}
                subtitle={video.subtitle}
                category={video.category}
                videoId={video.videoId}
              />
            </View>
          ))}
        </View>

        {filteredVideos.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="videocam-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchText
                ? "Nenhum conteúdo encontrado"
                : "Nenhum conteúdo disponível"}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchText
                ? "Tente buscar por outro termo"
                : "Novos conteúdos serão adicionados em breve"}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
  },
  searchButton: {
    padding: 10,
    marginRight: -10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingRight: 40,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectedCategoryButton: {
    backgroundColor: "#B8986A",
    borderColor: "#B8986A",
  },
  categoryButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  selectedCategoryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  videosContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  videoWrapper: {
    alignItems: "center",
    marginBottom: 15,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 20,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
});
