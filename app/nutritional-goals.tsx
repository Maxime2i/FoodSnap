import { StyleSheet, View, Text, Switch, TextInput, ScrollView, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';

type NutritionalGoal = {
  calories: {
    enabled: boolean;
    value: string;
  };
  proteins: {
    enabled: boolean;
    value: string;
  };
  carbs: {
    enabled: boolean;
    value: string;
  };
  fats: {
    enabled: boolean;
    value: string;
  };
  globalGoal: string;
};

export default function NutritionalGoalsScreen() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  const [goals, setGoals] = useState<NutritionalGoal>({
    calories: { enabled: false, value: '2000' },
    proteins: { enabled: false, value: '150' },
    carbs: { enabled: false, value: '250' },
    fats: { enabled: false, value: '70' },
    globalGoal: 'maintenance'
  });

  const fetchGoals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('calories, proteines, glucides, lipides, goal')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching goals:', error);
        throw error;
      }

      console.log("Received data:", data);

      if (data) {
        const newGoals = {
          calories: { 
            enabled: Boolean(data.calories), 
            value: data.calories ? data.calories.toString() : '2000' 
          },
          proteins: { 
            enabled: Boolean(data.proteines), 
            value: data.proteines ? data.proteines.toString() : '150' 
          },
          carbs: { 
            enabled: Boolean(data.glucides), 
            value: data.glucides ? data.glucides.toString() : '250' 
          },
          fats: { 
            enabled: Boolean(data.lipides), 
            value: data.lipides ? data.lipides.toString() : '70' 
          },
          globalGoal: data.goal || 'maintenance'
        };
        console.log("Setting new goals:", newGoals);
        setGoals(newGoals);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des objectifs:', error);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    if (user && initialLoad) {
      fetchGoals();
    }
  }, [user, initialLoad]);

  // Ajout d'un useEffect pour logger les changements de goals
  useEffect(() => {
    console.log("Goals updated:", goals);
  }, [goals]);

  const saveGoals = async () => {
    if (!user) return;
    setLoading(true);
    console.log("Saving goals:", goals);

    try {
      const updateData = {
        calories: goals.calories.enabled ? Math.max(0, parseInt(goals.calories.value) || 0) : 0,
        proteines: goals.proteins.enabled ? Math.max(0, parseInt(goals.proteins.value) || 0) : 0,
        glucides: goals.carbs.enabled ? Math.max(0, parseInt(goals.carbs.value) || 0) : 0,
        lipides: goals.fats.enabled ? Math.max(0, parseInt(goals.fats.value) || 0) : 0,
        goal: goals.globalGoal
      };
      console.log("Update data:", updateData);

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating goals:', error);
        throw error;
      }
      console.log("Save successful");
      router.back();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des objectifs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && initialLoad) {
    return (
      <View style={getStyles(colorScheme).container}>
        <Text style={getStyles(colorScheme).loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={getStyles(colorScheme).container}>
      <View style={getStyles(colorScheme).header}>
        <Text style={getStyles(colorScheme).title}>Objectifs Nutritionnels</Text>
      </View>

      <View style={getStyles(colorScheme).section}>
        <Text style={getStyles(colorScheme).sectionTitle}>Objectif Global</Text>
        <View style={getStyles(colorScheme).pickerContainer}>
          <Picker
            selectedValue={goals.globalGoal}
            onValueChange={(value) => setGoals(prev => ({ ...prev, globalGoal: value }))}
            style={getStyles(colorScheme).picker}
          >
            <Picker.Item label="Maintien du poids" value="maintenance" />
            <Picker.Item label="Perte de poids" value="weight_loss" />
            <Picker.Item label="Prise de muscle" value="muscle_gain" />
            <Picker.Item label="Amélioration de la santé" value="health_improvement" />
          </Picker>
        </View>
      </View>

      <View style={getStyles(colorScheme).section}>
        <Text style={getStyles(colorScheme).sectionTitle}>Calories (kcal)</Text>
        <View style={getStyles(colorScheme).goalItem}>
          <View style={getStyles(colorScheme).goalHeader}>
            <Text style={getStyles(colorScheme).goalLabel}>Activer l'objectif calorique</Text>
            <Switch
              value={goals.calories.enabled}
              onValueChange={(value) => setGoals(prev => ({
                ...prev,
                calories: { ...prev.calories, enabled: value }
              }))}
              trackColor={{ false: '#D1D1D6', true: '#4A90E2' }}
            />
          </View>
          {goals.calories.enabled && (
            <TextInput
              style={getStyles(colorScheme).input}
              value={goals.calories.value}
              onChangeText={(value) => setGoals(prev => ({
                ...prev,
                calories: { ...prev.calories, value }
              }))}
              keyboardType="numeric"
              placeholder="Objectif calorique quotidien"
              placeholderTextColor="#999"
            />
          )}
        </View>
      </View>

      <View style={getStyles(colorScheme).section}>
        <Text style={getStyles(colorScheme).sectionTitle}>Protéines (g)</Text>
        <View style={getStyles(colorScheme).goalItem}>
          <View style={getStyles(colorScheme).goalHeader}>
            <Text style={getStyles(colorScheme).goalLabel}>Activer l'objectif protéines</Text>
            <Switch
              value={goals.proteins.enabled}
              onValueChange={(value) => setGoals(prev => ({
                ...prev,
                proteins: { ...prev.proteins, enabled: value }
              }))}
              trackColor={{ false: '#D1D1D6', true: '#4A90E2' }}
            />
          </View>
          {goals.proteins.enabled && (
            <TextInput
              style={getStyles(colorScheme).input}
              value={goals.proteins.value}
              onChangeText={(value) => setGoals(prev => ({
                ...prev,
                proteins: { ...prev.proteins, value }
              }))}
              keyboardType="numeric"
              placeholder="Objectif protéines quotidien"
              placeholderTextColor="#999"
            />
          )}
        </View>
      </View>

      <View style={getStyles(colorScheme).section}>
        <Text style={getStyles(colorScheme).sectionTitle}>Glucides (g)</Text>
        <View style={getStyles(colorScheme).goalItem}>
          <View style={getStyles(colorScheme).goalHeader}>
            <Text style={getStyles(colorScheme).goalLabel}>Activer l'objectif glucides</Text>
            <Switch
              value={goals.carbs.enabled}
              onValueChange={(value) => setGoals(prev => ({
                ...prev,
                carbs: { ...prev.carbs, enabled: value }
              }))}
              trackColor={{ false: '#D1D1D6', true: '#4A90E2' }}
            />
          </View>
          {goals.carbs.enabled && (
            <TextInput
              style={getStyles(colorScheme).input}
              value={goals.carbs.value}
              onChangeText={(value) => setGoals(prev => ({
                ...prev,
                carbs: { ...prev.carbs, value }
              }))}
              keyboardType="numeric"
              placeholder="Objectif glucides quotidien"
              placeholderTextColor="#999"
            />
          )}
        </View>
      </View>

      <View style={getStyles(colorScheme).section}>
        <Text style={getStyles(colorScheme).sectionTitle}>Lipides (g)</Text>
        <View style={getStyles(colorScheme).goalItem}>
          <View style={getStyles(colorScheme).goalHeader}>
            <Text style={getStyles(colorScheme).goalLabel}>Activer l'objectif lipides</Text>
            <Switch
              value={goals.fats.enabled}
              onValueChange={(value) => setGoals(prev => ({
                ...prev,
                fats: { ...prev.fats, enabled: value }
              }))}
              trackColor={{ false: '#D1D1D6', true: '#4A90E2' }}
            />
          </View>
          {goals.fats.enabled && (
            <TextInput
              style={getStyles(colorScheme).input}
              value={goals.fats.value}
              onChangeText={(value) => setGoals(prev => ({
                ...prev,
                fats: { ...prev.fats, value }
              }))}
              keyboardType="numeric"
              placeholder="Objectif lipides quotidien"
              placeholderTextColor="#999"
            />
          )}
        </View>
      </View>

      <Pressable 
        style={[getStyles(colorScheme).saveButton, loading && getStyles(colorScheme).saveButtonDisabled]} 
        onPress={saveGoals}
        disabled={loading}
      >
        <Text style={getStyles(colorScheme).saveButtonText}>
          {loading ? 'Enregistrement...' : 'Enregistrer les objectifs'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colorScheme === 'dark' ? Colors.dark.buttonInactive : Colors.light.buttonInactive,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    marginBottom: 15,
  },
  goalItem: {
    marginBottom: 10,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  goalLabel: {
    fontSize: 16,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  input: {
    backgroundColor: colorScheme === 'dark' ? Colors.dark.buttonInactive : Colors.light.buttonInactive,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  pickerContainer: {
    backgroundColor: colorScheme === 'dark' ? Colors.dark.buttonInactive : Colors.light.buttonInactive,
    borderRadius: 8,
    marginTop: 5,
  },
  picker: {
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    padding: 15,
    borderRadius: 8,
    margin: 20,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    margin: 20,
  },
}); 