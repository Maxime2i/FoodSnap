import React from 'react';
import { StyleSheet, View, Text, Button, TouchableOpacity, Image, Animated, TextInput, ScrollView, Alert, Modal, Switch, ActivityIndicator, TouchableWithoutFeedback } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useEffect, useState, useRef } from 'react';
import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { supabase } from '@/lib/supabase';
import { decode, encode } from 'base64-arraybuffer';
import { useAuth } from '@/hooks/useAuth';
import { Picker } from '@react-native-picker/picker';

// Ajout de l'interface pour la réponse de ChatGPT
interface FoodAnalysis {
  ingredients: {
    nom: string;
    quantite: number;
    unite: string;
    nutritionPer100g: {
      calories: number;
      proteines: number;
      glucides: number;
      lipides: number;
    };
  }[];
  macros: {
    calories: number;
    proteines: number;
    glucides: number;
    lipides: number;
  };
}

interface FoodItem {
  food_id: string;
  food_name: string;
  brand_name?: string;
  food_description?: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  imageUrl?: string;
}

interface NutritionValues {
  calories: number;
  proteines: number;
  glucides: number;
  lipides: number;
}

interface Ingredient {
  id: number;
  nom: string;
  quantite: number;
  unite: string;
  nutritionPer100g: NutritionValues;
}

const analyzeImageWithGPT = async (base64Image: string): Promise<FoodAnalysis> => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this food image and return a JSON object. For each ingredient, provide its name, estimated quantity, and nutritional values per 100g. Use this format: { ingredients: [{ nom: string, quantite: number, unite: string, nutritionPer100g: { calories: number, proteines: number, glucides: number, lipides: number } }] }. Return ONLY the JSON, no other text."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
      })
    });

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Réponse invalide de GPT');
    }

    // Nettoyer la réponse pour s'assurer qu'elle ne contient que du JSON valide
    let cleanedContent = data.choices[0].message.content;
    
    // Supprimer tous les caractères avant le premier { et après le dernier }
    cleanedContent = cleanedContent.substring(
      cleanedContent.indexOf('{'),
      cleanedContent.lastIndexOf('}') + 1
    );

    // Supprimer tous les caractères non-JSON potentiels
    cleanedContent = cleanedContent.replace(/[^\x20-\x7E]/g, '');

    console.log('Contenu JSON nettoyé:', cleanedContent);

    try {
      const analysis = JSON.parse(cleanedContent);
      
      // Calculer les macros totales à partir des ingrédients
      const totalMacros = {
        calories: 0,
        proteines: 0,
        glucides: 0,
        lipides: 0
      };

      // Pour chaque ingrédient, calculer les macros en fonction de sa quantité réelle
      analysis.ingredients.forEach((ing: { 
        quantite: number; 
        nutritionPer100g: { 
          calories: number; 
          proteines: number; 
          glucides: number; 
          lipides: number; 
        }; 
      }) => {
        // Calculer le multiplicateur (quantité réelle / 100g)
        const multiplier = ing.quantite / 100;
        
        // Ajouter les macros proportionnelles aux totaux
        totalMacros.calories += Math.round(ing.nutritionPer100g.calories * multiplier);
        totalMacros.proteines += Math.round(ing.nutritionPer100g.proteines * multiplier);
        totalMacros.glucides += Math.round(ing.nutritionPer100g.glucides * multiplier);
        totalMacros.lipides += Math.round(ing.nutritionPer100g.lipides * multiplier);
      });

      return {
        ingredients: analysis.ingredients.map((ing: {
          nom: string;
          quantite: number;
          unite: string;
          nutritionPer100g: {
            calories: number;
            proteines: number;
            glucides: number;
            lipides: number;
          };
        }) => ({
          ...ing,
          nutritionPer100g: {
            calories: Math.round(ing.nutritionPer100g.calories),
            proteines: Math.round(ing.nutritionPer100g.proteines),
            glucides: Math.round(ing.nutritionPer100g.glucides),
            lipides: Math.round(ing.nutritionPer100g.lipides)
          }
        })),
        macros: totalMacros
      };
    } catch (error) {
      console.error('Erreur lors de la conversion en JSON:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erreur lors de l\'analyse avec GPT:', error);
    throw error;
  }
};

