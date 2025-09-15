import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Try importing components one by one to isolate the issue
console.log('🔧 Starting app debug...');

// Test 1: Basic React Native components
export default function App() {
  console.log('✅ App component rendering...');
  
  React.useEffect(() => {
    console.log('✅ useEffect running...');
    
    // Test if we can access device features
    try {
      console.log('✅ Testing basic device access...');
      Alert.alert('Debug', 'App started successfully!');
    } catch (error) {
      console.error('❌ Device access error:', error);
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔧 Debug Mode</Text>
      <Text style={styles.subtitle}>Breakdown Buddy</Text>
      <Text style={styles.info}>Check console for debug info</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#e63946',
  },
  subtitle: {
    fontSize: 20,
    marginBottom: 20,
    color: '#333',
  },
  info: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});