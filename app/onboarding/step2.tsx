import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { GoalType } from '@/types/auth';

export default function OnboardingStep2() {
  const params = useLocalSearchParams();
  const [goal, setGoal] = useState<GoalType>('maintenance');
  const [allergies, setAllergies] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [error, setError] = useState<string | null>(null);

  const goals: { value: GoalType; label: string }[] = [
    { value: 'weight_loss', label: 'Perte de poids' },
    { value: 'muscle_gain', label: 'Prise de muscle' },
    { value: 'maintenance', label: 'Maintien du poids' },
    { value: 'health_improvement', label: 'Amélioration de la santé' },
  ];

  const handleNext = () => {
    router.push({
      pathname: '/onboarding/step3',
      params: {
        ...params,
        goal,
        allergies: allergies.split(',').map(a => a.trim()).filter(Boolean),
        medical_conditions: medicalConditions.split(',').map(m => m.trim()).filter(Boolean),
      },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Objectifs et Santé</Text>
      
      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.section}>
        <Text style={styles.label}>Votre objectif principal</Text>
        <View style={styles.goalButtons}>
          {goals.map((g) => (
            <TouchableOpacity
              key={g.value}
              style={[styles.goalButton, goal === g.value && styles.goalButtonActive]}
              onPress={() => setGoal(g.value)}
            >
              <Text style={[styles.goalButtonText, goal === g.value && styles.goalButtonTextActive]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Allergies</Text>
        <TextInput
          style={styles.input}
          value={allergies}
          onChangeText={setAllergies}
          placeholder="Séparez vos allergies par des virgules"
          multiline
        />
        <Text style={styles.hint}>Ex: arachides, fruits de mer, lactose</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Conditions médicales</Text>
        <TextInput
          style={styles.input}
          value={medicalConditions}
          onChangeText={setMedicalConditions}
          placeholder="Séparez vos conditions médicales par des virgules"
          multiline
        />
        <Text style={styles.hint}>Ex: diabète, hypertension</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>Suivant</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: Colors.text,
  },
  section: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: Colors.text,
    fontWeight: '500',
  },
  goalButtons: {
    gap: 10,
  },
  goalButton: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  goalButtonActive: {
    backgroundColor: Colors.primary,
  },
  goalButtonText: {
    color: Colors.primary,
    fontSize: 16,
  },
  goalButtonTextActive: {
    color: Colors.white,
  },
  input: {
    backgroundColor: Colors.white,
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 5,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  error: {
    color: Colors.error,
    marginBottom: 15,
    textAlign: 'center',
  },
}); 