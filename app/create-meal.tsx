import React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image, Alert, Modal } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import HeaderTitle from '@/components/headerTitle';
import NutritionTable from './components/NutritionTable';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

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
  sugars: number;
  fibers: number;
  saturatedFats: number;
  photo?: string;
};

export default function CreateMealScreen() {
  const colorScheme = useColorScheme();
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
  const [macroModalVisible, setMacroModalVisible] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [editingQuantityIndex, setEditingQuantityIndex] = useState<number | null>(null);
  const [editingQuantityValue, setEditingQuantityValue] = useState<string>('');

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
          sugars: food.nf_sugars || 0,
          fibers: food.nf_dietary_fiber || 0,
          saturatedFats: food.nf_saturated_fat || 0,
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

  const handleUpdateQuantity = (index: number, delta: number) => {
    setFoods(prevFoods => prevFoods.map((food, i) => {
      if (i !== index) return food;
      const newQuantity = Math.max(0, Math.min(10000, food.quantity + delta));
      if (newQuantity === food.quantity || food.quantity === 0) return food;
      // On recalcule les valeurs nutritionnelles proportionnellement à la nouvelle quantité
      const ratio = newQuantity / food.quantity;
      return {
        ...food,
        quantity: newQuantity,
        calories: Number((food.calories * ratio).toFixed(2)),
        carbs: Number((food.carbs * ratio).toFixed(2)),
        proteins: Number((food.proteins * ratio).toFixed(2)),
        fats: Number((food.fats * ratio).toFixed(2)),
        sugars: Number((food.sugars * ratio).toFixed(2)),
        fibers: Number((food.fibers * ratio).toFixed(2)),
        saturatedFats: Number((food.saturatedFats * ratio).toFixed(2)),
        glycemicImpact: Number((food.glycemicImpact * ratio).toFixed(2)),
      };
    }));
  };

  const handleQuantityInput = (index: number) => {
    setEditingQuantityIndex(index);
    setEditingQuantityValue(foods[index].quantity.toString());
  };

  const handleQuantityChange = (value: string) => {
    // On autorise uniquement les chiffres
    if (/^\d*$/.test(value)) {
      setEditingQuantityValue(value);
    }
  };

  const handleQuantitySubmit = (index: number) => {
    let newQuantity = Math.max(0, parseInt(editingQuantityValue) || 0);
    if (newQuantity > 10000) newQuantity = 10000;
    setFoods(prevFoods => prevFoods.map((food, i) => {
      if (i !== index || food.quantity === 0 || newQuantity === food.quantity) return food;
      const ratio = newQuantity / food.quantity;
      return {
        ...food,
        quantity: newQuantity,
        calories: Number((food.calories * ratio).toFixed(2)),
        carbs: Number((food.carbs * ratio).toFixed(2)),
        proteins: Number((food.proteins * ratio).toFixed(2)),
        fats: Number((food.fats * ratio).toFixed(2)),
        sugars: Number((food.sugars * ratio).toFixed(2)),
        fibers: Number((food.fibers * ratio).toFixed(2)),
        saturatedFats: Number((food.saturatedFats * ratio).toFixed(2)),
        glycemicImpact: Number((food.glycemicImpact * ratio).toFixed(2)),
      };
    }));
    setEditingQuantityIndex(null);
    setEditingQuantityValue('');
  };

  // Calculer le résumé nutritionnel
  const nutritionSummary = foods.reduce((acc, food) => ({
    calories: Number((acc.calories + food.calories).toFixed(2)),
    carbs: Number((acc.carbs + food.carbs).toFixed(2)),
    proteins: Number((acc.proteins + food.proteins).toFixed(2)),
    fats: Number((acc.fats + food.fats).toFixed(2)),
    sugars: Number((acc.sugars + (food.sugars || 0)).toFixed(2)),
    fibers: Number((acc.fibers + (food.fibers || 0)).toFixed(2)),
    saturatedFats: Number((acc.saturatedFats + (food.saturatedFats || 0)).toFixed(2)),
  }), {
    calories: 0,
    carbs: 0,
    proteins: 0,
    fats: 0,
    sugars: 0,
    fibers: 0,
    saturatedFats: 0,
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

      const { data, error } = await supabase
        .from('meals')
        .insert({
          user_id: user.id,
          name: mealName,
          total_calories: nutritionSummary.calories,
          total_carbs: nutritionSummary.carbs,
          total_proteins: nutritionSummary.proteins,
          total_fats: nutritionSummary.fats,
          total_sugars: nutritionSummary.sugars,
          total_fibers: nutritionSummary.fibers,
          total_saturated_fats: nutritionSummary.saturatedFats,
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
      router.push('/');
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
    <View style={getStyles(colorScheme).container}>
      <HeaderTitle title="Créer un repas" showBackArrow/>

      <ScrollView style={getStyles(colorScheme).content} keyboardShouldPersistTaps="handled">
        {/* Nom du repas */}
        <Text style={getStyles(colorScheme).label}>Nom du repas</Text>
        <TextInput
          style={getStyles(colorScheme).input}
          value={mealName}
          onChangeText={setMealName}
          placeholder="Nouveau repas"
        />

        {/* Barre de recherche */}
        <View style={getStyles(colorScheme).searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={getStyles(colorScheme).searchIcon} />
          <TextInput
            style={getStyles(colorScheme).searchInput}
            placeholder="Ajouter un aliment..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {isSearching && (
            <ActivityIndicator size="small" color="#4a90e2" style={getStyles(colorScheme).loadingIcon} />
          )}
        </View>

        {/* Liste des aliments */}
        <View style={getStyles(colorScheme).foodsList}>
          <Text style={getStyles(colorScheme).sectionTitle}>Aliments dans ce repas</Text>
          {foods.map((food, index) => (
            <View key={index} style={getStyles(colorScheme).foodItem}>
              <Image 
                source={{ uri: food.photo || 'https://d2eawub7utcl6.cloudfront.net/images/nix-apple-grey.png' }}
                style={getStyles(colorScheme).foodImage}
              />
              <View style={getStyles(colorScheme).foodInfo}>
                <Text style={getStyles(colorScheme).foodName}>{food.name}</Text>
                <View style={getStyles(colorScheme).quantityControl}>
                  <TouchableOpacity onPress={() => handleUpdateQuantity(index, -10)}>
                    <Ionicons name="remove" size={20} color="#4a90e2" />
                  </TouchableOpacity>
                  {editingQuantityIndex === index ? (
                    <TextInput
                      style={getStyles(colorScheme).quantityInput}
                      value={editingQuantityValue}
                      onChangeText={handleQuantityChange}
                      onBlur={() => handleQuantitySubmit(index)}
                      onSubmitEditing={() => handleQuantitySubmit(index)}
                      keyboardType="numeric"
                      autoFocus
                    />
                  ) : (
                    <TouchableOpacity onPress={() => handleQuantityInput(index)}>
                      <Text style={getStyles(colorScheme).quantityText}>{food.quantity}g</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => handleUpdateQuantity(index, 10)}>
                    <Ionicons name="add" size={20} color="#4a90e2" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setSelectedFood(food); setMacroModalVisible(true); }} style={getStyles(colorScheme).infoButton}>
                    <Ionicons name="information-circle-outline" size={22} color="#4a90e2" />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity 
                style={getStyles(colorScheme).deleteButton}
                onPress={() => handleRemoveFood(index)}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Résumé nutritionnel */}
        <View style={getStyles(colorScheme).nutritionSummary}>
          <Text style={getStyles(colorScheme).sectionTitle}>Résumé nutritionnel</Text>
          <NutritionTable
            calories={Number(nutritionSummary.calories.toFixed(2))}
            glucides={Number(nutritionSummary.carbs.toFixed(2))}
            sucres={Number(nutritionSummary.sugars.toFixed(2))}
            fibres={Number(nutritionSummary.fibers.toFixed(2))}
            proteines={Number(nutritionSummary.proteins.toFixed(2))}
            lipides={Number(nutritionSummary.fats.toFixed(2))}
            satures={Number(nutritionSummary.saturatedFats.toFixed(2))}
          />
        </View>
      </ScrollView>

      {/* Résultats de recherche en overlay */}
      {searchResults.length > 0 && (
        <View style={getStyles(colorScheme).searchResultsOverlay}>
          <ScrollView style={getStyles(colorScheme).searchResults} bounces={false}>
            {searchResults.map((result, index) => (
              <TouchableOpacity 
                key={result.tag_id + result.food_name || index}
                style={[
                  getStyles(colorScheme).searchResultItem,
                  index === searchResults.length - 1 && getStyles(colorScheme).searchResultItemLast
                ]}
                onPress={() => handleSelectFood(result)}
              >
                <Image 
                  source={{ uri: result.photo.thumb }}
                  style={getStyles(colorScheme).searchResultImage}
                />
                <View style={getStyles(colorScheme).searchResultContent}>
                  <Text style={getStyles(colorScheme).searchResultText}>{result.food_name}</Text>
                  <Text style={getStyles(colorScheme).searchResultSubtext}>
                    {result.serving_qty} {result.serving_unit}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Boutons d'action */}
      <View style={getStyles(colorScheme).actions}>
        <TouchableOpacity 
          style={[getStyles(colorScheme).button, getStyles(colorScheme).saveButton]}
          onPress={handleSaveMeal}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#fff" />
              <Text style={getStyles(colorScheme).saveButtonText}>Enregistrer le repas</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal macros */}
      <Modal
        visible={macroModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMacroModalVisible(false)}
      >
        <View style={getStyles(colorScheme).modalOverlay}>
          <View style={getStyles(colorScheme).modalContent}>
            <Text style={getStyles(colorScheme).modalTitle}>Macros de l'aliment: {selectedFood?.name}</Text>
            {selectedFood && (
              <NutritionTable
                calories={selectedFood.calories}
                glucides={selectedFood.carbs}
                sucres={selectedFood.sugars}
                fibres={selectedFood.fibers}
                proteines={selectedFood.proteins}
                lipides={selectedFood.fats}
                satures={selectedFood.saturatedFats}
                style={getStyles(colorScheme).nutritionTableModal}
              />
            )}
            <TouchableOpacity style={getStyles(colorScheme).closeModalButton} onPress={() => setMacroModalVisible(false)}>
              <Text style={getStyles(colorScheme).closeModalButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}


const getStyles = (colorScheme: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
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
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
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
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
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
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  nutritionValues: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteButton: {
    padding: 8,
  },
  nutritionSummary: {
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  nutritionTable: {
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
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
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
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
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
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
    borderTopColor: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
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
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
  },
  saveButton: {
    backgroundColor: colorScheme === 'dark' ? Colors.dark.primary : Colors.light.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  saveButtonText: {
    fontSize: 16,
    color: colorScheme === 'dark' ? Colors.dark.white : Colors.light.white,
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
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
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
    borderBottomColor: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
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
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    marginBottom: 4,
  },
  searchResultSubtext: {
    fontSize: 14,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  loadingIcon: {
    marginLeft: 8,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  quantityInput: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
    minWidth: 40,
    borderBottomWidth: 1,
    borderColor: colorScheme === 'dark' ? Colors.dark.primary : Colors.light.primary,
    textAlign: 'center',
    padding: 0,
  },
  infoButton: {
    marginLeft: 8,
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  closeModalButton: {
    marginTop: 12,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.primary : Colors.light.primary,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  closeModalButtonText: {
    color: colorScheme === 'dark' ? Colors.dark.white : Colors.light.white,
    fontWeight: '600',
    fontSize: 16,
  },
  nutritionTableModal: {
    padding: 4,
    width: '100%',
  },
}); 