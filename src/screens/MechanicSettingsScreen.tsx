import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, TextInput, Chip, Switch, List } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { colors } from '../theme/theme';

const SPECIALTIES = [
  'Engine Repair',
  'Transmission',
  'Brakes',
  'Electrical',
  'Hydraulics',
  'Air Systems',
  'Tire Service',
  'Welding',
  'Diagnostics',
  'General Repair'
];

const SA_REGIONS = [
  { value: 'gauteng', label: 'Gauteng (Johannesburg, Pretoria)', area: 'Greater Johannesburg & Pretoria Area' },
  { value: 'western_cape', label: 'Western Cape (Cape Town)', area: 'Cape Town & Surrounding Areas' },
  { value: 'kwazulu_natal', label: 'KwaZulu-Natal (Durban)', area: 'Durban & Coastal Region' },
  { value: 'eastern_cape', label: 'Eastern Cape (Port Elizabeth)', area: 'Port Elizabeth & East London' },
  { value: 'free_state', label: 'Free State (Bloemfontein)', area: 'Central Free State Region' },
  { value: 'northern_cape', label: 'Northern Cape (Kimberley)', area: 'Northern Cape Mining Region' },
  { value: 'north_west', label: 'North West (Rustenburg)', area: 'Rustenburg & Mining Belt' },
  { value: 'limpopo', label: 'Limpopo (Polokwane)', area: 'Northern South Africa' },
  { value: 'mpumalanga', label: 'Mpumalanga (Nelspruit)', area: 'Eastern Highveld Region' }
];

export default function MechanicSettingsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [serviceRegions, setServiceRegions] = useState<string[]>([]);
  const [serviceArea, setServiceArea] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [serviceRadius, setServiceRadius] = useState('50');
  const [acceptOutsideArea, setAcceptOutsideArea] = useState(true);

  const toggleSpecialty = (specialty: string) => {
    setSpecialties(prev => 
      prev.includes(specialty) 
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  const toggleRegion = (regionValue: string) => {
    setServiceRegions(prev => 
      prev.includes(regionValue) 
        ? prev.filter(r => r !== regionValue)
        : [...prev, regionValue]
    );
  };

  const handleSave = async () => {
    if (serviceRegions.length === 0) {
      Alert.alert('Error', 'Please select at least one service region');
      return;
    }

    try {
      setLoading(true);
      
      // Create mechanic profile if it doesn't exist
      const mechanicData = {
        userId: user?.id,
        businessType: user?.businessType || 'individual',
        businessName: user?.businessName,
        specialties,
        serviceRegions,
        serviceRadius: parseInt(serviceRadius),
        isAvailable,
        acceptOutsideAreaNotifications: acceptOutsideArea,
        maxTravelDistance: parseInt(serviceRadius),
      };

      await (apiService as any).request('/mechanics', {
        method: 'POST',
        body: JSON.stringify(mechanicData),
      });

      Alert.alert('Success', 'Mechanic settings updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to update mechanic settings:', error);
      Alert.alert('Error', 'Failed to update settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Mechanic Settings</Text>
          
          {/* Availability */}
          <List.Item
            title="Available for Jobs"
            description="Toggle your availability for new breakdown requests"
            left={(props) => <List.Icon {...props} icon="account-check" />}
            right={() => (
              <Switch
                value={isAvailable}
                onValueChange={setIsAvailable}
                color={colors.secondary}
              />
            )}
          />
          
          {/* Service Radius */}
          <TextInput
            label="Service Radius (km)"
            value={serviceRadius}
            onChangeText={setServiceRadius}
            style={styles.input}
            mode="outlined"
            keyboardType="numeric"
            placeholder="50"
          />
          
          {/* Outside Area Notifications */}
          <List.Item
            title="Accept Outside Area Notifications"
            description="Receive notifications for jobs outside your selected cities"
            left={(props) => <List.Icon {...props} icon="bell-plus" />}
            right={() => (
              <Switch
                value={acceptOutsideArea}
                onValueChange={setAcceptOutsideArea}
                color={colors.secondary}
              />
            )}
          />
        </Card.Content>
      </Card>

      {/* Service Cities */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Service Regions</Text>
          <Text style={styles.sectionDescription}>
            Select the regions where you provide services
          </Text>
          
          <View style={styles.regionContainer}>
            {SA_REGIONS.map((region) => (
              <View key={region.value} style={styles.regionItem}>
                <Chip
                  selected={serviceRegions.includes(region.value)}
                  onPress={() => toggleRegion(region.value)}
                  style={[
                    styles.chip,
                    serviceRegions.includes(region.value) && styles.selectedChip
                  ]}
                  textStyle={serviceRegions.includes(region.value) && styles.selectedChipText}
                >
                  {region.label}
                </Chip>
                <Text style={styles.regionDescription}>{region.area}</Text>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Specialties */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Specialties</Text>
          <Text style={styles.sectionDescription}>
            Select your areas of expertise
          </Text>
          
          <View style={styles.chipContainer}>
            {SPECIALTIES.map((specialty) => (
              <Chip
                key={specialty}
                selected={specialties.includes(specialty)}
                onPress={() => toggleSpecialty(specialty)}
                style={[
                  styles.chip,
                  specialties.includes(specialty) && styles.selectedChip
                ]}
                textStyle={specialties.includes(specialty) && styles.selectedChipText}
              >
                {specialty}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Save Button */}
      <Button
        mode="contained"
        onPress={handleSave}
        loading={loading}
        style={styles.saveButton}
        buttonColor={colors.secondary}
      >
        Save Settings
      </Button>
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
    color: colors.secondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.primary,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 8,
  },
  selectedChip: {
    backgroundColor: colors.secondary,
  },
  selectedChipText: {
    color: 'white',
  },
  saveButton: {
    marginTop: 20,
    marginBottom: 20,
  },
  regionContainer: {
    marginTop: 8,
  },
  regionItem: {
    marginBottom: 12,
  },
  regionDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginLeft: 8,
  },
});