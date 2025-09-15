import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, Title, RadioButton, HelperText } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/theme';

interface RegisterScreenProps {
  navigation: any;
}

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'truck_owner',
    fullName: '',
    phone: '',
    businessName: '',
    businessType: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!formData.username || !formData.email || !formData.password || !formData.fullName || !formData.phone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    const payload = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      role: formData.role as 'truck_owner' | 'mechanic',
      fullName: formData.fullName,
      phone: formData.phone,
      businessName: formData.businessName || undefined,
      businessType: formData.businessType || undefined,
    };

    console.log('Register payload:', payload);
    
    setLoading(true);
    const success = await register(payload);
    setLoading(false);

    if (!success) {
      Alert.alert('Registration Failed', 'Please check your information and try again');
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Title style={styles.title}>Join Breakdown Buddy</Title>
          <Text style={styles.subtitle}>Create your account</Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Registration</Text>
            
            <TextInput
              label="Username *"
              value={formData.username}
              onChangeText={(value) => updateField('username', value)}
              mode="outlined"
              style={styles.input}
              autoCapitalize="none"
            />

            <TextInput
              label="Email *"
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <TextInput
              label="Full Name *"
              value={formData.fullName}
              onChangeText={(value) => updateField('fullName', value)}
              mode="outlined"
              style={styles.input}
              autoCapitalize="words"
            />

            <TextInput
              label="Phone Number *"
              value={formData.phone}
              onChangeText={(value) => updateField('phone', value)}
              mode="outlined"
              style={styles.input}
              keyboardType="phone-pad"
              placeholder="+27 81 234 5678"
            />

            <TextInput
              label="Password *"
              value={formData.password}
              onChangeText={(value) => updateField('password', value)}
              mode="outlined"
              style={styles.input}
              secureTextEntry
              autoComplete="password"
            />

            <TextInput
              label="Confirm Password *"
              value={formData.confirmPassword}
              onChangeText={(value) => updateField('confirmPassword', value)}
              mode="outlined"
              style={styles.input}
              secureTextEntry
            />

            <Text style={styles.sectionTitle}>Account Type</Text>
            <RadioButton.Group 
              onValueChange={(value) => updateField('role', value)} 
              value={formData.role}
            >
              <View style={styles.radioOption}>
                <RadioButton value="truck_owner" />
                <View style={styles.radioText}>
                  <Text style={styles.radioLabel}>Truck Owner</Text>
                  <HelperText type="info">Request breakdown assistance</HelperText>
                </View>
              </View>
              <View style={styles.radioOption}>
                <RadioButton value="mechanic" />
                <View style={styles.radioText}>
                  <Text style={styles.radioLabel}>Mechanic</Text>
                  <HelperText type="info">Provide breakdown assistance</HelperText>
                </View>
              </View>
            </RadioButton.Group>

            <TextInput
              label="Business Name (Optional)"
              value={formData.businessName}
              onChangeText={(value) => updateField('businessName', value)}
              mode="outlined"
              style={styles.input}
            />

            {formData.role === 'mechanic' && (
              <TextInput
                label="Business Type (Optional)"
                value={formData.businessType}
                onChangeText={(value) => updateField('businessType', value)}
                mode="outlined"
                style={styles.input}
                placeholder="e.g., Mobile Mechanic, Truck Repair Shop"
              />
            )}

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={loading}
              style={styles.registerButton}
              contentStyle={styles.buttonContent}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              style={styles.loginButton}
            >
              Already have an account? Sign In
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.disclaimerText}>
            By creating an account, you acknowledge that Breakdown Buddy is a platform connecting truck owners with mechanics. We are not responsible for service quality, safety, or payment disputes. Always verify mechanic credentials and prioritize your safety. Use this service at your own risk.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: colors.text,
  },
  input: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
    color: colors.text,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioText: {
    flex: 1,
    marginLeft: 8,
  },
  radioLabel: {
    fontSize: 16,
    color: colors.text,
  },
  registerButton: {
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: colors.primary,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  loginButton: {
    marginTop: 10,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  disclaimerText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 10,
  },
});