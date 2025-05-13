import { StyleSheet, View, Text, Switch, TextInput, ScrollView, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';
import HeaderTitle from '@/components/headerTitle';

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

const macroMeta = {
  calories: { label: 'Calories', icon: '🔥', color: '#FF9800', placeholder: 'Objectif calorique quotidien', unit: 'kcal' },
  proteins: { label: 'Protéines', icon: '🍗', color: '#4CAF50', placeholder: 'Objectif protéines quotidien', unit: 'g' },
  carbs: { label: 'Glucides', icon: '🍞', color: '#2196F3', placeholder: 'Objectif glucides quotidien', unit: 'g' },
  fats: { label: 'Lipides', icon: '🥑', color: '#9C27B0', placeholder: 'Objectif lipides quotidien', unit: 'g' },
};

function MacroItem({
  type,
  enabled,
  value,
  onToggle,
  onChange,
  colorScheme
}: {
  type: keyof typeof macroMeta;
  enabled: boolean;
  value: string;
  onToggle: (v: boolean) => void;
  onChange: (v: string) => void;
  colorScheme: 'light' | 'dark';
}) {
  const meta = macroMeta[type];
  return (
    <View style={[getStyles(colorScheme).macroItem, { borderColor: meta.color }]}>  
      <View style={getStyles(colorScheme).macroHeader}>
        <Text style={[getStyles(colorScheme).macroIcon, { color: meta.color }]}>{meta.icon}</Text>
        <Text style={getStyles(colorScheme).macroLabel}>{meta.label}</Text>
      </View>
      <View style={getStyles(colorScheme).macroSwitchContainer}>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: '#D1D1D6', true: meta.color }}
        />
      </View>
      {enabled && (
        <TextInput
          style={getStyles(colorScheme).macroInput}
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          placeholder={meta.placeholder}
          placeholderTextColor="#999"
        />
      )}
    </View>
  );
}

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


  const saveGoals = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const updateData = {
        calories: goals.calories.enabled ? Math.max(0, parseInt(goals.calories.value) || 0) : 0,
        proteines: goals.proteins.enabled ? Math.max(0, parseInt(goals.proteins.value) || 0) : 0,
        glucides: goals.carbs.enabled ? Math.max(0, parseInt(goals.carbs.value) || 0) : 0,
        lipides: goals.fats.enabled ? Math.max(0, parseInt(goals.fats.value) || 0) : 0,
        goal: goals.globalGoal
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating goals:', error);
        throw error;
      }

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
      <HeaderTitle title="Objectifs nutritionnels" showBackArrow/>

      {/* Objectif global */}
      <View style={getStyles(colorScheme).card}>
        <Text style={getStyles(colorScheme).sectionTitle}>Objectif global</Text>
        <View style={getStyles(colorScheme).pickerContainerCard}>
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

      {/* Macros */}
      <View style={getStyles(colorScheme).card}>
        <Text style={getStyles(colorScheme).sectionTitle}>Macros</Text>
        <View style={getStyles(colorScheme).macrosGrid}>
          <MacroItem
            type="calories"
            enabled={goals.calories.enabled}
            value={goals.calories.value}
            onToggle={value => setGoals(prev => ({ ...prev, calories: { ...prev.calories, enabled: value } }))}
            onChange={value => setGoals(prev => ({ ...prev, calories: { ...prev.calories, value } }))}
            colorScheme={colorScheme}
          />
          <MacroItem
            type="proteins"
            enabled={goals.proteins.enabled}
            value={goals.proteins.value}
            onToggle={value => setGoals(prev => ({ ...prev, proteins: { ...prev.proteins, enabled: value } }))}
            onChange={value => setGoals(prev => ({ ...prev, proteins: { ...prev.proteins, value } }))}
            colorScheme={colorScheme}
          />
          <MacroItem
            type="carbs"
            enabled={goals.carbs.enabled}
            value={goals.carbs.value}
            onToggle={value => setGoals(prev => ({ ...prev, carbs: { ...prev.carbs, enabled: value } }))}
            onChange={value => setGoals(prev => ({ ...prev, carbs: { ...prev.carbs, value } }))}
            colorScheme={colorScheme}
          />
          <MacroItem
            type="fats"
            enabled={goals.fats.enabled}
            value={goals.fats.value}
            onToggle={value => setGoals(prev => ({ ...prev, fats: { ...prev.fats, enabled: value } }))}
            onChange={value => setGoals(prev => ({ ...prev, fats: { ...prev.fats, value } }))}
            colorScheme={colorScheme}
          />
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
  card: {
    backgroundColor: colorScheme === 'dark' ? Colors.dark.card : '#FFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  pickerContainerCard: {
    backgroundColor: colorScheme === 'dark' ? Colors.dark.buttonInactive : Colors.light.buttonInactive,
    borderRadius: 8,
    marginTop: 5,
    paddingHorizontal: 8,
  },
  picker: {
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  macrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  macroItem: {
    width: '48%',
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.buttonInactive : '#F7F7F7',
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
    justifyContent: 'center',
  },
  macroIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  macroLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  macroSwitchContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  macroInput: {
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : '#FFF',
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    borderWidth: 1,
    borderColor: '#DDD',
    marginTop: 4,
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