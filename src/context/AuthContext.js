// AuthContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null); // Dados extras (Firestore)

  // Carregar usuário salvo no AsyncStorage ao iniciar o app
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setUserData(parsedUser); // mantém compatível
        }
      } catch (error) {
        console.log("Erro ao carregar usuário:", error);
      }
    };
    loadUser();
  }, []);

  // Função de login
  const login = async (userData) => {
    try {
      await AsyncStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      setUserData(userData);
    } catch (error) {
      console.log("Erro ao salvar usuário:", error);
    }
  };

  // Função de logout
  const logout = async () => {
    try {
      await AsyncStorage.removeItem("user");
      setUser(null);
    } catch (error) {
      console.log("Erro ao remover usuário:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, setUserData, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
