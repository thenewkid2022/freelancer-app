import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const RegisterScreen = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'freelancer' as 'freelancer',
  });
  const { register, loading } = useAuth();
  const navigation = useNavigation();

  const handleRegister = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle Felder aus');
      return;
    }

    if (formData.password.length < 8) {
      Alert.alert('Fehler', 'Das Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }

    try {
      await register(formData);
    } catch (error) {
      Alert.alert('Fehler', error instanceof Error ? error.message : 'Registrierung fehlgeschlagen');
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login' as never);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Registrieren</Text>
          <Text style={styles.subtitle}>Erstellen Sie Ihr Freelancer-Konto</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Vorname"
            value={formData.firstName}
            onChangeText={(text) => setFormData({ ...formData, firstName: text })}
            autoCapitalize="words"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Nachname"
            value={formData.lastName}
            onChangeText={(text) => setFormData({ ...formData, lastName: text })}
            autoCapitalize="words"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="E-Mail"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Passwort (min. 8 Zeichen)"
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            secureTextEntry
            autoCapitalize="none"
          />

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Rolle</Text>
            <Picker
              selectedValue={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
              style={styles.picker}
            >
              <Picker.Item label="Freelancer" value="freelancer" />
            </Picker>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Registrieren...' : 'Registrieren'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={handleLogin}
          >
            <Text style={styles.linkText}>
              Bereits ein Konto? Jetzt anmelden
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: 'white',
  },
  pickerContainer: {
    marginBottom: 15,
  },
  pickerLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
  },
});

export default RegisterScreen;
