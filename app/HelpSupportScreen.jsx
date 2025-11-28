import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

const HelpSupportScreen = () => {
  const [helpData, setHelpData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const { student_id } = useLocalSearchParams();
  const studentId = student_id;

  // FAQ Data
  const faqData = [
    {
      id: 1,
      question: "How to download my certificates?",
      answer:
        "Go to Downloads section from the main menu. You can download your marksheet, certificate, and admit card from there. Make sure you have a stable internet connection.",
    },
    {
      id: 2,
      question: "How to check my exam results?",
      answer:
        "Your exam results are available in the Results section. You can view detailed scorecards and performance analysis there.",
    },
    {
      id: 3,
      question: "What if I forgot my login credentials?",
      answer:
        "Contact your center director or use the contact information provided below. They will help you recover your account access.",
    },
    {
      id: 4,
      question: "How to update my personal information?",
      answer:
        "Personal information updates need to be done through your center. Please contact your center director with the required documents.",
    },
    {
      id: 5,
      question: "Technical issues with the app?",
      answer:
        "For technical issues, you can contact our support team via WhatsApp, email, or phone. Our technical team will assist you promptly.",
    },
  ];

  // Quick Actions Data
  const quickActions = [
    {
      id: 1,
      title: "Feedback & Support",
      description: "Share feedback, request features, or report issues",
      icon: "help-circle-outline",
      color: "#234785",
      bgColor: "#E8F0F8",
    },
  ];

  // Fetch help data from API
  const fetchHelpData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://omcti.in/apprise/api.php?task=help",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            student_id: studentId,
          }),
        }
      );

      const data = await response.json();

      if (data.branch && data.organisation) {
        setHelpData(data);
      } else {
        Alert.alert("Error", "Failed to load help information");
      }
    } catch (error) {
      console.error("Error fetching help data:", error);
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHelpData();
  }, []);

  // Contact functions
  const makePhoneCall = (phoneNumber) => {
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, "");
    Linking.openURL(`tel:${cleanNumber}`);
  };

  const sendEmail = (email, subject = "Help & Support") => {
    Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(subject)}`);
  };

  const openWhatsApp = (
    phoneNumber,
    message = "Hello, I need help with the app."
  ) => {
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, "");
    const url = `whatsapp://send?phone=91${cleanNumber}&text=${encodeURIComponent(
      message
    )}`;

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert(
          "WhatsApp not installed",
          "Please install WhatsApp to use this feature"
        );
      }
    });
  };

  const openWebsite = (url) => {
    Linking.openURL(url);
  };

  // Toggle FAQ
  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  // Render contact card
  const renderContactCard = (type, data, icon, color) => (
    <View style={styles.contactCard}>
      <View style={styles.contactHeader}>
        <View style={[styles.contactIcon, { backgroundColor: color + "20" }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={styles.contactTitle}>
          {type === "branch" ? "Study Center" : "Head Office"}
        </Text>
      </View>

      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>
          {type === "branch" ? data.center_name : data.name}
        </Text>
        {type === "branch" && (
          <Text style={styles.contactCode}>Code: {data.center_code}</Text>
        )}

        {data.center_director && (
          <View style={styles.directorInfo}>
            <Text style={styles.directorLabel}>Director:</Text>
            <Text style={styles.directorName}>{data.center_director}</Text>
          </View>
        )}

        <Text style={styles.contactAddress}>
          {type === "branch"
            ? data.dp_address || "Address not available"
            : data.adrress}
        </Text>
      </View>

      <View style={styles.contactActions}>
        {/* Phone */}
        <TouchableOpacity
          style={[styles.actionButton, styles.phoneButton]}
          onPress={() =>
            makePhoneCall(type === "branch" ? data.center_mobile : data.mobile)
          }
        >
          <Ionicons name="call" size={20} color="#ffffff" />
        </TouchableOpacity>

        {/* WhatsApp */}
        <TouchableOpacity
          style={[styles.actionButton, styles.whatsappButton]}
          onPress={() =>
            openWhatsApp(type === "branch" ? data.center_mobile : data.mobile)
          }
        >
          <Ionicons name="logo-whatsapp" size={20} color="#ffffff" />
        </TouchableOpacity>

        {/* Email */}
        <TouchableOpacity
          style={[styles.actionButton, styles.emailButton]}
          onPress={() =>
            sendEmail(type === "branch" ? data.center_email : data.email)
          }
        >
          <Ionicons name="mail" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render quick action
  const renderQuickAction = (action) => (
    <TouchableOpacity
      key={action.id}
      style={styles.quickActionItem}
      onPress={() =>
        Alert.alert(action.title, "This feature will be implemented soon")
      }
    >
      <View
        style={[styles.quickActionIcon, { backgroundColor: action.bgColor }]}
      >
        <Ionicons name={action.icon} size={24} color={action.color} />
      </View>
      <View style={styles.quickActionContent}>
        <Text style={styles.quickActionTitle}>{action.title}</Text>
        <Text style={styles.quickActionDescription}>{action.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#234785" />
    </TouchableOpacity>
  );

  // Render FAQ item
  const renderFAQItem = (faq) => (
    <View key={faq.id} style={styles.faqItem}>
      <TouchableOpacity
        style={styles.faqQuestion}
        onPress={() => toggleFAQ(faq.id)}
      >
        <Text style={styles.faqQuestionText}>{faq.question}</Text>
        <Ionicons
          name={expandedFAQ === faq.id ? "chevron-up" : "chevron-down"}
          size={20}
          color="#234785"
        />
      </TouchableOpacity>

      {expandedFAQ === faq.id && (
        <View style={styles.faqAnswer}>
          <Text style={styles.faqAnswerText}>{faq.answer}</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#234785" />
        <LinearGradient
          colors={["#234785", "#1a3666"]}
          style={styles.loadingContainer}
        >
          <ActivityIndicator size="large" color="#ffeb44" />
          <Text style={styles.loadingText}>Loading Help Information...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!helpData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#234785" />
        <LinearGradient
          colors={["#234785", "#1a3666"]}
          style={styles.errorContainer}
        >
          <Ionicons name="alert-circle-outline" size={80} color="#ffeb44" />
          <Text style={styles.errorText}>Failed to load help information</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchHelpData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#234785" />

      {/* Header */}
      <LinearGradient colors={["#234785", "#1a3666"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={router.back}>
            <Ionicons name="arrow-back" size={24} color="#ffeb44" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Help & Support</Text>
            <Text style={styles.headerSubtitle}>We're here to help you</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchHelpData}
          >
            <Ionicons name="refresh" size={24} color="#ffeb44" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            {quickActions.map(renderQuickAction)}
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          {/* Study Center */}
          {renderContactCard("branch", helpData.branch, "school", "#234785")}

          {/* Head Office */}
          {renderContactCard(
            "organisation",
            helpData.organisation,
            "business",
            "#3a5fa0"
          )}
        </View>

        {/* Website */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.websiteCard}
            onPress={() => openWebsite(helpData.organisation.website)}
          >
            <View style={styles.websiteIcon}>
              <Ionicons name="globe" size={24} color="#234785" />
            </View>
            <View style={styles.websiteContent}>
              <Text style={styles.websiteTitle}>Visit Website</Text>
              <Text style={styles.websiteUrl}>
                {helpData.organisation.website}
              </Text>
            </View>
            <Ionicons name="open-outline" size={20} color="#234785" />
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqContainer}>{faqData.map(renderFAQItem)}</View>
        </View>

        {/* Support Hours */}
        <View style={styles.section}>
          <View style={styles.supportHoursCard}>
            <View style={styles.supportHoursHeader}>
              <Ionicons name="time" size={24} color="#234785" />
              <Text style={styles.supportHoursTitle}>Support Hours</Text>
            </View>
            <Text style={styles.supportHoursText}>
              Monday - Saturday: 9:00 AM - 9:00 PM
            </Text>
            <Text style={styles.supportHoursText}>
              Suday: Closed
            </Text>
            <Text style={styles.supportHoursNote}>
              For urgent issues, you can reach us via WhatsApp anytime
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Need immediate assistance? Contact us via WhatsApp
          </Text>
          <Text style={styles.footerSubtext}>
            © 2025 IITM. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },

  // Loading & Error
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: "#ffeb44",
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 20,
    color: "#ffeb44",
    marginBottom: 30,
    textAlign: "center",
    fontWeight: "600",
  },
  retryButton: {
    backgroundColor: "#ffeb44",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    borderWidth: 2,
    borderColor: "#234785",
  },
  retryButtonText: {
    color: "#234785",
    fontSize: 16,
    fontWeight: "700",
  },

  // Header
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    padding: 4,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffeb44",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 235, 68, 0.8)",
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
    backgroundColor: "rgba(255, 235, 68, 0.2)",
    borderRadius: 20,
  },

  // Content
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#234785",
    marginBottom: 16,
    marginHorizontal: 20,
  },

  // Quick Actions
  quickActionsContainer: {
    paddingHorizontal: 20,
  },
  quickActionItem: {
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#ffeb44",
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#234785",
    marginBottom: 4,
  },
  quickActionDescription: {
    fontSize: 13,
    color: "#666",
  },

  // Contact Cards
  contactCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#ffeb44",
  },
  contactHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#234785",
  },
  contactInfo: {
    marginBottom: 20,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#234785",
    marginBottom: 4,
  },
  contactCode: {
    fontSize: 13,
    color: "#3a5fa0",
    fontWeight: "500",
    marginBottom: 8,
  },
  directorInfo: {
    flexDirection: "row",
    marginBottom: 8,
  },
  directorLabel: {
    fontSize: 14,
    color: "#666",
    marginRight: 8,
  },
  directorName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2c3e50",
  },
  contactAddress: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  contactActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 45,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
    borderRadius: 10,
    gap: 6,
  },
  phoneButton: {
    backgroundColor: "#4CAF50",
  },
  whatsappButton: {
    backgroundColor: "#25D366",
  },
  emailButton: {
    backgroundColor: "#234785",
  },

  // Website Card
  websiteCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#ffeb44",
  },
  websiteIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FFFEF5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  websiteContent: {
    flex: 1,
  },
  websiteTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#234785",
    marginBottom: 4,
  },
  websiteUrl: {
    fontSize: 13,
    color: "#3a5fa0",
  },

  // FAQ
  faqContainer: {
    paddingHorizontal: 20,
  },
  faqItem: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#ffeb44",
  },
  faqQuestion: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  faqQuestionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#234785",
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  faqAnswerText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginTop: 12,
  },

  // Support Hours
  supportHoursCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 2,
    borderColor: "#234785",
  },
  supportHoursHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  supportHoursTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#234785",
    marginLeft: 12,
  },
  supportHoursText: {
    fontSize: 15,
    color: "#2c3e50",
    lineHeight: 24,
    marginBottom: 12,
  },
  supportHoursNote: {
    fontSize: 13,
    color: "#25D366",
    fontStyle: "italic",
  },

  // Footer
  footer: {
    padding: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
});

export default HelpSupportScreen;