// Modification de la structure des types de plats pour le Picker
const MEAL_TYPES_LIST = [
  { label: "-- Sélectionner un type --", value: "" },
  { label: "Types généraux", value: "", isHeader: true },
  { label: "Petit-déjeuner", value: "Petit-déjeuner" },
  { label: "Déjeuner", value: "Déjeuner" },
  { label: "Dîner", value: "Dîner" },
  { label: "Collation", value: "Collation" },
  { label: "Apéritif", value: "Apéritif" },
  { label: "Types spécifiques", value: "", isHeader: true },
  { label: "Plat principal", value: "Plat principal" },
  { label: "Entrée", value: "Entrée" },
  { label: "Dessert", value: "Dessert" },
  { label: "Boisson", value: "Boisson" },
  { label: "Snack sucré", value: "Snack sucré" },
  { label: "Snack salé", value: "Snack salé" },
  { label: "Types diététiques", value: "", isHeader: true },
  { label: "Végétarien", value: "Végétarien" },
  { label: "Végétalien / Vegan", value: "Végétalien / Vegan" },
  { label: "Sans gluten", value: "Sans gluten" },
  { label: "High protein", value: "High protein" },
  { label: "Low carb", value: "Low carb" },
  { label: "Kéto", value: "Kéto" },
  { label: "Paleo", value: "Paleo" },
  { label: "Diabétique-friendly", value: "Diabétique-friendly" },
  { label: "Types selon l'objectif", value: "", isHeader: true },
  { label: "Prise de masse", value: "Prise de masse" },
  { label: "Perte de poids", value: "Perte de poids" },
  { label: "Énergie rapide", value: "Énergie rapide" },
  { label: "Repas équilibré", value: "Repas équilibré" }
];

// Fonction pour extraire les valeurs nutritionnelles de la description
const extractNutritionValues = (foodDescription: string): NutritionValues => {
  const defaultValues = {
    calories: 0,
    proteines: 0,
    glucides: 0,
    lipides: 0
  };

  if (!foodDescription) return defaultValues;

  try {
    const caloriesMatch = foodDescription.match(/Calories:\s*(\d+(?:\.\d+)?)/i);
    const fatMatch = foodDescription.match(/Fat:\s*(\d+(?:\.\d+)?)/i);
    const carbsMatch = foodDescription.match(/Carbs:\s*(\d+(?:\.\d+)?)/i);
    const proteinMatch = foodDescription.match(/Protein:\s*(\d+(?:\.\d+)?)/i);

    return {
      calories: caloriesMatch ? parseFloat(caloriesMatch[1]) : 0,
      proteines: proteinMatch ? parseFloat(proteinMatch[1]) : 0,
      glucides: carbsMatch ? parseFloat(carbsMatch[1]) : 0,
      lipides: fatMatch ? parseFloat(fatMatch[1]) : 0
    };
  } catch (error) {
    console.error('Erreur lors de l\'extraction des valeurs nutritionnelles:', error);
    return defaultValues;
  }
};



