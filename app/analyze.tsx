import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Text, ActivityIndicator, TextInput, ScrollView, KeyboardAvoidingView, Platform, Modal, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import { useColorScheme } from '@/hooks/useColorScheme';
import {Colors} from '@/constants/Colors';
import NutritionTable from './components/NutritionTable';
import SearchBar from './components/SearchBar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function AnalyzeScreen() {
  const colorScheme = useColorScheme();
  const { photoUri } = useLocalSearchParams();
  const { user } = useAuth();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [dishName, setDishName] = useState<string>("");
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (!photoUri) return;
    const analyze = async () => {
      setLoading(true);
      setError(null);
      try {
        // Lire le fichier et l'encoder en base64
        // const base64Image = await FileSystem.readAsStringAsync(photoUri as string, { encoding: FileSystem.EncodingType.Base64 });

        // const response = await fetch('https://api.openai.com/v1/chat/completions', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //     'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
        //   },
        //   body: JSON.stringify({
        //     model: "gpt-4o-mini",
        //     messages: [
        //       {
        //         role: "user",
        //         content: [
        //           {
        //             type: "text",
        //             text: "Analyze this food image and return a JSON object. Give me the name of the dish (nom_plat), and for each ingredient, provide its name, estimated quantity, and nutritional values per 100g. Use this format: { nom_plat: string, ingredients: [{ nom: string, quantite: number, unite: string, nutritionPer100g: { calories: number, proteines: number, glucides: number, lipides: number } }] }. Return ONLY the JSON, no other text."
        //           },
        //           {
        //             type: "image_url",
        //             image_url: {
        //               url: `data:image/jpeg;base64,${base64Image}`
        //             }
        //           }
        //         ]
        //       }
        //     ],
        //     max_tokens: 1000,
        //   })
        // });
    
        // const data = await response.json();
        // if (!data.choices?.[0]?.message?.content) {
        //   throw new Error('Réponse invalide de GPT');
        // }
    
        // // Nettoyer la réponse pour s'assurer qu'elle ne contient que du JSON valide
        // let cleanedContent = data.choices[0].message.content.trim();
        // // Parfois la réponse contient du texte avant/après le JSON, on tente d'extraire le JSON
        // const firstBrace = cleanedContent.indexOf('{');
        // const lastBrace = cleanedContent.lastIndexOf('}');
        // if (firstBrace === -1 || lastBrace === -1) throw new Error('JSON non trouvé dans la réponse');
        // cleanedContent = cleanedContent.substring(firstBrace, lastBrace + 1);
        // const json = JSON.parse(cleanedContent);

        const json = {
          nom_plat: "Pâtes carbonara",
          ingredients: [
            { nom: "Pâtes", quantite: 200, unite: "g", nutritionPer100g: { calories: 100, proteines: 10, glucides: 20, lipides: 1 } },
            { nom: "Poulet", quantite: 150, unite: "g", nutritionPer100g: { calories: 100, proteines: 10, glucides: 20, lipides: 1 } },
            { nom: "Pommes de terre", quantite: 100, unite: "g", nutritionPer100g: { calories: 100, proteines: 10, glucides: 20, lipides: 1 } },
            { nom: "Carottes", quantite: 100, unite: "g", nutritionPer100g: { calories: 100, proteines: 10, glucides: 20, lipides: 1 } },
            { nom: "Brocoli", quantite: 100, unite: "g", nutritionPer100g: { calories: 100, proteines: 10, glucides: 20, lipides: 1 } },
            { nom: "Petits pois", quantite: 50, unite: "g", nutritionPer100g: { calories: 100, proteines: 10, glucides: 20, lipides: 1 } },
          ],
        };

        // Enrichir chaque ingrédient avec une photo depuis l'API food-info
        const enrichIngredientsWithPhoto = async (ingredients: any[]): Promise<any[]> => {
          return await Promise.all(
            ingredients.map(async (ingredient: any) => {
              try {
                const response = await fetch(`https://food-snap.vercel.app/api/search?query=${encodeURIComponent(ingredient.nom)}`);
                const data = await response.json();
                // On prend la première image trouvée, sinon une image par défaut
                const photo = data?.common?.[0]?.photo?.thumb || 'https://d2eawub7utcl6.cloudfront.net/images/nix-apple-grey.png';
                return { ...ingredient, photo };
              } catch (e) {
                return { ...ingredient, photo: 'https://d2eawub7utcl6.cloudfront.net/images/nix-apple-grey.png' };
              }
            })
          );
        };

        const enrichedIngredients = await enrichIngredientsWithPhoto(json.ingredients);

        setResult(json);
        setIngredients(enrichedIngredients);
        setDishName(json.nom_plat);
      } catch (error: any) {
        setError(error.message || 'Erreur lors de l\'analyse');
      } finally {
        setLoading(false);
      }
    };
    analyze();
  }, [photoUri]);

  // Fonction pour calculer la nutrition totale du plat
  const getTotalNutrition = () => {
    let totalCalories = 0;
    let totalGlucides = 0;
    let totalProteines = 0;
    let totalLipides = 0;
    // Champs manquants dans les ingrédients, on met 0
    let totalSucres = 0;
    let totalFibres = 0;
    let totalSatures = 0;
    console.log("recalcul", ingredients);
    ingredients.forEach(ingredient => {
      const q = ingredient.quantite || 0;
      const nut = ingredient.nutritionPer100g || {};
      totalCalories += (nut.calories || 0) * q / 100;
      totalGlucides += (nut.glucides || 0) * q / 100;
      totalProteines += (nut.proteines || 0) * q / 100;
      totalLipides += (nut.lipides || 0) * q / 100;
      totalSucres += (nut.sucres || 0) * q / 100;
      totalFibres += (nut.fibres || 0) * q / 100;
      totalSatures += (nut.satures || 0) * q / 100;
    });
    return {
      calories: Math.round(totalCalories),
      glucides: Math.round(totalGlucides * 10) / 10,
      sucres: totalSucres,
      fibres: totalFibres,
      proteines: Math.round(totalProteines * 10) / 10,
      lipides: Math.round(totalLipides * 10) / 10,
      satures: totalSatures,
    };
  };

  if (!photoUri) {
    return (
      <View style={getStyle(colorScheme).container}>
        <Text style={getStyle(colorScheme).error}>Aucune photo reçue.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={getStyle(colorScheme).container}>
        <Image source={{ uri: photoUri as string }} style={getStyle(colorScheme).landscapeImage} />
        <View style={getStyle(colorScheme).overlay}>
          <ActivityIndicator size="large" color="#fff" style={getStyle(colorScheme).loader} />
          <Text style={getStyle(colorScheme).loadingText}>Analyse en cours...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={getStyle(colorScheme).container}>
        <Text style={getStyle(colorScheme).error}>{error}</Text>
      </View>
    );
  }

  if (result) {
    const handleAddIngredient = (data: any) => {
      const food = data.foods?.[0];
      if (!food) return;

      if (ingredients.some((ing) => ing.nom.toLowerCase() === food.food_name.toLowerCase())) return;

      let ratio = 1;
      if (food.serving_weight_grams && food.serving_weight_grams > 0) {
        ratio = 100 / food.serving_weight_grams;
      }

      console.log(ratio);
      setIngredients([
        ...ingredients,
        {
          nom: food.food_name,
          quantite: food.serving_weight_grams || 100,
          unite: 'g',
          photo: food.photo.thumb || 'https://d2eawub7utcl6.cloudfront.net/images/nix-apple-grey.png',
          nutritionPer100g: {
            calories: food.nf_calories ? Math.round(food.nf_calories * ratio) : 0,
            proteines: food.nf_protein ? Math.round(food.nf_protein * ratio * 10) / 10 : 0,
            glucides: food.nf_total_carbohydrate ? Math.round(food.nf_total_carbohydrate * ratio * 10) / 10 : 0,
            lipides: food.nf_total_fat ? Math.round(food.nf_total_fat * ratio * 10) / 10 : 0,
            sucres: food.nf_sugars ? Math.round(food.nf_sugars * ratio * 10) / 10 : 0,
            fibres: food.nf_fiber ? Math.round(food.nf_fiber * ratio * 10) / 10 : 0,
            satures: food.nf_saturated_fat ? Math.round(food.nf_saturated_fat * ratio * 10) / 10 : 0,
          },
        },
      ]);

      console.log(ingredients, food.nf_total_carbohydrate ? Math.round(food.nf_total_carbohydrate * ratio * 10) / 10 : 0);
      setModalVisible(false);
    };

    const handleSaveMeal = async () => {
      const nutrition = getTotalNutrition();
      let glycemic_index = null;
      let glycemic_load = null;
      // On cherche l'index glycémique et la charge glycémique dans les ingrédients si dispo
      for (const ing of ingredients) {
        if (ing.index_glycemique) {
          glycemic_index = ing.index_glycemique;
        }
        if (ing.charge_glycemique) {
          glycemic_load = ing.charge_glycemique;
        }
      }
      const foods = ingredients.map(ing => ({
        name: ing.nom,
        quantity: ing.quantite,
        photo: ing.photo || 'https://d2eawub7utcl6.cloudfront.net/images/nix-apple-grey.png',
        calories: ing.nutritionPer100g?.calories ? Math.round(ing.nutritionPer100g.calories * ing.quantite / 100) : 0,
        proteins: ing.nutritionPer100g?.proteines ? Math.round(ing.nutritionPer100g.proteines * ing.quantite / 100 * 100) / 100 : 0,
        carbs: ing.nutritionPer100g?.glucides ? Math.round(ing.nutritionPer100g.glucides * ing.quantite / 100 * 100) / 100 : 0,
        fats: ing.nutritionPer100g?.lipides ? Math.round(ing.nutritionPer100g.lipides * ing.quantite / 100 * 100) / 100 : 0,
        glycemicImpact: ing.index_glycemique && ing.nutritionPer100g?.glucides
          ? Math.round((ing.index_glycemique / 100 * (ing.nutritionPer100g.glucides * ing.quantite / 100)) * 10000) / 10000
          : null,
      }));
      const { error } = await supabase.from('meals').insert([
        {
          user_id: user?.id || null,
          name: dishName,
          total_calories: nutrition.calories,
          total_carbs: nutrition.glucides,
          total_proteins: nutrition.proteines,
          total_fats: nutrition.lipides,
          glycemic_index,
          glycemic_load,
          foods,
          total_sugars: nutrition.sucres,
          total_fibers: nutrition.fibres,
          total_saturated_fats: nutrition.satures,
          photo_url: photoUri || null,
        },
      ]);
      
      if (error) {
        Alert.alert('Erreur', "Erreur lors de l'enregistrement : " + error.message);
      } else {
        Alert.alert('Succès', 'Plat enregistré avec succès !');
        router.push('/(tabs)');
      }
    };

    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <TouchableOpacity
            style={getStyle(colorScheme).closeTopLeftButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={getStyle(colorScheme).closeTopLeftButtonText}>✕</Text>
          </TouchableOpacity>
          <Image source={{ uri: photoUri as string }} style={getStyle(colorScheme).landscapeImage} resizeMode="cover" />
          <TextInput
            style={getStyle(colorScheme).dishNameInput}
            value={dishName}
            onChangeText={setDishName}
            placeholder="Nom du plat"
            placeholderTextColor="#888"
          />
          <View style={getStyle(colorScheme).ingredientsContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
              <Text style={getStyle(colorScheme).ingredientsTitle}>Ingrédients</Text>
              <TouchableOpacity onPress={() => setModalVisible(true)} style={getStyle(colorScheme).addButton}>
                <Text style={getStyle(colorScheme).addButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            {ingredients.map((ingredient, idx) => (
              <View key={ingredient.nom + idx} style={getStyle(colorScheme).ingredientRow}>
                <Text style={getStyle(colorScheme).ingredientName}>{ingredient.nom}</Text>
                <View style={getStyle(colorScheme).quantityUnitContainer}>
                  <TextInput
                    style={getStyle(colorScheme).quantityInput}
                    keyboardType="numeric"
                    value={ingredient.quantite.toString()}
                    onChangeText={text => {
                      const newIngredients = [...ingredients];
                      const value = parseFloat(text) || 0;
                      newIngredients[idx] = { ...newIngredients[idx], quantite: value };
                      setIngredients(newIngredients);
                    }}
                  />
                  <Text style={getStyle(colorScheme).ingredientUnit}>{ingredient.unite}</Text>
                  <TouchableOpacity onPress={() => {
                    setIngredients(ingredients.filter((_, i) => i !== idx));
                  }} style={getStyle(colorScheme).removeButton}>
                    <Text style={getStyle(colorScheme).removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
          <View style={getStyle(colorScheme).nutritionContainer}>
            <Text style={getStyle(colorScheme).ingredientsTitle}>Valeurs nutritionnelles</Text>
            <NutritionTable {...getTotalNutrition()} style={getStyle(colorScheme).nutritionTable}/>
          </View>
        </ScrollView>
        <TouchableOpacity
          style={{
            backgroundColor: '#4a90e2',
            borderRadius: 12,
            padding: 16,
            margin: 24,
            alignItems: 'center',
          }}
          onPress={handleSaveMeal}
        >
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Enregistrer</Text>
        </TouchableOpacity>
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={getStyle(colorScheme).modalOverlay}>
            <View style={getStyle(colorScheme).modalContent}>
              <Text style={getStyle(colorScheme).modalTitle}>Ajouter un ingrédient</Text>
              <SearchBar colorScheme={colorScheme} getStyles={getStyle} onResultSelect={handleAddIngredient} />
              <TouchableOpacity onPress={() => setModalVisible(false)} style={getStyle(colorScheme).closeButton}>
                <Text style={getStyle(colorScheme).closeButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    );
  }

  return null;
}

const getStyle = (colorScheme: string) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
  },
  fullImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
  },
  loadingText: {
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  loader: {
    marginBottom: 10,
  },
  error: {
    color: 'red',
    fontSize: 18,
  },
  landscapeImage: {
    width: '100%',
    height: 220,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  resultContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  dishName: {
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 24,
    textAlign: 'center',
    textShadowColor: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  dishNameInput: {
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 24,
    textAlign: 'center',
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    marginHorizontal: 24,
    paddingVertical: 4,
  },
  ingredientsContainer: {
    marginTop: 24,
    paddingHorizontal: 24,
    width: '100%',
    justifyContent: 'center',
  },
  nutritionContainer: {
    marginTop: 24,
    paddingHorizontal: 24,
    width: '100%',
    justifyContent: 'center',
  },
  ingredientsTitle: {
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  nutritionTable: {
    marginTop: 16,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  ingredientName: {
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    fontSize: 18,
    flex: 2,
  },
  quantityInputContainer: {
    // supprimé, remplacé par quantityUnitContainer
  },
  quantityUnitContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  quantityInput: {
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 18,
    width: 70,
    marginHorizontal: 8,
    textAlign: 'right',
  },
  ingredientUnit: {
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    fontSize: 16,
    width: 40,
    textAlign: 'left',
    marginLeft: 2,
    marginRight: 2,
  },
  searchContainer: {
    width: '100%',
    paddingHorizontal: 0,
    marginTop: 8,
    alignItems: 'center',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colorScheme === 'dark' ? '#222' : '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: '100%',
    marginBottom: 4,
  },
  searchInput: {
    flex: 1,
    color: colorScheme === 'dark' ? '#fff' : '#000',
    fontSize: 16,
    marginLeft: 8,
    backgroundColor: 'transparent',
    paddingVertical: 4,
  },
  searchResults: {
    width: '100%',
    backgroundColor: colorScheme === 'dark' ? '#222' : '#fff',
    borderRadius: 8,
    marginTop: 2,
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? '#444' : '#ddd',
    alignSelf: 'center',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee',
  },
  searchResultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchResultImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  searchResultTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  searchResultText: {
    color: colorScheme === 'dark' ? '#fff' : '#000',
    fontSize: 16,
    fontWeight: '500',
  },
  searchResultSubtext: {
    color: colorScheme === 'dark' ? '#aaa' : '#666',
    fontSize: 13,
    marginTop: 2,
  },
  addButton: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  addButtonText: {
    color: '#4a90e2',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  removeButton: {
    marginLeft: 8,
    backgroundColor: 'transparent',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  closeTopLeftButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    zIndex: 10,
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeTopLeftButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 28,
  },
});
