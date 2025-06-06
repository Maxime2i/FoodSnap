import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { router, useFocusEffect } from 'expo-router';
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { useState, useCallback } from 'react';
import React from 'react';
import SearchBar from '../components/SearchBar';
import MealCard from '@/components/mealCard';

interface SearchResult {
  foods: {
    food_name: string;
    tags: {
      tag_id: number;
    };
    photo: {
      thumb: string;
    };
    serving_qty: number;
    serving_unit: string;
  }[];
}

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

export default function HomeScreen() {
  const { user, refreshUser } = useAuth();
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const currentDate = new Date();
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  };
  const formattedDate = currentDate.toLocaleDateString('fr-FR', options);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      await refreshUser();
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des données:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Recharger les données quand l'écran redevient actif
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [user])
  );

  // Calculer le total des calories et macronutriments pour aujourd'hui
  const todayMeals = user?.meals?.filter(meal => {
    const mealDate = new Date(meal.created_at);
    return mealDate.toDateString() === currentDate.toDateString();
  }) || [];

  const totals = todayMeals.reduce((acc, meal) => ({
    calories: acc.calories + (meal.total_calories || 0),
    glucides: acc.glucides + (meal.total_carbs || 0),
    proteines: acc.proteines + (meal.total_proteins || 0),
    lipides: acc.lipides + (meal.total_fats || 0),
  }), { calories: 0, glucides: 0, proteines: 0, lipides: 0 });

  const goals = {
    calories: 2000,
    glucides: 250,
    proteines: 120,
    lipides: 65
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await fetch(`https://food-snap.vercel.app/api/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data.common || []);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setSearchResults([{
        foods: [{
          tags: {
            tag_id: 0,
          },
          food_name: 'Erreur de connexion au serveur',
          photo: {
            thumb: 'https://d2eawub7utcl6.cloudfront.net/images/nix-apple-grey.png'
          },
          serving_qty: 0,
          serving_unit: ''
        }],
      }]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <ScrollView style={getStyles(colorScheme).container}>
      <View style={getStyles(colorScheme).header}>
        <Text style={getStyles(colorScheme).greeting}>Bonjour, {user?.first_name || 'Utilisateur'}</Text>
        <Text style={getStyles(colorScheme).date}>{formattedDate}</Text>
      </View>

      <SearchBar
        colorScheme={colorScheme}
        getStyles={getStyles}
        onResultSelect={(result) => {
          router.push({
            pathname: '/food-details',
            params: {
              food_name: result.foods[0].food_name,
              photo_url: result.foods[0].photo.thumb,
              tag_id: result.foods[0].tags.tag_id.toString(),
            },
          });
        }}
      />

      <View style={getStyles(colorScheme).carbsCard}>
        <View style={getStyles(colorScheme).carbsHeader}>
          <Text style={getStyles(colorScheme).carbsTitle}>Glucides aujourd'hui </Text>
          {(user?.glucides || 0) > 0 ? (
            <Text style={getStyles(colorScheme).carbsTotal}>{totals.glucides.toFixed(1)} / {user?.glucides?.toFixed(1)}g</Text>
          ) : null}
        </View>

        <View style={getStyles(colorScheme).carbsMain}>
          <Ionicons name="pizza-outline" size={32} color="#4a90e2" />
          <Text style={getStyles(colorScheme).carbsValue}>{totals.glucides.toFixed(1)}g</Text>
        </View>

        {(user?.glucides || 0) > 0 ? (
          <>
            <Text style={getStyles(colorScheme).carbsRemaining}>{Math.max((user?.glucides || 0) - totals.glucides, 0).toFixed(1)}g restants</Text>

            <View style={getStyles(colorScheme).carbsBar}>
              <LinearGradient
                colors={['#4a90e2', '#e8f4f8']}
                style={[getStyles(colorScheme).carbsProgress, { width: `${parseFloat(Math.min((totals.glucides / (user?.glucides || 1)) * 100, 100).toFixed(1))}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <View style={getStyles(colorScheme).carbsRange}>
              <Text style={getStyles(colorScheme).carbsRangeText}>{totals.glucides.toFixed(1)}g</Text>
              <Text style={getStyles(colorScheme).carbsRangeText}>{user?.glucides?.toFixed(1)}g</Text>
            </View>
          </>
        ) : (
          <TouchableOpacity 
            style={getStyles(colorScheme).setObjectiveButton}
            onPress={() => router.push('/nutritional-goals')}
          >
            <Text style={getStyles(colorScheme).setObjectiveText}>Définir un objectif</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={getStyles(colorScheme).macrosSection}>
        <Text style={getStyles(colorScheme).macrosTitle}>Macronutriments</Text>
        <View style={getStyles(colorScheme).macrosGrid}>
          <View style={getStyles(colorScheme).macroCard}>
            <View style={[getStyles(colorScheme).macroIcon, { backgroundColor: '#fff8e8' }]}>
              <Ionicons name="flame-outline" size={24} color="#ff9500" />
            </View>
            <Text style={getStyles(colorScheme).macroLabel}>Calories</Text>
            <Text style={getStyles(colorScheme).macroValue}>{totals.calories.toFixed(1)}kcal</Text>
            {user?.calories && <Text style={getStyles(colorScheme).macroGoal}>sur {user?.calories?.toFixed(1)}kcal</Text>}
          </View>

          <View style={getStyles(colorScheme).macroCard}>
            <View style={[getStyles(colorScheme).macroIcon, { backgroundColor: '#e8fff0' }]}>
              <Ionicons name="fish-outline" size={24} color="#2ecc71" />
            </View>
            <Text style={getStyles(colorScheme).macroLabel}>Protéines</Text>
            <Text style={getStyles(colorScheme).macroValue}>{totals.proteines.toFixed(1)}g</Text>
            {user?.proteines && <Text style={getStyles(colorScheme).macroGoal}>sur {user?.proteines?.toFixed(1)}g</Text>}
          </View>

          <View style={getStyles(colorScheme).macroCard}>
            <View style={[getStyles(colorScheme).macroIcon, { backgroundColor: '#fff8e8' }]}>
              <Ionicons name="water-outline" size={24} color="#f1c40f" />
            </View>
            <Text style={getStyles(colorScheme).macroLabel}>Lipides</Text>
            <Text style={getStyles(colorScheme).macroValue}>{totals.lipides.toFixed(1)}g</Text>
            {user?.lipides && <Text style={getStyles(colorScheme).macroGoal}>sur {user?.lipides?.toFixed(1)}g</Text>}
          </View>
        </View>
      </View>

      <View style={getStyles(colorScheme).mealsSection}>
        <View style={getStyles(colorScheme).sectionHeader}>
          <Text style={getStyles(colorScheme).sectionTitle}>Repas récents</Text>
          <TouchableOpacity onPress={() => router.push('/my-meals')}>
            <Text style={getStyles(colorScheme).seeAll}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        {user?.meals?.slice(0, 2).map((meal) => (
          <MealCard
            meal={meal}
            key={meal.id}
        />
        ))}

        <TouchableOpacity style={getStyles(colorScheme).addMealButton} onPress={() => router.push({
                pathname: '/create-meal',
               
              })}>
          <Ionicons name="add" size={24} color="#4a90e2" />
          <Text style={getStyles(colorScheme).addMealText}>Ajouter un repas</Text>
        </TouchableOpacity>
      </View>
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
    paddingTop: 40,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  date: {
    fontSize: 16,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    marginTop: 4,
  },
  carbsCard: {
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  carbsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  carbsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  carbsTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  carbsMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  carbsValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    marginLeft: 16,
  },
  carbsRemaining: {
    fontSize: 16,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    marginTop: 4,
  },
  carbsBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    marginTop: 20,
  },
  carbsProgress: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
  },
  carbsRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  carbsRangeText: {
    fontSize: 14,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  macrosSection: {
    padding: 16,
  },
  macrosTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    marginBottom: 16,
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroCard: {
    flex: 1,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  macroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  macroLabel: {
    fontSize: 14,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    marginBottom: 4,
  },
  macroColumn: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginLeft: 'auto',
    gap: 4,
  },
  macroValue: {
    fontSize: 12,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    fontWeight: '500',
  },
  macroGoal: {
    fontSize: 14,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    textAlign: 'center',
  },
  mealsSection: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  seeAll: {
    fontSize: 14,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  mealCard: {
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  mealInfo: {
    flex: 1,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  mealTime: {
    fontSize: 14,
    color: '#666',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caloriesText: {
    fontSize: 16,
    fontWeight: '500',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  macrosGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? Colors.dark.buttonInactive : Colors.light.buttonInactive,
    borderStyle: 'dashed',
  },
  addMealText: {
    fontSize: 16,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    marginLeft: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  searchResults: {
    position: 'absolute',
    top: '100%',
    left: 20,
    right: 20,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    borderRadius: 12,
    marginTop: 4,
    shadowColor: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colorScheme === 'dark' ? Colors.dark.buttonInactive : Colors.light.buttonInactive,
  },
  searchResultContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchResultImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  searchResultTextContainer: {
    flex: 1,
  },
  searchResultText: {
    fontSize: 16,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  searchResultSubtext: {
    fontSize: 14,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    opacity: 0.7,
  },
  setObjectiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? Colors.dark.buttonInactive : Colors.light.buttonInactive,
    borderStyle: 'dashed',
  },
  setObjectiveText: {
    fontSize: 16,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
});
