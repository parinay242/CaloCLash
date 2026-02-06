import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingSurvey from './OnboardingSurvey';
import CalorieTracker from './CalorieTracker';
import ProfileScreen from './ProfileScreen';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('OnboardingSurvey');
  const [userData, setUserData] = useState(null);
  const [userPlan, setUserPlan] = useState(null);

  useEffect(() => {
    checkUserData();
  }, []);

  const checkUserData = async () => {
    try {
      const savedUserData = await AsyncStorage.getItem('userData');
      const savedPlan = await AsyncStorage.getItem('userPlan');
      
      if (savedUserData && savedPlan) {
        // User has completed onboarding, go straight to tracker
        setUserData(JSON.parse(savedUserData));
        setUserPlan(JSON.parse(savedPlan));
        setInitialRoute('CalorieTracker');
      } else {
        // New user, show onboarding
        setInitialRoute('OnboardingSurvey');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          cardStyle: { flex: 1 },
        }}
      >
        <Stack.Screen 
          name="OnboardingSurvey" 
          component={OnboardingSurvey} 
        />
        <Stack.Screen 
          name="CalorieTracker" 
          component={CalorieTracker}
          initialParams={{ plan: userPlan, userData: userData }}
        />
        <Stack.Screen 
          name="ProfileScreen" 
          component={ProfileScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});