import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

function AddSerials() {
  const { control, handleSubmit, reset } = useForm();
  const router = useRouter();

  const onSubmit = async (data) => {
    try {
      const response = await axios.post(
        'https://omcti.in/apprise/api.php?task=add_serials',
        data,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data.success) {
        Alert.alert('Success', 'Serial data added successfully!', [
          {
            text: 'OK',
            onPress: () => router.push('/AdminDashboard'),
          },
        ]);
        reset();
      } else {
        Alert.alert('Error', response.data.message || 'Something went wrong.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to submit data.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.header}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => router.push('/AdminDashboard')}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Serial Data</Text>
        </LinearGradient>

        {/* Form */}
        <View style={styles.container}>
          {/* Issue Date */}
          <Text style={styles.label}>Issue Date</Text>
          <Controller
            control={control}
            name="issue_date"
            rules={{ required: true }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={value}
                onChangeText={onChange}
                keyboardType="numbers-and-punctuation"
                autoComplete="off"
              />
            )}
          />

          {/* Year */}
          <Text style={styles.label}>Year</Text>
          <Controller
            control={control}
            name="year"
            rules={{ required: true }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="2025"
                value={value}
                onChangeText={onChange}
              />
            )}
          />

          {/* Start Serial */}
          <Text style={styles.label}>Start Serial</Text>
          <Controller
            control={control}
            name="start_serial"
            rules={{ required: true }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Start Serial"
                value={value}
                onChangeText={onChange}
              />
            )}
          />

          {/* End Serial */}
          <Text style={styles.label}>End Serial</Text>
          <Controller
            control={control}
            name="end_serial"
            rules={{ required: true }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="End Serial"
                value={value}
                onChangeText={onChange}
              />
            )}
          />

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit(onSubmit)}>
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default AddSerials;

const styles = StyleSheet.create({
  header: {
    paddingTop: 45,
    paddingBottom: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    paddingRight: 15,
  },
  backText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  label: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 5,
    padding: 10,
    marginTop: 5,
  },
  submitBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 15,
    borderRadius: 6,
    marginTop: 40,
    alignItems: 'center',
  },
  submitText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 18,
  },
});
