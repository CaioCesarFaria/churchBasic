// TBottom Tabs Navigation
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";

// Importar as telas
import ConteudosScreen from "../screens/Conteudos";
import ProgramacaoScreen from "../screens/Programacao";
import HomeScreen from "../screens/Home";
import GenerosidadeScreen from "../screens/Generosidade";
import MaisScreen from "../screens/Mais";

const Tab = createBottomTabNavigator();

export default function TabsNavigation() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#007bff",
        tabBarInactiveTintColor: "#777",
        tabBarStyle: {
          backgroundColor: "#fff",
          height: Platform.OS === "ios" ? 80 : 60,
          paddingBottom: Platform.OS === "ios" ? 40 : 30,
          
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;

          switch (route.name) {
            case "Conteúdos":
              iconName = "book-outline";
              break;
            case "Programação":
              iconName = "calendar-outline";
              break;
            case "Home":
              iconName = "home-outline";
              break;
            case "Generosidade":
              iconName = "heart-outline";
              break;
            case "Mais":
              iconName = "menu-outline";
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
      initialRouteName="Home"
    >
      <Tab.Screen name="Conteúdos" component={ConteudosScreen} />
      <Tab.Screen name="Programação" component={ProgramacaoScreen} />
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Generosidade" component={GenerosidadeScreen} />
      <Tab.Screen name="Mais" component={MaisScreen} />
    </Tab.Navigator>
  );
}
