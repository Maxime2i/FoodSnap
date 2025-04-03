import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Gender } from '@/types/auth';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function OnboardingStep1() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const [gender, setGender] = useState<Gender>('male');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (!age || !height || !weight) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (isNaN(Number(age)) || isNaN(Number(height)) || isNaN(Number(weight))) {
      setError('Veuillez entrer des valeurs numériques valides');
      return;
    }

    router.push({
      pathname: '/(onboarding)/step2',
      params: {
        gender,
        age,
        height,
        weight,
      },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Informations de base</Text>
      
      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.genderContainer}>
        <Text style={styles.label}>Genre</Text>
        <View style={styles.genderButtons}>
          <TouchableOpacity
            style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
            onPress={() => setGender('male')}
          >
            <Text style={[styles.genderButtonText, gender === 'male' && styles.genderButtonTextActive]}>
              Homme
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]}
            onPress={() => setGender('female')}
          >
            <Text style={[styles.genderButtonText, gender === 'female' && styles.genderButtonTextActive]}>
              Femme
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderButton, gender === 'other' && styles.genderButtonActive]}
            onPress={() => setGender('other')}
          >
            <Text style={[styles.genderButtonText, gender === 'other' && styles.genderButtonTextActive]}>
              Autre
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Âge</Text>
        <TextInput
          style={styles.input}
          value={age}
          onChangeText={setAge}
          placeholder="Votre âge"
          keyboardType="number-pad"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Taille (cm)</Text>
        <TextInput
          style={styles.input}
          value={height}
          onChangeText={setHeight}
          placeholder="Votre taille en centimètres"
          keyboardType="number-pad"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Poids (kg)</Text>
        <TextInput
          style={styles.input}
          value={weight}
          onChangeText={setWeight}
          placeholder="Votre poids en kilogrammes"
          keyboardType="number-pad"
        />
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
    backgroundColor: Colors.light.background,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: Colors.light.text,
  },
  genderContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: Colors.light.text,
    fontWeight: '500',
  },
  genderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.light.buttonInactive,
    marginHorizontal: 5,
    alignItems: 'center',
    backgroundColor: Colors.light.buttonInactive,
  },
  genderButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  genderButtonText: {
    color: Colors.light.buttonTextInactive,
    fontSize: 16,
    fontWeight: '500',
  },
  genderButtonTextActive: {
    color: Colors.light.white,
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: Colors.light.white,
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: Colors.light.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: Colors.light.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  error: {
    color: Colors.light.error,
    marginBottom: 15,
    textAlign: 'center',
  },
}); 