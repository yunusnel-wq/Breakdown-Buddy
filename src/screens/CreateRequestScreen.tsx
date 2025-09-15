import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Card, Title, RadioButton, HelperText } from 'react-native-paper';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { colors } from '../theme/theme';

interface CreateRequestScreenProps {
  navigation: any;
}

const issueTypes = [
  { value: 'engine_failure', label: 'Engine Failure', icon: 'settings' },
  { value: 'transmission', label: 'Transmission Issues', icon: 'settings' },
  { value: 'hydraulics', label: 'Hydraulic Problems', icon: 'water' },
  { value: 'air_brakes', label: 'Air Brake System', icon: 'stop' },
  { value: 'electrical', label: 'Electrical Issues', icon: 'flash-on' },
  { value: 'tire_blowout', label: 'Tire Blowout', icon: 'tire-repair' },
  { value: 'fuel_system', label: 'Fuel System', icon: 'local-gas-station' },
  { value: 'trailer', label: 'Trailer Problem', icon: 'rv-hookup' },
  { value: 'pneumatics', label: 'Pneumatics (Air)', icon: 'air' },
  { value: 'other', label: 'Other Issue', icon: 'help-outline' },
];

export default function CreateRequestScreen({ navigation }: CreateRequestScreenProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    issueType: '',
    description: '',
    location: '',
    urgency: 'medium', // Keep for backend compatibility but don't show in UI
  });
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [manualLocation, setManualLocation] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Please enable location access to automatically detect your position, or enter the location manually.',
          [
            { text: 'Enter Manually', onPress: () => setManualLocation(true) },
            { text: 'Settings', onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setCurrentLocation(location);
      setManualLocation(false);

      // Reverse geocode to get address
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address.length > 0) {
        const addr = address[0];
        const formattedAddress = [
          addr.streetNumber,
          addr.street,
          addr.city,
          addr.region,
        ].filter(Boolean).join(', ');
        
        setFormData(prev => ({ ...prev, location: formattedAddress }));
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert(
        'Location Error', 
        'Could not get your current location. You can enter the location manually.',
        [
          { text: 'Enter Manually', onPress: () => setManualLocation(true) }
        ]
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.issueType || !formData.description || !formData.location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!user || !user.id) {
      Alert.alert('Error', 'Please log in to submit a request');
      return;
    }

    try {
      setLoading(true);

      const requestData = {
        issueType: formData.issueType,
        description: formData.description,
        location: formData.location,
        urgency: formData.urgency,
        // Use GPS coordinates if available, otherwise use default coordinates for Johannesburg
        latitude: currentLocation ? currentLocation.coords.latitude.toString() : '-26.2041',
        longitude: currentLocation ? currentLocation.coords.longitude.toString() : '28.0473',
        truckOwnerId: user.id,
      };

      console.log('Submitting request with user ID:', user.id);
      await apiService.createBreakdownRequest(requestData);

      Alert.alert(
        'Request Submitted',
        'Your breakdown request has been submitted. Nearby mechanics will be notified.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('MainTabs' as never);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Failed to create request:', error);
      Alert.alert('Error', 'Failed to submit your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // If user types in location manually, mark as manual location
    if (field === 'location' && value !== '' && !locationLoading) {
      setManualLocation(true);
      searchLocationSuggestions(value);
    }
  };

  const searchLocationSuggestions = (query: string) => {
    // Simple South African location suggestions
    const suggestions = [
      'N1 Highway near Bloemfontein, Free State',
      'N3 Highway near Durban, KwaZulu-Natal',
      'N2 Highway near Cape Town, Western Cape',
      'N4 Highway near Pretoria, Gauteng',
      'R59 Highway near Johannesburg, Gauteng',
      'N12 Highway near Kimberley, Northern Cape',
      'N14 Highway near Rustenburg, North West'
    ].filter(location => 
      location.toLowerCase().includes(query.toLowerCase())
    );
    
    setLocationSuggestions(suggestions);
    setShowSuggestions(query.length > 2 && suggestions.length > 0);
  };

  const selectLocationSuggestion = (suggestion: string) => {
    setFormData(prev => ({ ...prev, location: suggestion }));
    setShowSuggestions(false);
    setManualLocation(true);
  };

  const selectedIssue = issueTypes.find(issue => issue.value === formData.issueType);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Card style={styles.headerCard}>
          <Card.Content style={styles.headerContent}>
            <MaterialIcons name="car-repair" size={40} color={colors.error} />
            <View style={styles.headerText}>
              <Title style={styles.title}>Emergency Assistance</Title>
              <Text style={styles.subtitle}>
                Describe your breakdown and we'll connect you with nearby mechanics
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.formCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>What's the problem?</Text>
            
            <RadioButton.Group 
              onValueChange={(value) => updateField('issueType', value)} 
              value={formData.issueType}
            >
              {issueTypes.map((issue) => (
                <View key={issue.value} style={styles.radioOption}>
                  <RadioButton value={issue.value} />
                  <MaterialIcons 
                    name={issue.icon as any} 
                    size={20} 
                    color={formData.issueType === issue.value ? colors.primary : colors.textSecondary}
                    style={styles.issueIcon}
                  />
                  <Text style={[
                    styles.radioLabel,
                    formData.issueType === issue.value && styles.selectedLabel
                  ]}>
                    {issue.label}
                  </Text>
                </View>
              ))}
            </RadioButton.Group>

            <TextInput
              label="Describe the problem *"
              value={formData.description}
              onChangeText={(value) => updateField('description', value)}
              mode="outlined"
              style={styles.textArea}
              multiline
              numberOfLines={4}
              placeholder="Please provide details about what happened, any symptoms, and current truck condition..."
            />

            <Text style={styles.sectionTitle}>Your Location</Text>
            <HelperText type="info" style={styles.locationHelp}>
              📍 Location is approximate. Accurate location will be provided upon request approval.
            </HelperText>
            
            <View style={styles.locationContainer}>
              <TextInput
                label="Search for your address"
                value={formData.location}
                onChangeText={(value) => updateField('location', value)}
                mode="outlined"
                style={styles.locationInput}
                placeholder="Enter an address or location"
                left={<TextInput.Icon icon="magnify" />}
              />
              {showSuggestions && (
                <Card style={styles.suggestionsCard}>
                  {locationSuggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionItem}
                      onPress={() => selectLocationSuggestion(suggestion)}
                    >
                      <MaterialIcons name="location-on" size={20} color={colors.textSecondary} />
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </Card>
              )}
            </View>

            <Button
              mode="outlined"
              onPress={getCurrentLocation}
              loading={locationLoading}
              style={styles.locationButton}
              icon="crosshairs-gps"
            >
              Use Current Location
            </Button>

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
              buttonColor={colors.error}
            >
              {loading ? 'Submitting Request...' : 'Request Emergency Help'}
            </Button>
          </Card.Content>
        </Card>
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
    padding: 16,
    paddingBottom: 40,
  },
  headerCard: {
    marginBottom: 16,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  headerText: {
    marginLeft: 16,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  formCard: {
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 16,
    color: colors.text,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingRight: 16,
  },
  issueIcon: {
    marginLeft: 8,
    marginRight: 8,
  },
  radioLabel: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  selectedLabel: {
    color: colors.primary,
    fontWeight: '500',
  },
  textArea: {
    marginTop: 16,
    marginBottom: 16,
  },
  locationHelp: {
    marginBottom: 8,
    fontSize: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  locationInput: {
    flex: 1,
  },
  locationButtons: {
    flexDirection: 'column',
    gap: 4,
  },
  locationButton: {
    height: 56,
    justifyContent: 'center',
    minWidth: 60,
    marginBottom: 20,
  },
  submitButton: {
    marginTop: 20,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  suggestionsCard: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 1000,
    maxHeight: 200,
    elevation: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
});