export default function CameraScreen() {
  const { user } = useAuth();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [macros, setMacros] = useState<NutritionValues>({
    calories: 0,
    proteines: 0,
    glucides: 0,
    lipides: 0
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [platName, setPlatName] = useState('');
  const [platDescription, setPlatDescription] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [selectedType, setSelectedType] = useState('');
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const spinValue = useRef(new Animated.Value(0)).current;
  const [editingIngredientId, setEditingIngredientId] = useState<number | null>(null);

  // États pour la recherche d'aliments
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<FoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);

  // États pour la modification de la quantité
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [tempQuantity, setTempQuantity] = useState("");

  // Fonction pour gérer l'édition de la quantité
  const handleEditQuantity = (ingredient: Ingredient) => {
    console.log("Édition de la quantité pour:", ingredient.nom);
    setSelectedIngredient(ingredient);
    setTempQuantity(ingredient.quantite.toString());
    setShowQuantityModal(true);
  };

  // Fonction pour sauvegarder la nouvelle quantité
  const handleSaveQuantity = () => {
    console.log("Sauvegarde de la nouvelle quantité:", tempQuantity);
    if (selectedIngredient && tempQuantity) {
      const numericValue = Math.min(1000, Number(tempQuantity.replace(/[^0-9]/g, '')));
      if (!isNaN(numericValue)) {
        const updatedIngredients = ingredients.map(ing =>
          ing.id === selectedIngredient.id ? { ...ing, quantite: numericValue } : ing
        );
        setIngredients(updatedIngredients);
        setMacros(calculateTotalMacros(updatedIngredients));
      }
    }
    setShowQuantityModal(false);
    setSelectedIngredient(null);
    setTempQuantity("");
  };

  useEffect(() => {
    if (isAnalyzing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(spinValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true
          }),
          Animated.timing(spinValue, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true
          })
        ])
      ).start();
    }
  }, [isAnalyzing]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // Mise à jour de la fonction calculateTotalMacros
  const calculateTotalMacros = (currentIngredients: Ingredient[]): NutritionValues => {
    let totalMacros: NutritionValues = {
      calories: 0,
      proteines: 0,
      glucides: 0,
      lipides: 0
    };

    currentIngredients.forEach(ing => {
      const multiplier = ing.quantite / 100;
      totalMacros.calories += ing.nutritionPer100g.calories * multiplier;
      totalMacros.proteines += ing.nutritionPer100g.proteines * multiplier;
      totalMacros.glucides += ing.nutritionPer100g.glucides * multiplier;
      totalMacros.lipides += ing.nutritionPer100g.lipides * multiplier;
    });

    return {
      calories: Math.round(totalMacros.calories),
      proteines: Math.round(totalMacros.proteines),
      glucides: Math.round(totalMacros.glucides),
      lipides: Math.round(totalMacros.lipides)
    };
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true });
      
      if (!photo?.uri) return;

      const manipulatedImage = await manipulateAsync(
        photo.uri,
        [{ resize: { width: 800 } }],
        { base64: true, compress: 0.7, format: SaveFormat.JPEG }
      );

      setPhoto(manipulatedImage.uri);
      setIsAnalyzing(true);

      try {
        // Analyse avec GPT
        const analysis = await analyzeImageWithGPT(manipulatedImage.base64 || '');
        
        // Mise à jour des données
        setIngredients(analysis.ingredients.map((ing, index) => ({
          id: index + 1,
          ...ing
        })));
        
        // Mise à jour des macros
        setMacros(analysis.macros);
        
        setAnalysisComplete(true);
      } catch (error) {
        console.error('Erreur lors de l\'analyse:', error);
        Alert.alert(
          'Erreur',
          'Une erreur est survenue lors de l\'analyse de l\'image. Veuillez réessayer.'
        );
      } finally {
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error("Erreur lors de la capture:", error);
      setIsAnalyzing(false);
    }
  };

  const resetCapture = () => {
    setPhoto(null);
    setIsAnalyzing(false);
    setAnalysisComplete(false);
    setIngredients([]);
    setMacros({
      calories: 0,
      proteines: 0,
      glucides: 0,
      lipides: 0
    });
  };

  const handleSave = () => {
    if (!platName.trim()) {
      Alert.alert('Erreur', 'Veuillez donner un nom à votre plat');
      return;
    }
    if (!selectedType) {
      Alert.alert('Erreur', 'Veuillez sélectionner un type de plat');
      return;
    }
    setShowSaveModal(false);
    saveToSupabase();
  };

  const saveToSupabase = async () => {
    if (!photo || !user) return;

    try {
      setIsSaving(true);

      // 1. Upload de la photo
      const photoName = `plat_${Date.now()}.jpg`;
      const photoPath = `public/${user.id}/${photoName}`;
      
      // Convertir l'URI de la photo en base64
      const response = await fetch(photo);
      const blob = await response.blob();
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => {
          if (typeof reader.result === 'string') resolve(reader.result.split(',')[1]);
        };
        reader.readAsDataURL(blob);
      });

      // Upload de la photo
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(photoPath, decode(base64), {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Récupérer l'URL publique de la photo
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(photoPath);

      // 2. Créer le plat
      const { data: plat, error: platError } = await supabase
        .from('plats')
        .insert({
          user_id: user.id,
          photo_url: publicUrl,
          calories: macros.calories,
          proteines: macros.proteines,
          glucides: macros.glucides,
          lipides: macros.lipides,
          name: platName,
          description: platDescription,
          is_published: isPublished,
          type: selectedType
        })
        .select()
        .single();

      if (platError) throw platError;

      // 3. Ajouter les ingrédients
      const { error: ingredientsError } = await supabase
        .from('plats_ingredients')
        .insert(
          ingredients.map(ing => ({
            plat_id: plat.id,
            nom: ing.nom,
            quantite: ing.quantite,
            unite: ing.unite
          }))
        );

      if (ingredientsError) throw ingredientsError;

      // 4. Redirection vers le feed
      router.replace('/(tabs)/feed');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Fonction de recherche d'aliments
  const searchFood = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `http://13.60.13.92:3000/food-data?search=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setSuggestions(data.foods.food);
    } catch (error) {
      console.error("Erreur lors de la recherche:", error);
      Alert.alert("Erreur", "Impossible de récupérer les suggestions");
    } finally {
      setIsSearching(false);
    }
  };

  // Mise à jour de la fonction handleAddIngredient
  const handleAddIngredient = (food: FoodItem) => {
    const nutritionValues = extractNutritionValues(food.food_description || '');
    const newIngredient: Ingredient = {
      id: ingredients.length + 1,
      nom: food.food_name,
      quantite: 100,
      unite: "g",
      nutritionPer100g: nutritionValues
    };
    const updatedIngredients = [...ingredients, newIngredient];
    setIngredients(updatedIngredients);
    setMacros(calculateTotalMacros(updatedIngredients));
    setShowAddIngredientModal(false);
    setSearchQuery("");
    setSuggestions([]);
  };

  // Mise à jour de la fonction handleRemoveIngredient
  const handleRemoveIngredient = (id: number) => {
    const updatedIngredients = ingredients.filter(ing => ing.id !== id);
    setIngredients(updatedIngredients);
    setMacros(calculateTotalMacros(updatedIngredients));
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  if (photo) {
    if (isAnalyzing) {
      return (
        <View style={styles.container}>
          <Image source={{ uri: photo }} style={styles.camera} />
          <View style={styles.analyzingContainer}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Feather name="loader" size={40} color="white" />
            </Animated.View>
            <Text style={styles.analyzingText}>Analyse en cours...</Text>
          </View>
        </View>
      );
    }

    if (analysisComplete) {
      return (
        <View style={styles.container}>
          <View style={styles.resultContainer}>
            <Image source={{ uri: photo }} style={styles.thumbnailImage} />
            
            <View style={styles.macrosContainer}>
              <Text style={styles.sectionTitle}>Valeurs nutritionnelles</Text>
              <View style={styles.macrosGrid}>
                <View style={styles.macroItem}>
                  <Text style={[styles.macroValue, {color: '#ff9500'}]}>{macros.calories} Kcal</Text>
                  <Text style={styles.macroLabel}>Calories</Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={[styles.macroValue, {color: '#4a90e2'}]}>{macros.glucides}g</Text>
                  <Text style={styles.macroLabel}>Glucides</Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={[styles.macroValue, {color: '#2ecc71'}]}>{macros.proteines}g</Text>
                  <Text style={styles.macroLabel}>Protéines</Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={[styles.macroValue, {color: '#f1c40f'}]}>{macros.lipides}g</Text>
                  <Text style={styles.macroLabel}>Lipides</Text>
                </View>
              </View>
            </View>

            <ScrollView style={styles.ingredientsList}>
              <View style={styles.ingredientsHeader}>
                <Text style={styles.sectionTitle}>Ingrédients détectés</Text>
                <TouchableOpacity 
                  style={styles.addIngredientButton}
                  onPress={() => setShowAddIngredientModal(true)}
                >
                  <Feather name="plus" size={24} color="#31AFF0" />
                </TouchableOpacity>
              </View>
              {ingredients.map((ingredient) => {
                const macros = ingredient.nutritionPer100g;
                const multiplier = ingredient.quantite / 100;
                
                return (
                  <View key={ingredient.id} style={styles.ingredientItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ingredientName}>{ingredient.nom}</Text>
                      <View style={{ flexDirection: 'row', marginTop: 4, gap: 8 }}>
                        <Text style={{ fontSize: 12, color: '#666' }}>
                          {Math.round(macros.calories * multiplier)} kcal
                        </Text>
                        <Text style={{ fontSize: 12, color: '#666' }}>
                          P: {Math.round(macros.proteines * multiplier)}g
                        </Text>
                        <Text style={{ fontSize: 12, color: '#666' }}>
                          G: {Math.round(macros.glucides * multiplier)}g
                        </Text>
                        <Text style={{ fontSize: 12, color: '#666' }}>
                          L: {Math.round(macros.lipides * multiplier)}g
                        </Text>
                      </View>
                    </View>
                    <View style={styles.quantityContainer}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => handleEditQuantity(ingredient)}
                      >
                        <Text style={styles.quantityText}>{ingredient.quantite}</Text>
                        <Text style={styles.unitText}>{ingredient.unite}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.removeIngredientButton}
                        onPress={() => handleRemoveIngredient(ingredient.id)}
                      >
                        <Feather name="x" size={20} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Modal pour éditer la quantité */}
            <Modal
              visible={showQuantityModal}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowQuantityModal(false)}
            >
              <TouchableWithoutFeedback onPress={() => setShowQuantityModal(false)}>
                <View style={styles.quantityModalContainer}>
                  <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                    <View style={styles.quantityModalContent}>
                      <Text style={styles.quantityModalTitle}>
                        Modifier la quantité
                      </Text>
                      <View style={styles.quantityInputContainer}>
                        <TextInput
                          style={[styles.quantityModalInput, {
                            borderWidth: 1,
                            borderColor: '#ddd',
                            borderRadius: 8,
                            padding: 10,
                            fontSize: 18,
                            textAlign: 'center',
                            width: '50%'
                          }]}
                          value={tempQuantity}
                          onChangeText={(text) => {
                            const numericValue = Number(text.replace(/[^0-9]/g, ''));
                            if (!isNaN(numericValue)) {
                              setTempQuantity(Math.min(1000, numericValue).toString());
                            }
                          }}
                          keyboardType="numeric"
                          autoFocus={true}
                          selectTextOnFocus={true}
                          maxLength={4}
                        />
                        <Text style={styles.quantityModalUnit}>
                          {selectedIngredient?.unite}
                        </Text>
                      </View>
                      <View style={styles.quantityModalButtons}>
                        <TouchableOpacity
                          style={[styles.quantityModalButton, styles.quantityModalCancelButton]}
                          onPress={() => setShowQuantityModal(false)}
                        >
                          <Text style={styles.quantityModalButtonText}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.quantityModalButton, styles.quantityModalSaveButton]}
                          onPress={handleSaveQuantity}
                        >
                          <Text style={[styles.quantityModalButtonText, styles.quantityModalSaveButtonText]}>
                            Valider
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </Modal>

            <Modal
              visible={showAddIngredientModal}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowAddIngredientModal(false)}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Ajouter un ingrédient</Text>
                    <TouchableOpacity 
                      onPress={() => {
                        setShowAddIngredientModal(false);
                        setSearchQuery("");
                        setSuggestions([]);
                      }}
                    >
                      <Feather name="x" size={24} color="#000" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.searchContainer}>
                    <View style={styles.searchWrapper}>
                      <Feather name="search" size={20} color="#666" style={styles.searchIcon} />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Rechercher un aliment..."
                        value={searchQuery}
                        onChangeText={(text) => {
                          setSearchQuery(text);
                          searchFood(text);
                        }}
                        placeholderTextColor="#666"
                      />
                      {isSearching && (
                        <ActivityIndicator size="small" color="#31AFF0" style={styles.loadingIcon} />
                      )}
                    </View>
                  </View>

                  <ScrollView style={styles.suggestionsContainer}>
                    {suggestions.map((food) => (
                      <TouchableOpacity
                        key={food.food_id}
                        style={styles.suggestionItem}
                        onPress={() => handleAddIngredient(food)}
                      >
                        <Text style={styles.suggestionTitle}>{food.food_name}</Text>
                        {food.brand_name && (
                          <Text style={styles.suggestionBrand}>{food.brand_name}</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </Modal>

            <TouchableOpacity 
              style={[
                styles.saveButton,
                isSaving && styles.saveButtonDisabled
              ]}
              onPress={() => setShowSaveModal(true)}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>Enregistrer et publier</Text>
            </TouchableOpacity>

            <Modal
              visible={showSaveModal}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowSaveModal(false)}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Enregistrer le plat</Text>
                  
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Nom du plat"
                    value={platName}
                    onChangeText={setPlatName}
                    placeholderTextColor="#666"
                  />
                  
                  <TextInput
                    style={[styles.modalInput, styles.modalTextArea]}
                    placeholder="Description (optionnelle)"
                    value={platDescription}
                    onChangeText={setPlatDescription}
                    multiline
                    numberOfLines={4}
                    placeholderTextColor="#666"
                  />

                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={selectedType}
                      onValueChange={(itemValue) => setSelectedType(itemValue)}
                      style={styles.picker}
                    >
                      {MEAL_TYPES_LIST.map((item, index) => (
                        item.isHeader ? (
                          <Picker.Item
                            key={index}
                            label={item.label}
                            value={item.value}
                            enabled={false}
                            style={styles.pickerHeader}
                          />
                        ) : (
                          <Picker.Item
                            key={index}
                            label={item.label}
                            value={item.value}
                            style={item.value === "" ? styles.pickerPlaceholder : styles.pickerItem}
                          />
                        )
                      ))}
                    </Picker>
                  </View>

                  <View style={styles.publishContainer}>
                    <Text style={styles.publishText}>Publier le plat</Text>
                    <Switch
                      value={isPublished}
                      onValueChange={setIsPublished}
                      trackColor={{ false: '#767577', true: '#81b0ff' }}
                      thumbColor={isPublished ? '#31AFF0' : '#f4f3f4'}
                    />
                  </View>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => setShowSaveModal(false)}
                    >
                      <Text style={styles.cancelButtonText}>Annuler</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.confirmButton]}
                      onPress={handleSave}
                    >
                      <Text style={styles.confirmButtonText}>Enregistrer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={resetCapture}
            >
              <Feather name="x" size={32} color="black" />
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  }

  // Modal pour éditer la quantité
  return (
    <>
      <View style={styles.container}>
        <CameraView 
          ref={cameraRef}
          style={styles.camera} 
          facing={facing}
        >
          <View style={styles.framingGuide}>
            <View style={[styles.framingCorner, { borderTopWidth: 4, borderLeftWidth: 4 }]} />
            <View style={[styles.framingCorner, { right: 0, borderTopWidth: 4, borderRightWidth: 4 }]} />
            <View style={[styles.framingCorner, { bottom: 0, borderBottomWidth: 4, borderLeftWidth: 4 }]} />
            <View style={[styles.framingCorner, { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 }]} />
          </View>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => router.back()}
          >
            <Feather name="x" size={32} color="white" />
          </TouchableOpacity>
          <View style={styles.buttonContainer}>
            <View style={styles.analyzeButtonWrapper}>
              <TouchableOpacity style={styles.analyzeButton} onPress={takePicture}>
                <Text style={styles.analyzeButtonText}>Analyser ce plat</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.flipButton} onPress={() => setFacing(current => (current === 'back' ? 'front' : 'back'))}>
              <Feather name="refresh-ccw" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  title: {  
    color: 'white',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: 'white',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzeButtonWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzeButton: {
    backgroundColor: '#31AFF0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    height: 50,
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  flipButton: {
    position: 'absolute',
    right: 30,
    bottom: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 2,
    padding: 10,
  },
  analyzingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingText: {
    color: 'white',
    fontSize: 18,
    marginTop: 20,
    fontWeight: '600',
  },
  resultContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: 'white',
    padding: 20,
  },
  thumbnailImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  macrosContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#31AFF0',
  },
  macroLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  ingredientsList: {
    flex: 1,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientMacros: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 8,
  },
  macroText: {
    fontSize: 12,
    color: '#666',
  },
  ingredientName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityInput: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 8,
    marginRight: 8,
    textAlign: 'center',
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  quantityInputFocused: {
    borderColor: '#31AFF0',
    borderWidth: 2,
    shadowColor: "#31AFF0",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  unitText: {
    fontSize: 16,
    color: '#666',
    width: 30,
  },
  saveButton: {
    backgroundColor: '#31AFF0',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  modalInput: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  modalTextArea: {
    height: 100,
    paddingVertical: 8,
  },
  publishContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  publishText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
    padding: 10,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  confirmButton: {
    backgroundColor: '#31AFF0',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    backgroundColor: 'white',
  },
  pickerHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    backgroundColor: '#f5f5f5',
  },
  pickerItem: {
    fontSize: 16,
    color: '#333',
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: '#666',
  },
  framingGuide: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    right: '10%',
    bottom: '30%',
  },
  framingCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: 'white',
  },
  ingredientsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  addIngredientButton: {
    padding: 5,
  },
  removeIngredientButton: {
    padding: 5,
  },
  searchContainer: {
    marginBottom: 10,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  searchIcon: {
    padding: 10,
  },
  searchInput: {
    flex: 1,
    padding: 10,
  },
  loadingIcon: {
    marginLeft: 10,
  },
  suggestionsContainer: {
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  suggestionBrand: {
    fontSize: 14,
    color: '#666',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  quantityModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  quantityModalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxHeight: '80%',
  },
  quantityModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityModalInput: {
    flex: 1,
    padding: 10,
  },
  quantityModalUnit: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
  },
  quantityModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  quantityModalButton: {
    flex: 1,
    marginHorizontal: 5,
    padding: 10,
    borderRadius: 8,
  },
  quantityModalCancelButton: {
    backgroundColor: '#ccc',
  },
  quantityModalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  quantityModalSaveButton: {
    backgroundColor: '#31AFF0',
  },
  quantityModalSaveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  quantityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  quantityText: {
    fontSize: 16,
    color: '#333',
    marginRight: 4,
    fontWeight: '500',
  },
});
