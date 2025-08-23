// App.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import TabsNavigation from "./src/routes/TabsNavigation";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ConteudoVideo from "./src/screens/ConteudoVideo";

const Stack = createNativeStackNavigator();
export default function App() {

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* Tabs como tela principal */}
        <Stack.Screen
          name="Início"
          component={TabsNavigation}
          options={{ headerShown: false }}
        />
        {/* Tela de vídeo (alvo do CardVideo) */}
        <Stack.Screen
          name="ConteudoVideo"
          component={ConteudoVideo}
          options={({ route }) => ({
            title: route?.params?.title || "Vídeo",
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

