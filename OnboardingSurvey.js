import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OnboardingSurvey = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal Info
    name: '',
    gender: '',
    age: '',
    weight: '',
    height: '',
    
    // Measurement System
    measurementSystem: 'metric', // 'metric' or 'imperial'
    
    // Activity & Lifestyle
    activityLevel: '',
    occupation: '', // 'sedentary', 'standing', 'physical'
    sleepHours: '',
    
    // Goals
    goal: '', // 'lose', 'gain', 'maintain'
    pace: '', // 'slow', 'moderate', 'fast'
    targetWeight: '',
    timeframe: '', // weeks to achieve goal
    
    // Health Considerations
    dietaryRestrictions: [], // array of restrictions
    healthConditions: [], // array of conditions
    exercisePreference: '', // 'cardio', 'strength', 'both', 'none'
    mealsPerDay: '3',
    
    // Motivation
    motivation: '', // primary motivation
    previousExperience: '', // 'yes' or 'no'
  });

  const updateFormData = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const convertToMetric = (weight, height, system) => {
    if (system === 'imperial') {
      // Convert lbs to kg and inches to cm
      return {
        weightKg: parseFloat(weight) * 0.453592,
        heightCm: parseFloat(height) * 2.54,
      };
    }
    return {
      weightKg: parseFloat(weight),
      heightCm: parseFloat(height),
    };
  };

  const toggleArrayItem = (array, item) => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    }
    return [...array, item];
  };

  const calculateBMR = () => {
    const { gender, age, weight, height, measurementSystem } = formData;
    
    // Mifflin-St Jeor Equation
    // BMR (men) = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) + 5
    // BMR (women) = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) - 161
    
    const { weightKg, heightCm } = convertToMetric(weight, height, measurementSystem);
    const ageYears = parseInt(age);
    
    let bmr;
    if (gender === 'male') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
    }
    
    return bmr;
  };

  const calculateTDEE = (bmr) => {
    const activityMultipliers = {
      sedentary: 1.2,      // Little or no exercise
      light: 1.375,        // Light exercise 1-3 days/week
      moderate: 1.55,      // Moderate exercise 3-5 days/week
      active: 1.725,       // Hard exercise 6-7 days/week
      veryActive: 1.9,     // Very hard exercise & physical job
    };
    
    let tdee = bmr * activityMultipliers[formData.activityLevel];
    
    // Adjust for occupation (NEAT - Non-Exercise Activity Thermogenesis)
    const occupationBonus = {
      sedentary: 0,       // Desk job
      standing: 50,       // Standing job (retail, teaching)
      physical: 150,      // Physical job (construction, nursing)
    };
    
    tdee += occupationBonus[formData.occupation] || 0;
    
    // Sleep adjustment (poor sleep can affect metabolism)
    const sleepHours = parseInt(formData.sleepHours);
    if (sleepHours < 6) {
      tdee *= 0.95; // 5% reduction for poor sleep
    } else if (sleepHours >= 8) {
      tdee *= 1.02; // 2% boost for optimal sleep
    }
    
    return tdee;
  };

  const calculateDailyCalories = () => {
    const bmr = calculateBMR();
    const tdee = calculateTDEE(bmr);
    
    // Calorie adjustments based on goal and pace
    const adjustments = {
      lose: {
        slow: -250,      // 0.5 lbs/week
        moderate: -500,  // 1 lb/week
        fast: -750,      // 1.5 lbs/week
      },
      gain: {
        slow: 250,       // 0.5 lbs/week
        moderate: 500,   // 1 lb/week
        fast: 750,       // 1.5 lbs/week
      },
      maintain: {
        slow: 0,
        moderate: 0,
        fast: 0,
      }
    };
    
    const adjustment = adjustments[formData.goal]?.[formData.pace] || 0;
    const dailyCalories = Math.round(tdee + adjustment);
    
    // Calculate macros (example distribution)
    const protein = Math.round((dailyCalories * 0.30) / 4); // 30% protein (4 cal/g)
    const carbs = Math.round((dailyCalories * 0.40) / 4);   // 40% carbs (4 cal/g)
    const fats = Math.round((dailyCalories * 0.30) / 9);    // 30% fats (9 cal/g)
    
    return {
      calories: dailyCalories,
      protein,
      carbs,
      fats,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
    };
  };

  const saveUserData = async (plan) => {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(formData));
      await AsyncStorage.setItem('userPlan', JSON.stringify(plan));
      console.log('User data saved successfully!');
    } catch (error) {
      console.error('Error saving user data:', error);
      Alert.alert('Error', 'Failed to save your data. Please try again.');
    }
  };

  const handleNext = () => {
    // Step 1: Disclaimer
    if (step === 1) {
      setStep(2);
      return;
    }
    
    // Step 2: Name & Measurement System
    if (step === 2) {
      if (!formData.name) {
        Alert.alert('Required', 'Please enter your name');
        return;
      }
      setStep(3);
      return;
    }
    
    // Step 3: Gender
    if (step === 3 && !formData.gender) {
      Alert.alert('Required', 'Please select your gender');
      return;
    }
    
    // Step 4: Basic Info (Age, Weight, Height)
    if (step === 4 && (!formData.age || !formData.weight || !formData.height)) {
      Alert.alert('Required', 'Please fill in all fields');
      return;
    }
    
    // Step 5: Activity Level
    if (step === 5 && !formData.activityLevel) {
      Alert.alert('Required', 'Please select your activity level');
      return;
    }
    
    // Step 6: Lifestyle (Occupation & Sleep)
    if (step === 6 && (!formData.occupation || !formData.sleepHours)) {
      Alert.alert('Required', 'Please answer all questions');
      return;
    }
    
    // Step 7: Goal
    if (step === 7 && !formData.goal) {
      Alert.alert('Required', 'Please select your goal');
      return;
    }
    
    // Step 8: Pace
    if (step === 8 && !formData.pace) {
      Alert.alert('Required', 'Please select your pace');
      return;
    }
    
    // Step 9: Target Weight
    if (step === 9 && formData.goal !== 'maintain' && !formData.targetWeight) {
      Alert.alert('Required', 'Please enter your target weight');
      return;
    }
    
    // Step 10: Exercise Preference
    if (step === 10 && !formData.exercisePreference) {
      Alert.alert('Required', 'Please select your exercise preference');
      return;
    }
    
    // Step 11: Dietary Restrictions (optional - can skip)
    // Step 12: Motivation
    if (step === 12 && !formData.motivation) {
      Alert.alert('Required', 'Please select your primary motivation');
      return;
    }
    
    if (step < 12) {
      setStep(step + 1);
    } else {
      // Calculate and save data
      const plan = calculateDailyCalories();
      saveUserData(plan);
      
      // Navigate to tracker
      navigation.navigate('CalorieTracker', { plan, userData: formData });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const renderDisclaimer = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>⚠️ Medical Disclaimer</Text>
      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerText}>
          This app is NOT a substitute for professional medical advice, diagnosis, or treatment.
        </Text>
        <Text style={styles.disclaimerText}>
          The calorie calculations and recommendations provided are general estimates and may not be suitable for everyone.
        </Text>
        <Text style={styles.disclaimerText}>
          Please consult with a doctor, registered dietitian, or qualified healthcare provider before starting any diet or exercise program.
        </Text>
        <Text style={styles.disclaimerText}>
          By continuing, you acknowledge that you understand this disclaimer.
        </Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>I Understand & Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderNameAndSystem = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Welcome! Let's get started</Text>
      <Text style={styles.subtitle}>Tell us a bit about yourself</Text>
      
      <Text style={styles.label}>Your Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your name"
        value={formData.name}
        onChangeText={(text) => updateFormData('name', text)}
      />

      <Text style={styles.label}>Measurement System</Text>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            styles.toggleButtonLeft,
            formData.measurementSystem === 'metric' && styles.toggleButtonActive
          ]}
          onPress={() => updateFormData('measurementSystem', 'metric')}
        >
          <Text style={[
            styles.toggleText,
            formData.measurementSystem === 'metric' && styles.toggleTextActive
          ]}>
            Metric (kg, cm)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            styles.toggleButtonRight,
            formData.measurementSystem === 'imperial' && styles.toggleButtonActive
          ]}
          onPress={() => updateFormData('measurementSystem', 'imperial')}
        >
          <Text style={[
            styles.toggleText,
            formData.measurementSystem === 'imperial' && styles.toggleTextActive
          ]}>
            Imperial (lbs, in)
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderGenderSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>What's your gender?</Text>
      <Text style={styles.subtitle}>This helps us calculate your BMR accurately</Text>
      
      <TouchableOpacity
        style={[styles.optionButton, formData.gender === 'male' && styles.optionButtonSelected]}
        onPress={() => updateFormData('gender', 'male')}
      >
        <Text style={[styles.optionText, formData.gender === 'male' && styles.optionTextSelected]}>
          Male
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.optionButton, formData.gender === 'female' && styles.optionButtonSelected]}
        onPress={() => updateFormData('gender', 'female')}
      >
        <Text style={[styles.optionText, formData.gender === 'female' && styles.optionTextSelected]}>
          Female
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderBasicInfo = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Tell us about yourself</Text>
      <Text style={styles.subtitle}>We need this to calculate your daily needs</Text>
      
      <Text style={styles.label}>Age (years)</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your age"
        keyboardType="numeric"
        value={formData.age}
        onChangeText={(text) => updateFormData('age', text)}
      />
      
      <Text style={styles.label}>
        Weight ({formData.measurementSystem === 'metric' ? 'kg' : 'lbs'})
      </Text>
      <TextInput
        style={styles.input}
        placeholder={`Enter your weight in ${formData.measurementSystem === 'metric' ? 'kg' : 'lbs'}`}
        keyboardType="numeric"
        value={formData.weight}
        onChangeText={(text) => updateFormData('weight', text)}
      />
      
      <Text style={styles.label}>
        Height ({formData.measurementSystem === 'metric' ? 'cm' : 'inches'})
      </Text>
      <TextInput
        style={styles.input}
        placeholder={`Enter your height in ${formData.measurementSystem === 'metric' ? 'cm' : 'inches'}`}
        keyboardType="numeric"
        value={formData.height}
        onChangeText={(text) => updateFormData('height', text)}
      />
    </View>
  );

  const renderActivityLevel = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>What's your activity level?</Text>
      <Text style={styles.subtitle}>Be honest - this affects your daily calorie needs</Text>
      
      {[
        { key: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
        { key: 'light', label: 'Lightly Active', desc: 'Light exercise 1-3 days/week' },
        { key: 'moderate', label: 'Moderately Active', desc: 'Moderate exercise 3-5 days/week' },
        { key: 'active', label: 'Very Active', desc: 'Hard exercise 6-7 days/week' },
        { key: 'veryActive', label: 'Extremely Active', desc: 'Very hard exercise & physical job' },
      ].map((option) => (
        <TouchableOpacity
          key={option.key}
          style={[styles.optionButton, formData.activityLevel === option.key && styles.optionButtonSelected]}
          onPress={() => updateFormData('activityLevel', option.key)}
        >
          <Text style={[styles.optionText, formData.activityLevel === option.key && styles.optionTextSelected]}>
            {option.label}
          </Text>
          <Text style={[styles.optionDesc, formData.activityLevel === option.key && styles.optionDescSelected]}>
            {option.desc}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderGoal = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>What's your goal?</Text>
      <Text style={styles.subtitle}>Choose what you want to achieve</Text>
      
      <TouchableOpacity
        style={[styles.optionButton, formData.goal === 'lose' && styles.optionButtonSelected]}
        onPress={() => updateFormData('goal', 'lose')}
      >
        <Text style={[styles.optionText, formData.goal === 'lose' && styles.optionTextSelected]}>
          Lose Weight
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.optionButton, formData.goal === 'gain' && styles.optionButtonSelected]}
        onPress={() => updateFormData('goal', 'gain')}
      >
        <Text style={[styles.optionText, formData.goal === 'gain' && styles.optionTextSelected]}>
          Gain Weight
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.optionButton, formData.goal === 'maintain' && styles.optionButtonSelected]}
        onPress={() => updateFormData('goal', 'maintain')}
      >
        <Text style={[styles.optionText, formData.goal === 'maintain' && styles.optionTextSelected]}>
          Maintain Weight
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderPace = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>How fast do you want to {formData.goal} weight?</Text>
      <Text style={styles.subtitle}>Slower is generally healthier and more sustainable</Text>
      
      <TouchableOpacity
        style={[styles.optionButton, formData.pace === 'slow' && styles.optionButtonSelected]}
        onPress={() => updateFormData('pace', 'slow')}
      >
        <Text style={[styles.optionText, formData.pace === 'slow' && styles.optionTextSelected]}>
          Slow & Steady
        </Text>
        <Text style={[styles.optionDesc, formData.pace === 'slow' && styles.optionDescSelected]}>
          ~0.5 lbs/week ({formData.goal === 'lose' ? '-250' : '+250'} cal/day)
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.optionButton, formData.pace === 'moderate' && styles.optionButtonSelected]}
        onPress={() => updateFormData('pace', 'moderate')}
      >
        <Text style={[styles.optionText, formData.pace === 'moderate' && styles.optionTextSelected]}>
          Moderate Pace
        </Text>
        <Text style={[styles.optionDesc, formData.pace === 'moderate' && styles.optionDescSelected]}>
          ~1 lb/week ({formData.goal === 'lose' ? '-500' : '+500'} cal/day)
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.optionButton, formData.pace === 'fast' && styles.optionButtonSelected]}
        onPress={() => updateFormData('pace', 'fast')}
      >
        <Text style={[styles.optionText, formData.pace === 'fast' && styles.optionTextSelected]}>
          Aggressive
        </Text>
        <Text style={[styles.optionDesc, formData.pace === 'fast' && styles.optionDescSelected]}>
          ~1.5 lbs/week ({formData.goal === 'lose' ? '-750' : '+750'} cal/day)
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderLifestyle = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Your Daily Lifestyle</Text>
      <Text style={styles.subtitle}>This helps us calculate your total daily energy</Text>
      
      <Text style={styles.label}>What's your occupation like?</Text>
      {[
        { key: 'sedentary', label: 'Desk Job', desc: 'Sitting most of the day' },
        { key: 'standing', label: 'Standing Job', desc: 'On your feet (retail, teaching)' },
        { key: 'physical', label: 'Physical Job', desc: 'Heavy labor (construction, nursing)' },
      ].map((option) => (
        <TouchableOpacity
          key={option.key}
          style={[styles.optionButton, formData.occupation === option.key && styles.optionButtonSelected]}
          onPress={() => updateFormData('occupation', option.key)}
        >
          <Text style={[styles.optionText, formData.occupation === option.key && styles.optionTextSelected]}>
            {option.label}
          </Text>
          <Text style={[styles.optionDesc, formData.occupation === option.key && styles.optionDescSelected]}>
            {option.desc}
          </Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.label}>Hours of sleep per night</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 7"
        keyboardType="numeric"
        value={formData.sleepHours}
        onChangeText={(text) => updateFormData('sleepHours', text)}
      />
      <Text style={styles.helperText}>Sleep affects your metabolism and recovery</Text>
    </View>
  );

  const renderTargetWeight = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>What's your target weight?</Text>
      <Text style={styles.subtitle}>
        {formData.goal === 'maintain' ? 'This helps us track your progress' : 'Having a specific goal helps with motivation'}
      </Text>
      
      <Text style={styles.label}>
        Target Weight ({formData.measurementSystem === 'metric' ? 'kg' : 'lbs'})
      </Text>
      <TextInput
        style={styles.input}
        placeholder={formData.goal === 'maintain' ? 'Current weight' : 'Your goal weight'}
        keyboardType="numeric"
        value={formData.targetWeight}
        onChangeText={(text) => updateFormData('targetWeight', text)}
      />

      {formData.goal !== 'maintain' && (
        <>
          <Text style={styles.label}>Expected timeframe (weeks)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 12"
            keyboardType="numeric"
            value={formData.timeframe}
            onChangeText={(text) => updateFormData('timeframe', text)}
          />
          <Text style={styles.helperText}>
            Be realistic - healthy weight change is gradual
          </Text>
        </>
      )}
    </View>
  );

  const renderExercisePreference = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Exercise Preference</Text>
      <Text style={styles.subtitle}>What type of exercise do you prefer or plan to do?</Text>
      
      {[
        { key: 'cardio', label: 'Cardio', desc: 'Running, cycling, swimming' },
        { key: 'strength', label: 'Strength Training', desc: 'Weightlifting, resistance training' },
        { key: 'both', label: 'Mix of Both', desc: 'Balanced cardio and strength' },
        { key: 'none', label: 'Little to None', desc: 'Diet focus only for now' },
      ].map((option) => (
        <TouchableOpacity
          key={option.key}
          style={[styles.optionButton, formData.exercisePreference === option.key && styles.optionButtonSelected]}
          onPress={() => updateFormData('exercisePreference', option.key)}
        >
          <Text style={[styles.optionText, formData.exercisePreference === option.key && styles.optionTextSelected]}>
            {option.label}
          </Text>
          <Text style={[styles.optionDesc, formData.exercisePreference === option.key && styles.optionDescSelected]}>
            {option.desc}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderDietaryRestrictions = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Dietary Restrictions</Text>
      <Text style={styles.subtitle}>Select any that apply (optional)</Text>
      
      {[
        'Vegetarian',
        'Vegan',
        'Gluten-Free',
        'Dairy-Free',
        'Nut Allergy',
        'Halal',
        'Kosher',
        'Low Carb',
        'Keto',
      ].map((restriction) => (
        <TouchableOpacity
          key={restriction}
          style={[
            styles.checkboxButton,
            formData.dietaryRestrictions.includes(restriction) && styles.checkboxButtonSelected
          ]}
          onPress={() => updateFormData('dietaryRestrictions', toggleArrayItem(formData.dietaryRestrictions, restriction))}
        >
          <View style={[
            styles.checkbox,
            formData.dietaryRestrictions.includes(restriction) && styles.checkboxChecked
          ]}>
            {formData.dietaryRestrictions.includes(restriction) && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </View>
          <Text style={styles.checkboxText}>{restriction}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMotivation = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>What's your main motivation?</Text>
      <Text style={styles.subtitle}>Understanding your "why" helps us support you better</Text>
      
      {[
        { key: 'health', label: 'Better Health', desc: 'Improve overall wellbeing' },
        { key: 'appearance', label: 'Look Better', desc: 'Feel more confident' },
        { key: 'performance', label: 'Athletic Performance', desc: 'Enhance fitness and strength' },
        { key: 'medical', label: 'Medical Reasons', desc: 'Doctor recommended' },
        { key: 'energy', label: 'More Energy', desc: 'Feel better day-to-day' },
        { key: 'social', label: 'Social/Event', desc: 'Wedding, reunion, vacation' },
      ].map((option) => (
        <TouchableOpacity
          key={option.key}
          style={[styles.optionButton, formData.motivation === option.key && styles.optionButtonSelected]}
          onPress={() => updateFormData('motivation', option.key)}
        >
          <Text style={[styles.optionText, formData.motivation === option.key && styles.optionTextSelected]}>
            {option.label}
          </Text>
          <Text style={[styles.optionDesc, formData.motivation === option.key && styles.optionDescSelected]}>
            {option.desc}
          </Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.label}>Have you tracked calories before?</Text>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            styles.toggleButtonLeft,
            formData.previousExperience === 'yes' && styles.toggleButtonActive
          ]}
          onPress={() => updateFormData('previousExperience', 'yes')}
        >
          <Text style={[
            styles.toggleText,
            formData.previousExperience === 'yes' && styles.toggleTextActive
          ]}>
            Yes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            styles.toggleButtonRight,
            formData.previousExperience === 'no' && styles.toggleButtonActive
          ]}
          onPress={() => updateFormData('previousExperience', 'no')}
        >
          <Text style={[
            styles.toggleText,
            formData.previousExperience === 'no' && styles.toggleTextActive
          ]}>
            No
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Step {step} of 12</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(step / 12) * 100}%` }]} />
          </View>
        </View>

        {step === 1 && renderDisclaimer()}
        {step === 2 && renderNameAndSystem()}
        {step === 3 && renderGenderSelection()}
        {step === 4 && renderBasicInfo()}
        {step === 5 && renderActivityLevel()}
        {step === 6 && renderLifestyle()}
        {step === 7 && renderGoal()}
        {step === 8 && renderPace()}
        {step === 9 && renderTargetWeight()}
        {step === 10 && renderExercisePreference()}
        {step === 11 && renderDietaryRestrictions()}
        {step === 12 && renderMotivation()}

        <View style={styles.navigationButtons}>
          {step > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          {step > 1 && (
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>
                {step === 12 ? 'Finish' : 'Next'}
              </Text>
            </TouchableOpacity>
          )}
          
          {step === 11 && (
            <TouchableOpacity style={styles.skipButton} onPress={handleNext}>
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  progressContainer: {
    marginBottom: 30,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  stepContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  disclaimerBox: {
    backgroundColor: '#fff3cd',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ffc107',
    marginBottom: 20,
  },
  disclaimerText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 12,
    lineHeight: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  optionButton: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  optionButtonSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e9',
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  optionTextSelected: {
    color: '#4CAF50',
  },
  optionDesc: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  optionDescSelected: {
    color: '#4CAF50',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    padding: 18,
    borderRadius: 12,
    marginRight: 10,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 18,
    borderRadius: 12,
    marginLeft: 10,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    padding: 14,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonLeft: {
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    borderRightWidth: 1,
  },
  toggleButtonRight: {
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderLeftWidth: 1,
  },
  toggleButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  toggleTextActive: {
    color: '#fff',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    fontStyle: 'italic',
  },
  checkboxButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  checkboxButtonSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#f1f8f4',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxText: {
    fontSize: 16,
    color: '#333',
  },
  skipButton: {
    position: 'absolute',
    top: -50,
    right: 0,
    padding: 10,
  },
  skipButtonText: {
    color: '#999',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default OnboardingSurvey;