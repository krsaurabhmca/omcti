import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import {
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import {
  Button,
  Dialog,
  Provider as PaperProvider,
  Portal,
  Snackbar
} from 'react-native-paper';

const PaymentDetailsScreen = () => {
  const router = useRouter();

  // Paper States
  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");

  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");

  // Show snackbar
  const showSnack = (msg) => {
    setSnackMessage(msg);
    setSnackVisible(true);
  };

  // Show dialog
  const showDialog = (msg) => {
    setDialogMessage(msg);
    setDialogVisible(true);
  };

  const openUPI = (url, errorMsg) => {
    Linking.openURL(url).catch(() => showDialog(errorMsg));
  };

  const handleUPIPayment = () => {
    openUPI(
      'upi://pay?pa=8510013001&pn=OMCTI Pvt. Ltd.',
      'UPI app not found. Please install a UPI app to make payments.'
    );
  };

  const handleWebPayment = () => {
    Linking.openURL('https://www.omcti.in/payment');
  };

  const handlePhonePePayment = () => {
    openUPI(
      'phonepe://pay?pa=8510013001',
      'PhonePe app not found. Please install PhonePe to make payments.'
    );
  };

  const handleGooglePayPayment = () => {
    openUPI(
      'tez://upi/pay?pa=8510013001',
      'Google Pay app not found. Please install Google Pay to make payments.'
    );
  };

  const copyToClipboard = (text, label) => {
    showSnack(`${label} copied: ${text}`);
  };

  return (
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        
        <StatusBar barStyle="light-content" backgroundColor="#234785" />

        {/* Header */}
        <LinearGradient
          colors={['#234785', '#3d6aa5']}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#ffeb44" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Payment Gateway</Text>
            <View style={styles.placeholder} />
          </View>

          <Text style={styles.headerSubtitle}>Pay in favor of</Text>
          <Text style={styles.instituteName}>OMCTI Pvt. Ltd.</Text>
        </LinearGradient>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* Account Payment Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="card-outline" size={24} color="#234785" />
              <Text style={styles.sectionTitle}>Account Payment</Text>
            </View>

            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.labelText}>Institute Name:</Text>
                <Text style={styles.valueText}>OMCTI Pvt. Ltd.</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.labelText}>IFSC Code:</Text>
                <TouchableOpacity 
                  onPress={() => copyToClipboard('HDFC000329', 'IFSC Code')}
                  style={styles.copyableText}
                >
                  <Text style={styles.valueTextHighlight}>HDFC000329</Text>
                  <Ionicons name="copy-outline" size={16} color="#234785" />
                </TouchableOpacity>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.labelText}>Account Number:</Text>
                <TouchableOpacity 
                  onPress={() => copyToClipboard('50200096307590', 'Account Number')}
                  style={styles.copyableText}
                >
                  <Text style={styles.valueTextHighlight}>50200096307590</Text>
                  <Ionicons name="copy-outline" size={16} color="#234785" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          {/* QR / UPI Payment Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="qr-code-outline" size={24} color="#234785" />
              <Text style={styles.sectionTitle}>QR / UPI Payment</Text>
            </View>

            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.labelText}>UPI ID:</Text>
                <TouchableOpacity 
                  onPress={() => copyToClipboard('8510013001', 'UPI ID')}
                  style={styles.copyableText}
                >
                  <Text style={styles.valueTextHighlight}>8510013001</Text>
                  <Ionicons name="copy-outline" size={16} color="#234785" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.paymentButton}
                onPress={handleUPIPayment}
              >
                <Ionicons name="flash" size={20} color="#234785" />
                <Text style={styles.buttonText}>Pay with UPI</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Mobile Payment Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="phone-portrait-outline" size={24} color="#234785" />
              <Text style={styles.sectionTitle}>Mobile Payment</Text>
            </View>

            <View style={styles.detailsCard}>
              <Text style={styles.mobilePaymentTitle}>Pay with PhonePe & Google Pay</Text>

              <View style={styles.mobileNumberContainer}>
                <Text style={styles.labelText}>Mobile Numbers:</Text>
                <TouchableOpacity 
                  onPress={() => copyToClipboard('8510013001', 'Mobile Number')}
                  style={styles.copyableText}
                >
                  <Text style={styles.valueTextHighlight}>8510013001</Text>
                  <Ionicons name="copy-outline" size={16} color="#234785" />
                </TouchableOpacity>
              </View>

              <View style={styles.mobileButtonsContainer}>
                <TouchableOpacity 
                  style={styles.mobilePaymentButton}
                  onPress={handlePhonePePayment}
                >
                  <Text style={styles.buttonText}>PhonePe</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.mobilePaymentButton, styles.mobilePaymentButtonSpacing]}
                  onPress={handleGooglePayPayment}
                >
                  <Text style={styles.buttonText}>Google Pay</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* QR Code Section */}
          <View style={styles.qrContainer}>
            <View style={styles.qrPlaceholder}>
              <Image
                source={{ uri: 'https://omcti.in/assets/img/qr.png' }}
                style={styles.qrImage}
                resizeMode="contain"
              />
              <Text style={styles.scanPayText}>SCAN & PAY</Text>
            </View>
            <Text style={styles.qrNote}>
              Scan this QR code with any UPI app to make payment
            </Text>
          </View>

        </ScrollView>

        {/* Paper Snackbar */}
        <Snackbar
          visible={snackVisible}
          onDismiss={() => setSnackVisible(false)}
          duration={1500}
          style={styles.snackbar}
        >
          {snackMessage}
        </Snackbar>

        {/* Error Dialog */}
        <Portal>
          <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
            <Dialog.Title>Error</Dialog.Title>
            <Dialog.Content>
              <Text>{dialogMessage}</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setDialogVisible(false)}>OK</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </SafeAreaView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 235, 68, 0.2)',
  },
  placeholder: {
    width: 40,
  },
  qrImage: {
    width: 150,
    height: 150,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffeb44',
    textAlign: 'center',
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ffeb44',
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.9,
  },
  instituteName: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 8,
    lineHeight: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#234785',
    marginLeft: 10,
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderTopWidth: 3,
    borderTopColor: '#ffeb44',
  },
  detailRow: {
    marginBottom: 15,
  },
  labelText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 5,
    fontWeight: '500',
  },
  valueText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600',
  },
  copyableText: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff9e6',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeb44',
  },
  valueTextHighlight: {
    fontSize: 16,
    color: '#234785',
    fontWeight: '700',
    flex: 1,
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffeb44',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    shadowColor: '#234785',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#234785',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  mobilePaymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#234785',
    marginBottom: 15,
    textAlign: 'center',
  },
  mobileNumberContainer: {
    marginBottom: 20,
  },
  mobileButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mobilePaymentButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#ffeb44',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#234785',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  mobilePaymentButtonSpacing: {
    marginLeft: 15,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  qrPlaceholder: {
    backgroundColor: 'white',
    width: 200,
    height: 200,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#ffeb44',
  },
  scanPayText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#234785',
    marginTop: 10,
  },
  qrNote: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  snackbar: {
    backgroundColor: '#234785',
  },
});

export default PaymentDetailsScreen;