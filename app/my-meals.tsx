import { StyleSheet, View, Text, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Image, ScrollView } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  foods: FoodItem[];
}

const MacroColors = {
  calories: '#FF6B6B',
  glucides: '#4a90e2',
  proteines: '#2ecc71',
  lipides: '#f1c40f',
};

export default function MyMealsScreen() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  
  const fetchMeals = async () => {
    if (!user) return;

    try {
      const { data: mealsData, error: mealsError } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (mealsError) throw mealsError;
      setMeals(mealsData || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des repas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMeals();
  }, [user]);

  const renderMeal = ({ item }: { item: Meal }) => (
    <TouchableOpacity 
      style={getStyles(colorScheme).card}
      onPress={() => router.push(`/meal-detail?id=${item.id}`)}
      activeOpacity={0.8}
    >
      <View style={getStyles(colorScheme).cardContent}>
        <View style={getStyles(colorScheme).titleContainer}>
          <View style={getStyles(colorScheme).headerRow}>
            <Text style={getStyles(colorScheme).cardTitle}>{item.name}</Text>
            <Text style={getStyles(colorScheme).timeText}>
              {format(new Date(item.created_at), 'HH:mm', { locale: fr })}
            </Text>
          </View>
        </View>
        
        {item.foods && item.foods.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={getStyles(colorScheme).foodsScroll}
          >
            {item.foods.map((food, index) => (
              <View key={index} style={getStyles(colorScheme).foodImageContainer}>
                <Image
                  source={{ uri: food.photo || 'https://d2eawub7utcl6.cloudfront.net/images/nix-apple-grey.png' }}
                  style={getStyles(colorScheme).foodImage}
                />
                <Text numberOfLines={1} style={getStyles(colorScheme).foodName}>
                  {food.name}
                </Text>
                <Text style={[getStyles(colorScheme).carbsText, { color: MacroColors.glucides }]}>
                  {food.carbs.toFixed(1)}g
                </Text>
              </View>
            ))}
          </ScrollView>
        )}

        <View style={getStyles(colorScheme).statsContainer}>
          <View style={getStyles(colorScheme).macrosContainer}>
            <Text style={[getStyles(colorScheme).totalCarbsText, { color: MacroColors.glucides }]}>
              Total glucides : {item.total_carbs.toFixed(1)}g
            </Text>
          </View>
          <TouchableOpacity 
            style={getStyles(colorScheme).voirButton}
            onPress={() => router.push(`/meal-detail?id=${item.id}`)}
          >
            <Text style={getStyles(colorScheme).voirText}>Voir</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.light.text} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={getStyles(colorScheme).container}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  if (meals.length === 0) {
    return (
      <View style={[getStyles(colorScheme).container, getStyles(colorScheme).emptyContainer]}>
        <View style={getStyles(colorScheme).header}>
          <TouchableOpacity onPress={() => router.back()} style={getStyles(colorScheme).backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={getStyles(colorScheme).title}>Mes Repas</Text>
          <View style={getStyles(colorScheme).backButton} />
        </View>
        <Text style={getStyles(colorScheme).emptyText}>Vous n'avez pas encore enregistré de repas</Text>
      </View>
    );
  }

  return (
    <View style={getStyles(colorScheme).container}>
      <View style={getStyles(colorScheme).header}>
        <TouchableOpacity onPress={() => router.back()} style={getStyles(colorScheme).backButton}>
          <Ionicons name="arrow-back" size={24} color={colorScheme === 'dark' ? Colors.dark.text : Colors.light.text} />
        </TouchableOpacity>
        <Text style={getStyles(colorScheme).title}>Mes Repas</Text>
        <View style={getStyles(colorScheme).backButton} />
      </View>
      <FlatList
        data={meals}
        renderItem={renderMeal}
        keyExtractor={(item) => item.id}
        contentContainerStyle={getStyles(colorScheme).list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.tint}
            colors={[Colors.light.tint]}
          />
        }
      />
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
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    textAlign: 'center',
  },
  list: {
    padding: 10,
  },
  card: {
    backgroundColor: colorScheme === 'dark' ? '#121212' : '#fff',
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
  },
  titleContainer: {
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colorScheme === 'dark' ? '#fff' : '#000',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  macrosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalCarbsText: {
    fontSize: 16,
    fontWeight: '600',
  },
  voirButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  voirText: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '600',
  },
  foodsScroll: {
    marginBottom: 12,
  },
  foodImageContainer: {
    marginRight: 12,
    alignItems: 'center',
    width: 60,
  },
  foodImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 4,
  },
  foodName: {
    fontSize: 12,
    color: colorScheme === 'dark' ? '#fff' : '#000',
    textAlign: 'center',
    width: '100%',
    marginBottom: 2,
  },
  carbsText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
