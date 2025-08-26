import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function GenerosidadeScreen() {
  const [selectedAmount, setSelectedAmount] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [selectedType, setSelectedType] = useState("dizimo");

  const predefinedAmounts = ["50", "100", "200", "500"];

  const handleDonate = () => {
    const amount = selectedAmount || customAmount;
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Erro", "Por favor, selecione ou digite um valor válido");
      return;
    }

    Alert.alert(
      "Confirmar Doação",
      `Deseja doar R$ ${amount} como ${selectedType === "dizimo" ? "Dízimo" : "Oferta"}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: () => {
            Alert.alert("Sucesso!", "Obrigado pela sua generosidade! Você será redirecionado para o pagamento.");
          },
        },
      ]
    );
  };

  const AmountButton = ({ amount, isSelected, onPress }) => (
    <TouchableOpacity
      style={[styles.amountButton, isSelected && styles.selectedAmountButton]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.amountButtonText,
          isSelected && styles.selectedAmountButtonText,
        ]}
      >
        R$ {amount}
      </Text>
    </TouchableOpacity>
  );

  const TypeButton = ({ type, title, description, isSelected, onPress }) => (
    <TouchableOpacity
      style={[styles.typeButton, isSelected && styles.selectedTypeButton]}
      onPress={onPress}
    >
      <View style={styles.typeButtonContent}>
        <View style={styles.typeHeader}>
          <Text
            style={[
              styles.typeTitle,
              isSelected && styles.selectedTypeTitle,
            ]}
          >
            {title}
          </Text>
          <View
            style={[
              styles.radioCircle,
              isSelected && styles.selectedRadioCircle,
            ]}
          >
            {isSelected && <View style={styles.radioInner} />}
          </View>
        </View>
        <Text
          style={[
            styles.typeDescription,
            isSelected && styles.selectedTypeDescription,
          ]}
        >
          {description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Generosidade</Text>
        <TouchableOpacity style={styles.historyButton}>
          <Ionicons name="time-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <Ionicons name="heart" size={40} color="#B8986A" />
          </View>
          <Text style={styles.heroTitle}>Sua generosidade importa</Text>
          <Text style={styles.heroSubtitle}>
            "Cada um contribua segundo propôs no seu coração; não com tristeza, 
            ou por necessidade; porque Deus ama ao que dá com alegria."
          </Text>
          <Text style={styles.heroReference}>2 Coríntios 9:7</Text>
        </View>

        {/* Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de Contribuição</Text>
          <TypeButton
            type="dizimo"
            title="Dízimo"
            description="10% da renda como gratidão a Deus"
            isSelected={selectedType === "dizimo"}
            onPress={() => setSelectedType("dizimo")}
          />
          <TypeButton
            type="oferta"
            title="Oferta"
            description="Contribuição voluntária adicional"
            isSelected={selectedType === "oferta"}
            onPress={() => setSelectedType("oferta")}
          />
        </View>

        {/* Amount Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Valor da Contribuição</Text>
          
          <View style={styles.amountsGrid}>
            {predefinedAmounts.map((amount) => (
              <AmountButton
                key={amount}
                amount={amount}
                isSelected={selectedAmount === amount && !customAmount}
                onPress={() => {
                  setSelectedAmount(amount);
                  setCustomAmount("");
                }}
              />
            ))}
          </View>

          <Text style={styles.orText}>ou</Text>

          <View style={styles.customAmountContainer}>
            <Text style={styles.currencySymbol}>R$</Text>
            <TextInput
              style={styles.customAmountInput}
              placeholder="Digite o valor"
              value={customAmount}
              onChangeText={(text) => {
                setCustomAmount(text);
                setSelectedAmount("");
              }}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Métodos de Pagamento</Text>
          
          <View style={styles.paymentMethods}>
            <TouchableOpacity style={styles.paymentMethod}>
              <Ionicons name="card-outline" size={24} color="#B8986A" />
              <Text style={styles.paymentMethodText}>Cartão de Crédito</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.paymentMethod}>
              <Ionicons name="phone-portrait-outline" size={24} color="#B8986A" />
              <Text style={styles.paymentMethodText}>PIX</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.paymentMethod}>
              <Ionicons name="business-outline" size={24} color="#B8986A" />
              <Text style={styles.paymentMethodText}>Débito Automático</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Donate Button */}
        <View style={styles.donateContainer}>
          <TouchableOpacity
            style={[
              styles.donateButton,
              (!selectedAmount && !customAmount) && styles.disabledDonateButton,
            ]}
            onPress={handleDonate}
            disabled={!selectedAmount && !customAmount}
          >
            <Ionicons name="heart" size={20} color="#fff" />
            <Text style={styles.donateButtonText}>
              Contribuir {selectedAmount || customAmount ? `R$ ${selectedAmount || customAmount}` : ''}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.securityNote}>
            <Ionicons name="shield-checkmark" size={14} color="#666" />
            {" "}Transação 100% segura e criptografada
          </Text>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Como sua contribuição ajuda:</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="home-outline" size={20} color="#B8986A" />
            <Text style={styles.infoText}>Manutenção e infraestrutura da igreja</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="people-outline" size={20} color="#B8986A" />
            <Text style={styles.infoText}>Projetos sociais e assistenciais</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="globe-outline" size={20} color="#B8986A" />
            <Text style={styles.infoText}>Missões e evangelização</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="school-outline" size={20} color="#B8986A" />
            <Text style={styles.infoText}>Educação e discipulado</Text>
          </View>
        </View>
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
  historyButton: {
    padding: 10,
    marginRight: -10,
  },
  heroSection: {
    backgroundColor: "#fff",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 30,
    margin: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFF8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    fontStyle: "italic",
    marginBottom: 10,
  },
  heroReference: {
    fontSize: 12,
    color: "#B8986A",
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  typeButton: {
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  selectedTypeButton: {
    borderColor: "#B8986A",
    backgroundColor: "#FFF8F0",
  },
  typeButtonContent: {
    flex: 1,
  },
  typeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  selectedTypeTitle: {
    color: "#B8986A",
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedRadioCircle: {
    borderColor: "#B8986A",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#B8986A",
  },
  typeDescription: {
    fontSize: 14,
    color: "#666",
  },
  selectedTypeDescription: {
    color: "#888",
  },
  amountsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  amountButton: {
    width: "48%",
    paddingVertical: 15,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  selectedAmountButton: {
    borderColor: "#B8986A",
    backgroundColor: "#FFF8F0",
  },
  amountButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  selectedAmountButtonText: {
    color: "#B8986A",
  },
  orText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    marginVertical: 15,
  },
  customAmountContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingHorizontal: 15,
  },
  currencySymbol: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
    marginRight: 10,
  },
  customAmountInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: "#333",
  },
  paymentMethods: {
    gap: 12,
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    backgroundColor: "#fafafa",
  },
  paymentMethodText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  donateContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  donateButton: {
    backgroundColor: "#B8986A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 25,
    marginBottom: 10,
  },
  disabledDonateButton: {
    backgroundColor: "#ccc",
    opacity: 0.7,
  },
  donateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  securityNote: {
    textAlign: "center",
    fontSize: 12,
    color: "#666",
  },
  infoSection: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
});
