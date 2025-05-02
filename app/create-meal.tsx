import React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import HeaderTitle from '@/components/headerTitle';

interface SearchResult {
  food_name: string;
  tag_id: number;
  photo: {
    thumb: string;
  };
  serving_qty: number;
  serving_unit: string;
}

type FoodItem = {
  name: string;
  quantity: number;
  calories: number;
  carbs: number;
  proteins: number;
  fats: number;
  glycemicImpact: number;
  photo?: string;
};

export default function CreateMealScreen() {
  const { initial_food } = useLocalSearchParams();
  const [mealName, setMealName] = useState('Nouveau repas');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [foods, setFoods] = useState<FoodItem[]>(() => {
    if (initial_food) {
      try {
        const parsedFood = JSON.parse(initial_food as string);
        return [parsedFood];
      } catch (e) {
        console.error('Erreur lors du parsing de l\'aliment initial:', e);
        return [];
      }
    }
    return [];
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 3) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await fetch(`https://food-snap.vercel.app/api/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults((data.common || []).slice(0, 5));
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectFood = async (result: SearchResult) => {
    try {
      const response = await fetch(`https://food-snap.vercel.app/api/food-info?query=${result.food_name}`);
      const data = await response.json();
      const food = data.foods[0];
      const ig = data.index_glycemique?.ig || 0;

      if (food) {
        const newFood: FoodItem = {
          name: food.food_name,
          quantity: food.serving_weight_grams || 100,
          calories: food.nf_calories || 0,
          carbs: food.nf_total_carbohydrate || 0,
          proteins: food.nf_protein || 0,
          fats: food.nf_total_fat || 0,
          glycemicImpact: (food.nf_total_carbohydrate || 0) * ig / 100,
          photo: food.photo?.thumb || result.photo.thumb
        };

        setFoods(prev => [...prev, newFood]);
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des détails:', error);
    }
  };

  const handleRemoveFood = (index: number) => {
    setFoods(prev => prev.filter((_, i) => i !== index));
  };

  // Calculer le résumé nutritionnel
  const nutritionSummary = foods.reduce((acc, food) => ({
    calories: Number((acc.calories + food.calories).toFixed(2)),
    carbs: Number((acc.carbs + food.carbs).toFixed(2)),
    proteins: Number((acc.proteins + food.proteins).toFixed(2)),
    fats: Number((acc.fats + food.fats).toFixed(2)),
  }), {
    calories: 0,
    carbs: 0,
    proteins: 0,
    fats: 0,
  });

  // Calculer l'index glycémique moyen pondéré et la charge glycémique totale
  const glycemicSummary = foods.reduce((acc, food) => {
    // Si pas de glucides, on ignore cet aliment dans le calcul de l'IG moyen
    if (food.carbs <= 0) return acc;

    const totalCarbs = nutritionSummary.carbs;
    if (totalCarbs <= 0) return acc;

    const foodCarbsWeight = food.carbs / totalCarbs; // Poids des glucides de cet aliment
    const foodIG = food.glycemicImpact > 0 ? (food.glycemicImpact * 100) / food.carbs : 0; // IG de l'aliment

    return {
      weightedIG: Number((acc.weightedIG + (foodIG * foodCarbsWeight)).toFixed(1)),
      glycemicLoad: Number((acc.glycemicLoad + (food.carbs * foodIG / 100)).toFixed(1)),
    };
  }, {
    weightedIG: 0,
    glycemicLoad: 0,
  });

  const getGlycemicImpactLevel = (value: number, type: 'ig' | 'cg') => {
    if (type === 'ig') {
      if (value <= 55) return { text: 'Faible', color: '#4CAF50' };
      if (value <= 70) return { text: 'Moyen', color: '#FFC107' };
      return { text: 'Élevé', color: '#FF5722' };
    } else {
      if (value <= 10) return { text: 'Faible', color: '#4CAF50' };
      if (value <= 20) return { text: 'Moyenne', color: '#FFC107' };
      return { text: 'Élevée', color: '#FF5722' };
    }
  };

  const handleSaveMeal = async () => {
    if (foods.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins un aliment au repas.');
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Erreur', 'Vous devez être connecté pour enregistrer un repas.');
        return;
      }

      console.log('Tentative d\'enregistrement avec les données:', {
        user_id: user.id,
        name: mealName,
        total_calories: nutritionSummary.calories,
        total_carbs: nutritionSummary.carbs,
        total_proteins: nutritionSummary.proteins,
        total_fats: nutritionSummary.fats,
        glycemic_index: glycemicSummary.weightedIG,
        glycemic_load: glycemicSummary.glycemicLoad,
        foods: foods
      });

      const { data, error } = await supabase
        .from('meals')
        .insert({
          user_id: user.id,
          name: mealName,
          total_calories: nutritionSummary.calories,
          total_carbs: nutritionSummary.carbs,
          total_proteins: nutritionSummary.proteins,
          total_fats: nutritionSummary.fats,
          glycemic_index: glycemicSummary.weightedIG,
          glycemic_load: glycemicSummary.glycemicLoad,
          foods: foods
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur Supabase détaillée:', error);
        throw error;
      }

      Alert.alert('Succès', 'Le repas a été enregistré avec succès !');
      router.back();
    } catch (error: any) {
      console.error('Erreur détaillée lors de l\'enregistrement du repas:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      Alert.alert(
        'Erreur',
        `Une erreur est survenue lors de l'enregistrement du repas: ${error.message || 'Erreur inconnue'}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderTitle title="Créer un repas" showBackArrow/>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Nom du repas */}
        <Text style={styles.label}>Nom du repas</Text>
        <TextInput
          style={styles.input}
          value={mealName}
          onChangeText={setMealName}
          placeholder="Nouveau repas"
        />

        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Ajouter un aliment... (min. 3 caractères)"
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {isSearching && (
            <ActivityIndicator size="small" color="#4a90e2" style={styles.loadingIcon} />
          )}
        </View>

        {/* Liste des aliments */}
        <View style={styles.foodsList}>
          <Text style={styles.sectionTitle}>Aliments dans ce repas</Text>
          {foods.map((food, index) => (
            <View key={index} style={styles.foodItem}>
              <Image 
                source={{ uri: food.photo || 'https://d2eawub7utcl6.cloudfront.net/images/nix-apple-grey.png' }}
                style={styles.foodImage}
              />
              <View style={styles.foodInfo}>
                <Text style={styles.foodName}>{food.name}</Text>
                <View style={styles.nutritionValues}>
                  <Text style={styles.nutritionValue}>{food.carbs}g G</Text>
                  <Text style={styles.nutritionValue}>{food.proteins}g P</Text>
                  <Text style={styles.nutritionValue}>{food.fats}g L</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleRemoveFood(index)}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Résumé nutritionnel */}
        <View style={styles.nutritionSummary}>
          <Text style={styles.sectionTitle}>Résumé nutritionnel</Text>
          <View style={styles.nutritionTable}>
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Calories</Text>
              <Text style={styles.nutritionValue}>{nutritionSummary.calories.toFixed(2)} kcal</Text>
            </View>
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Glucides</Text>
              <Text style={styles.nutritionValue}>{nutritionSummary.carbs.toFixed(2)}g</Text>
            </View>
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Protéines</Text>
              <Text style={styles.nutritionValue}>{nutritionSummary.proteins.toFixed(2)}g</Text>
            </View>
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Lipides</Text>
              <Text style={styles.nutritionValue}>{nutritionSummary.fats.toFixed(2)}g</Text>
            </View>
          </View>

          
        </View>
      </ScrollView>

      {/* Résultats de recherche en overlay */}
      {searchResults.length > 0 && (
        <View style={styles.searchResultsOverlay}>
          <ScrollView style={styles.searchResults} bounces={false}>
            {searchResults.map((result, index) => (
              <TouchableOpacity 
                key={result.tag_id + result.food_name || index}
                style={[
                  styles.searchResultItem,
                  index === searchResults.length - 1 && styles.searchResultItemLast
                ]}
                onPress={() => handleSelectFood(result)}
              >
                <Image 
                  source={{ uri: result.photo.thumb }}
                  style={styles.searchResultImage}
                />
                <View style={styles.searchResultContent}>
                  <Text style={styles.searchResultText}>{result.food_name}</Text>
                  <Text style={styles.searchResultSubtext}>
                    {result.serving_qty} {result.serving_unit}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Boutons d'action */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]} 
          onPress={() => router.back()}
          disabled={isSaving}
        >
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.saveButton]}
          onPress={handleSaveMeal}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Enregistrer le repas</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  foodsList: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  foodImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    marginBottom: 4,
  },
  nutritionValues: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteButton: {
    padding: 8,
  },
  nutritionSummary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  nutritionTable: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  nutritionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  impactSection: {
    marginTop: 24,
  },
  glycemicMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  metricValue: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 20,
    fontWeight: '600',
  },
  impactCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#f8f8f8',
  },
  saveButton: {
    backgroundColor: '#4a90e2',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#333',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  searchResultsOverlay: {
    position: 'absolute',
    top: 160, // Position après la barre de recherche
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  searchResults: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  searchResultItemLast: {
    borderBottomWidth: 0,
  },
  searchResultImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  searchResultSubtext: {
    fontSize: 14,
    color: '#666',
  },
  loadingIcon: {
    marginLeft: 8,
  },
}); 