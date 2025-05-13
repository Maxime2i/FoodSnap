import { StyleSheet, View, Text, Image, ScrollView, ActivityIndicator, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import HeaderTitle from '@/components/headerTitle';
import NutritionTable from './components/NutritionTable';

interface FoodItem {
  name: string;
  quantity: number;
  calories: number;
  carbs: number;
  proteins: number;
  fats: number;
  glycemicImpact: number;
  photo?: string;
}

interface Meal {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  total_calories: number;
  total_carbs: number;
  total_proteins: number;
  total_fats: number;
  glycemic_index: number;
  glycemic_load: number;
  total_sugars: number;
  total_fibers: number;
  total_saturated_fats: number;
  foods: FoodItem[];
  photo_url?: string;
}

export default function MealDetailScreen() {
  const colorScheme = useColorScheme();
  const { id } = useLocalSearchParams();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchMealDetail();
  }, [id]);

  const fetchMealDetail = async () => {
    try {
      const { data: mealData, error: mealError } = await supabase
        .from('meals')
        .select('*')
        .eq('id', id)
        .single();

      if (mealError) throw mealError;
      setMeal(mealData);
    } catch (error) {
      console.error('Erreur lors de la récupération du repas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={getStyles(colorScheme).container}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  if (!meal) {
    return (
      <View style={getStyles(colorScheme).container}>
        <Text style={getStyles(colorScheme).errorText}>Repas non trouvé</Text>
      </View>
    );
  }

  return (
    <View style={getStyles(colorScheme).container}>
      <HeaderTitle title="Repas" showBackArrow/>

      <ScrollView style={getStyles(colorScheme).content}>
        {meal.photo_url && (
          <TouchableOpacity activeOpacity={0.8} onPress={() => setModalVisible(true)}>
            <Image
              source={{ uri: meal.photo_url }}
              style={{ width: Dimensions.get('window').width - 32, height: 200, borderRadius: 16, alignSelf: 'center', marginBottom: 20, resizeMode: 'cover' }}
            />
          </TouchableOpacity>
        )}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
        >
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <Image
              source={{ uri: meal?.photo_url }}
              style={{ width: Dimensions.get('window').width, height: Dimensions.get('window').height * 0.6, resizeMode: 'contain', borderRadius: 12 }}
            />
          </TouchableOpacity>
        </Modal>
        <View style={getStyles(colorScheme).mealHeader}>
          <Text style={getStyles(colorScheme).mealName}>{meal.name}</Text>
          <Text style={getStyles(colorScheme).mealTime}>
            {format(new Date(meal.created_at), 'HH:mm', { locale: fr })}
          </Text>
        </View>

        <View style={getStyles(colorScheme).foodsContainer}>
          {meal.foods.map((food, index) => (
            <View key={index} style={getStyles(colorScheme).foodItem}>
              <Image
                source={{ uri: food.photo || 'https://d2eawub7utcl6.cloudfront.net/images/nix-apple-grey.png' }}
                style={getStyles(colorScheme).foodImage}
              />
              <View style={getStyles(colorScheme).foodInfo}>
                <Text style={getStyles(colorScheme).foodName}>{food.name}</Text>
                <Text style={getStyles(colorScheme).carbsText}>{food.carbs.toFixed(1)}g glucides</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={getStyles(colorScheme).nutritionSummary}>
          <Text style={getStyles(colorScheme).sectionTitle}>Résumé nutritionnel</Text>
          <NutritionTable
            calories={meal.total_calories}
            glucides={meal.total_carbs}
            sucres={meal.total_sugars}
            fibres={meal.total_fibers}
            proteines={meal.total_proteins}
            lipides={meal.total_fats}
            satures={meal.total_saturated_fats}
            style={{ marginTop: 8 }}
          />
        </View>

       
      </ScrollView>
    </View>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  mealName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  mealTime: {
    fontSize: 16,
    color: '#666',
  },
  foodsContainer: {
    marginBottom: 20,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  foodImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    marginBottom: 4,
  },
  carbsText: {
    fontSize: 14,
    color: '#4a90e2',
    fontWeight: '500',
  },
  totalContainer: {
    backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  totalText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4a90e2',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
  nutritionSummary: {
    backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  nutritionTable: {
    backgroundColor: colorScheme === 'dark' ? '#222' : '#f8f8f8',
    borderRadius: 12,
    padding: 16,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee',
  },
  nutritionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    marginBottom: 12,
  },
}); 