import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { router, useFocusEffect } from 'expo-router';
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { useState, useCallback } from 'react';

interface SearchResult {
  food_name: string;
  tag_id: number;
  photo: {
    thumb: string;
  };
  serving_qty: number;
  serving_unit: string;
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
    calories: acc.calories + (meal.calories || 0),
    glucides: acc.glucides + (meal.glucides || 0),
    proteines: acc.proteines + (meal.proteines || 0),
    lipides: acc.lipides + (meal.lipides || 0),
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
        tag_id: 0,
        food_name: 'Erreur de connexion au serveur',
        photo: {
          thumb: 'https://d2eawub7utcl6.cloudfront.net/images/nix-apple-grey.png'
        },
        serving_qty: 0,
        serving_unit: ''
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

      <View style={getStyles(colorScheme).searchContainer}>
        <View style={getStyles(colorScheme).searchInputContainer}>
          <Ionicons name="search-outline" size={20} color={colorScheme === 'dark' ? Colors.dark.text : Colors.light.text} />
          <TextInput
            style={getStyles(colorScheme).searchInput}
            placeholder="Rechercher..."
            placeholderTextColor={colorScheme === 'dark' ? Colors.dark.text : Colors.light.text}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {isSearching && (
            <ActivityIndicator size="small" color="#4a90e2" />
          )}
        </View>
        {searchResults.length > 0 && (
          <View style={getStyles(colorScheme).searchResults}>
            {searchResults.map((result, index) => (
              <TouchableOpacity 
                key={result.tag_id + result.food_name || index}
                style={getStyles(colorScheme).searchResultItem}
                onPress={() => {
                  router.push({
                    pathname: '/food-details',
                    params: {
                      food_name: result.food_name,
                      photo_url: result.photo.thumb,
                      tag_id: result.tag_id.toString()
                    }
                  });
                  setSearchQuery('');
                  setSearchResults([]);
                }}
              >
                <View style={getStyles(colorScheme).searchResultContent}>
                  <Image 
                    source={{ uri: result.photo.thumb }} 
                    style={getStyles(colorScheme).searchResultImage} 
                  />
                  <View style={getStyles(colorScheme).searchResultTextContainer}>
                    <Text style={getStyles(colorScheme).searchResultText}>{result.food_name}</Text>
                    <Text style={getStyles(colorScheme).searchResultSubtext}>
                      {result.serving_qty} {result.serving_unit}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={getStyles(colorScheme).caloriesCard}>
        <View style={getStyles(colorScheme).caloriesHeader}>
          <Text style={getStyles(colorScheme).caloriesTitle}>Calories aujourd'hui </Text>
          <Text style={getStyles(colorScheme).caloriesTotal}>{totals.calories} / {goals.calories} kcal</Text>
        </View>

        <View style={getStyles(colorScheme).caloriesMain}>
          <Ionicons name="flame-outline" size={32} color="#ff9500" />
          <Text style={getStyles(colorScheme).caloriesValue}>{totals.calories}</Text>
        </View>

        <Text style={getStyles(colorScheme).caloriesRemaining}>{Math.max(goals.calories - totals.calories, 0)} kcal restantes</Text>

        <View style={getStyles(colorScheme).caloriesBar}>
          <LinearGradient
            colors={['#3498db', '#e8f4f8']}
            style={[getStyles(colorScheme).caloriesProgress, { width: `${Math.min((totals.calories / goals.calories) * 100, 100)}%` }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
        <View style={getStyles(colorScheme).caloriesRange}>
          <Text style={getStyles(colorScheme).caloriesRangeText}>{totals.calories} kcal</Text>
          <Text style={getStyles(colorScheme).caloriesRangeText}>{goals.calories} kcal</Text>
        </View>
      </View>

      <View style={getStyles(colorScheme).macrosSection}>
        <Text style={getStyles(colorScheme).macrosTitle}>Macronutriments</Text>
        <View style={getStyles(colorScheme).macrosGrid}>
          <View style={getStyles(colorScheme).macroCard}>
            <View style={[getStyles(colorScheme).macroIcon, { backgroundColor: '#e8f0ff' }]}>
              <Ionicons name="pizza-outline" size={24} color="#4a90e2" />
            </View>
            <Text style={getStyles(colorScheme).macroLabel}>Glucides</Text>
            <Text style={getStyles(colorScheme).macroValue}>{totals.glucides}g</Text>
            <Text style={getStyles(colorScheme).macroGoal}>sur {goals.glucides}g</Text>
          </View>

          <View style={getStyles(colorScheme).macroCard}>
            <View style={[getStyles(colorScheme).macroIcon, { backgroundColor: '#e8fff0' }]}>
              <Ionicons name="fish-outline" size={24} color="#2ecc71" />
            </View>
            <Text style={getStyles(colorScheme).macroLabel}>Protéines</Text>
            <Text style={getStyles(colorScheme).macroValue}>{totals.proteines}g</Text>
            <Text style={getStyles(colorScheme).macroGoal}>sur {goals.proteines}g</Text>
          </View>

          <View style={getStyles(colorScheme).macroCard}>
            <View style={[getStyles(colorScheme).macroIcon, { backgroundColor: '#fff8e8' }]}>
              <Ionicons name="water-outline" size={24} color="#f1c40f" />
            </View>
            <Text style={getStyles(colorScheme).macroLabel}>Lipides</Text>
            <Text style={getStyles(colorScheme).macroValue}>{totals.lipides}g</Text>
            <Text style={getStyles(colorScheme).macroGoal}>sur {goals.lipides}g</Text>
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
          <View key={meal.id} style={getStyles(colorScheme).mealCard}>
            <Image source={{ uri: meal.photo_url }} style={getStyles(colorScheme).mealIcon} />
            <View style={getStyles(colorScheme).mealInfo}>
              <Text style={getStyles(colorScheme).mealTitle}>{meal.name}</Text>
              <Text style={getStyles(colorScheme).mealDetailsText}>
                {format(new Date(meal.created_at), 'HH:mm', { locale: fr })} • {meal.calories} kcal
              </Text>
            </View>
            <View style={getStyles(colorScheme).macroColumn}>
              <Text style={[getStyles(colorScheme).macroValue, { color: '#4a90e2' }]}>{meal.glucides}g G</Text>
              <Text style={[getStyles(colorScheme).macroValue, { color: '#2ecc71' }]}>{meal.proteines}g P</Text>
              <Text style={[getStyles(colorScheme).macroValue, { color: '#f1c40f' }]}>{meal.lipides}g L</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity style={getStyles(colorScheme).addMealButton} onPress={() => router.push('/capture')}>
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
  caloriesCard: {
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
  caloriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caloriesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  caloriesTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  caloriesMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  caloriesValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    marginLeft: 16,
  },
  caloriesRemaining: {
    fontSize: 16,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    marginTop: 4,
  },
  caloriesBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    marginTop: 20,
  },
  caloriesProgress: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
  },
  caloriesRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  caloriesRangeText: {
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
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  mealIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    marginRight: 16,
  },
  mealInfo: {
    flex: 1,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  mealDetails: {
    fontSize: 14,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  glucoseChange: {
    fontSize: 16,
    fontWeight: '600',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
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
  mealDetailsText: {
    fontSize: 14,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
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
});
