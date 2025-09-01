// AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../Firebase/FirebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Usuário do Firebase Auth
  const [userData, setUserData] = useState(null); // Dados extras do Firestore
  const [loading, setLoading] = useState(true); // Loading para sincronização inicial

  // Função para buscar dados do usuário no Firestore
  const fetchUserRole = async (uid) => {
    console.log("Iniciando fetchUserRole...");
    console.log("Usuário logado:", uid);
    
    try {
      // Primeiro tenta buscar em lideres
      console.log("Tentando buscar em lideres:", `churchBasico/users/lideres/${uid}`);
      let userDoc = await getDoc(doc(db, "churchBasico", "users", "lideres", uid));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log("Encontrado em lideres! Dados:", data);
        console.log("userRole definido para:", data.userType);
        return data;
      } else {
        console.log("Não encontrado em lideres. Tentando buscar em members...");
      }

      // Se não encontrar em lideres, tenta em members
      console.log("Tentando buscar em members:", `churchBasico/users/members/${uid}`);
      userDoc = await getDoc(doc(db, "churchBasico", "users", "members", uid));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log("Encontrado em members! Dados:", data);
        console.log("userRole definido para:", data.userType);
        return data;
      } else {
        console.log("Não encontrado em members. Tentando buscar em users...");
      }

      // Se não encontrar em members, tenta na coleção users direta (adminMaster)
      userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log("Encontrado em users! Dados:", data);
        return data;
      }

      console.log("Usuário não encontrado em nenhuma coleção");
      return null;
    } catch (error) {
      console.log("Erro ao buscar dados do usuário:", error);
      return null;
    } finally {
      console.log("fetchUserRole concluído.");
    }
  };

  // Escutar mudanças no estado de autenticação do Firebase
  useEffect(() => {
    console.log("Configurando listener de autenticação...");
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("onAuthStateChanged disparado, user:", firebaseUser?.uid);
      
      if (firebaseUser) {
        // Usuário está logado
        setUser(firebaseUser);
        
        // Buscar dados adicionais no Firestore
        const additionalData = await fetchUserRole(firebaseUser.uid);
        
        if (additionalData) {
          setUserData(additionalData);
          // Salvar no AsyncStorage para persistência
          await AsyncStorage.setItem("userData", JSON.stringify(additionalData));
        } else {
          // Se não encontrar dados no Firestore, usar dados básicos do Firebase Auth
          const basicData = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email,
            email: firebaseUser.email,
            userType: "member"
          };
          setUserData(basicData);
          await AsyncStorage.setItem("userData", JSON.stringify(basicData));
        }
      } else {
        // Usuário não está logado
        console.log("Usuário não está logado, limpando estados...");
        setUser(null);
        setUserData(null);
        await AsyncStorage.removeItem("userData");
      }
      
      setLoading(false);
    });

    return unsubscribe; // Cleanup do listener
  }, []);

  // Função de login (agora só atualiza os dados extras, o Firebase Auth é gerenciado automaticamente)
  const login = async (additionalData) => {
    try {
      setUserData(additionalData);
      await AsyncStorage.setItem("userData", JSON.stringify(additionalData));
    } catch (error) {
      console.log("Erro ao salvar dados do usuário:", error);
    }
  };

  // Função de logout
  const logout = async () => {
    try {
      await signOut(auth); // Isso vai disparar o onAuthStateChanged automaticamente
      await AsyncStorage.removeItem("userData");
    } catch (error) {
      console.log("Erro ao fazer logout:", error);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        userData, 
        setUserData, 
        login, 
        logout, 
        loading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
