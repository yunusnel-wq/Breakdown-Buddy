import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, TextInput, Divider } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/theme';

export default function EditProfileScreen({ navigation }: any) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: (user as any)?.fullName || '',
    phone: (user as any)?.phone || '',
    location: (user as any)?.location || '',
    businessName: (user as any)?.businessName || '',
  });

  const handleSave = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call to update profile
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Edit Profile</Text>
          
          <TextInput
            label="Full Name"
            value={formData.fullName}
            onChangeText={(text) => setFormData({...formData, fullName: text})}
            style={styles.input}
            mode="outlined"
          />
          
          <TextInput
            label="Phone Number"
            value={formData.phone}
            onChangeText={(text) => setFormData({...formData, phone: text})}
            style={styles.input}
            mode="outlined"
            keyboardType="phone-pad"
          />
          
          <TextInput
            label="Location"
            value={formData.location}
            onChangeText={(text) => setFormData({...formData, location: text})}
            style={styles.input}
            mode="outlined"
            placeholder="City, Province"
          />
          
          {user?.role === 'truck_owner' && (
            <TextInput
              label="Business Name"
              value={formData.businessName}
              onChangeText={(text) => setFormData({...formData, businessName: text})}
              style={styles.input}
              mode="outlined"
            />
          )}
          
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={loading}
              style={styles.saveButton}
            >
              Save Changes
            </Button>
            
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.primary,
  },
  input: {
    marginBottom: 16,
  },
  buttonContainer: {
    marginTop: 20,
  },
  saveButton: {
    marginBottom: 10,
  },
  cancelButton: {
    borderColor: colors.primary,
  },
});