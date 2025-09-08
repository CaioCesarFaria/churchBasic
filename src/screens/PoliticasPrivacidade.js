import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function PoliticasPrivacidade({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Políticas de Privacidade</Text>
        
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.textContainer}>
          
          <Text style={styles.title}>Política de Privacidade</Text>
          
          <Text style={styles.subtitle}>
            Transparência sobre como tratamos seus dados ao usar o aplicativo <Text style={styles.bold}>Abba Church Oficial</Text> e nosso site.
          </Text>

          <Text style={styles.updateInfo}>
            <Text style={styles.bold}>Última atualização:</Text> 08/09/2025
          </Text>

          <Text style={styles.paragraph}>
            Esta Política se aplica ao app <Text style={styles.bold}>Abba Church Oficial</Text> e ao site abbachurchoficial.com.br. Ao utilizar nossos serviços, você concorda com os termos abaixo, em conformidade com a <Text style={styles.bold}>LGPD (Lei nº 13.709/2018)</Text>.
          </Text>

          <Text style={styles.sectionTitle}>1. Dados que coletamos</Text>
          <Text style={styles.paragraph}>
            Coletamos somente o necessário para oferecer e melhorar os serviços:
          </Text>
          <Text style={styles.bulletPoint}>
            • <Text style={styles.bold}>Dados informados por você:</Text> nome, e-mail, telefone e mensagens quando preenche formulários (inscrições em eventos, pedidos de oração, contato).
          </Text>
          <Text style={styles.bulletPoint}>
            • <Text style={styles.bold}>Dados de uso:</Text> páginas/telas acessadas, interações, datas/horários e identificadores de notificações (quando permitidas).
          </Text>
          <Text style={styles.bulletPoint}>
            • <Text style={styles.bold}>Dados do dispositivo:</Text> sistema operacional, modelo e informações técnicas para compatibilidade e segurança.
          </Text>

          <Text style={styles.sectionTitle}>2. Finalidades do uso</Text>
          <Text style={styles.bulletPoint}>• Viabilizar transmissões de cultos, rádio e conteúdo on-demand.</Text>
          <Text style={styles.bulletPoint}>• Enviar <Text style={styles.bold}>notificações</Text> sobre cultos, eventos e comunicados.</Text>
          <Text style={styles.bulletPoint}>• Gerenciar <Text style={styles.bold}>inscrições</Text> em eventos e atividades.</Text>
          <Text style={styles.bulletPoint}>• Aprimorar a experiência e a segurança dos serviços.</Text>
          <Text style={styles.bulletPoint}>• Cumprir obrigações legais e atender solicitações de autoridades, quando necessário.</Text>

          <Text style={styles.sectionTitle}>3. Base legal</Text>
          <Text style={styles.paragraph}>
            Tratamos dados com base em <Text style={styles.bold}>consentimento</Text> (art. 7º, I, LGPD), <Text style={styles.bold}>execução de contrato</Text> (art. 7º, V) e <Text style={styles.bold}>legítimo interesse</Text> (art. 7º, IX), observando os princípios da necessidade e transparência.
          </Text>

          <Text style={styles.sectionTitle}>4. Compartilhamento</Text>
          <Text style={styles.paragraph}>
            Não vendemos dados pessoais. Compartilhamos apenas quando:
          </Text>
          <Text style={styles.bulletPoint}>• Com <Text style={styles.bold}>operadores</Text> estritamente necessários (hospedagem, analytics, push), sob contrato de confidencialidade;</Text>
          <Text style={styles.bulletPoint}>• Por <Text style={styles.bold}>exigência legal</Text> ou ordem de autoridade competente;</Text>
          <Text style={styles.bulletPoint}>• Com seu <Text style={styles.bold}>consentimento</Text>, quando aplicável.</Text>

          <Text style={styles.sectionTitle}>5. Serviços de terceiros</Text>
          <Text style={styles.paragraph}>
            Podemos integrar YouTube/Live, players de áudio/vídeo, redes sociais, Google/Firebase (notificações/analytics) e soluções de formulário. Cada serviço possui sua própria política de privacidade.
          </Text>

          <Text style={styles.sectionTitle}>6. Cookies e tecnologias similares</Text>
          <Text style={styles.paragraph}>
            Utilizamos cookies essenciais para funcionamento e métricas de uso. Você pode gerenciá-los no navegador. Cookies podem ser necessários para login, manutenção de sessão e recursos multimídia.
          </Text>

          <Text style={styles.sectionTitle}>7. Segurança</Text>
          <Text style={styles.paragraph}>
            Adotamos medidas técnicas e administrativas para proteger os dados contra acessos não autorizados, perda e alterações indevidas. Apesar dos esforços, nenhum sistema é 100% imune; por isso, recomendamos boas práticas de segurança por parte do usuário.
          </Text>

          <Text style={styles.sectionTitle}>8. Seus direitos (LGPD)</Text>
          <Text style={styles.paragraph}>
            Você pode solicitar: confirmação de tratamento, acesso, correção, anonimização, portabilidade, eliminação, revogação de consentimento e informações sobre compartilhamentos.
          </Text>
          <Text style={styles.paragraph}>
            Para exercer seus direitos, entre em contato pelo e-mail contato@abbachurchoficial.com.br.
          </Text>

          <Text style={styles.sectionTitle}>9. Retenção</Text>
          <Text style={styles.paragraph}>
            Conservamos dados pelo período necessário às finalidades desta Política e por prazos legais/regulatórios. Após esse período, dados são eliminados ou anonimizados de forma segura.
          </Text>

          <Text style={styles.sectionTitle}>10. Crianças e adolescentes</Text>
          <Text style={styles.paragraph}>
            Se o público-alvo incluir menores de 13 anos, o uso de dados pessoais ocorrerá com consentimento específico de pelo menos um dos pais ou responsável, conforme a LGPD.
          </Text>

          <Text style={styles.sectionTitle}>11. Transferências internacionais</Text>
          <Text style={styles.paragraph}>
            Provedores podem processar dados fora do Brasil. Nesses casos, adotamos salvaguardas adequadas, observando os arts. 33–36 da LGPD.
          </Text>

          <Text style={styles.sectionTitle}>12. Alterações desta Política</Text>
          <Text style={styles.paragraph}>
            Poderemos atualizar esta Política para refletir melhorias ou requisitos legais. A versão vigente estará sempre neste endereço.
          </Text>

          <Text style={styles.sectionTitle}>13. Contato</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Abba Church</Text>
          </Text>
          <Text style={styles.paragraph}>
            Site: abbachurchoficial.com.br
          </Text>
          <Text style={styles.paragraph}>
            E-mail: contato@abbachurchoficial.com.br
          </Text>

          <Text style={styles.finalNote}>
            Esta Política integra os Termos de Uso do aplicativo e do site da Abba Church.
          </Text>

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
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  textContainer: {
    padding: 20,
    backgroundColor: "#fff",
    margin: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
    lineHeight: 22,
  },
  updateInfo: {
    fontSize: 14,
    color: "#B8986A",
    textAlign: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 25,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
    marginBottom: 12,
    textAlign: "justify",
  },
  bulletPoint: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
    marginBottom: 8,
    marginLeft: 10,
    textAlign: "justify",
  },
  bold: {
    fontWeight: "bold",
  },
  finalNote: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
    fontStyle: "italic",
  },
});