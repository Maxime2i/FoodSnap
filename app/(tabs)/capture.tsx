import { StyleSheet, View, Text, Button, TouchableOpacity, Image, Animated, TextInput, ScrollView, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useEffect, useState, useRef } from 'react';
import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { supabase } from '@/lib/supabase';
import { decode, encode } from 'base64-arraybuffer';
import { useAuth } from '@/hooks/useAuth';

// Données de test
const testData = {
  macros: {
    calories: 450,
    proteines: 25,
    glucides: 55,
    lipides: 15,
  },
  ingredients: [
    { id: 1, nom: "Riz blanc cuit", quantite: 200, unite: "g" },
    { id: 2, nom: "Poulet grillé", quantite: 150, unite: "g" },
    { id: 3, nom: "Brocolis", quantite: 100, unite: "g" },
    { id: 4, nom: "Sauce soja", quantite: 15, unite: "ml" },
  ]
};

// Ajout de l'interface pour la réponse de ChatGPT
interface FoodAnalysis {
  ingredients: {
    nom: string;
    quantite: number;
    unite: string;
  }[];
  macros: {
    calories: number;
    proteines: number;
    glucides: number;
    lipides: number;
  };
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
        model: "gpt-4-turbo",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this food image and return a JSON object with the following structure: { ingredients: [{ nom: string, quantite: number, unite: string }], macros: { calories: number, proteines: number, glucides: number, lipides: number } }. Estimate the quantities and nutritional values based on what you see. Return ONLY the JSON, no other text."
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
      throw new Error('Invalid response from GPT');
    }

    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('Erreur lors de l\'analyse avec GPT:', error);
    throw error;
  }
};

export default function CaptureScreen() {
  const { user } = useAuth();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [ingredients, setIngredients] = useState(testData.ingredients);
  const [isSaving, setIsSaving] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const spinValue = useRef(new Animated.Value(0)).current;

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

  const updateIngredientQuantity = (id: number, newQuantity: string) => {
    setIngredients(ingredients.map(ing => 
      ing.id === id ? { ...ing, quantite: Number(newQuantity) || ing.quantite } : ing
    ));
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
        testData.macros = analysis.macros;
        
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
    setIngredients(testData.ingredients);
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
          calories: testData.macros.calories,
          proteines: testData.macros.proteines,
          glucides: testData.macros.glucides,
          lipides: testData.macros.lipides
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
                  <Text style={styles.macroValue}>{testData.macros.calories}</Text>
                  <Text style={styles.macroLabel}>Calories</Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={styles.macroValue}>{testData.macros.proteines}g</Text>
                  <Text style={styles.macroLabel}>Protéines</Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={styles.macroValue}>{testData.macros.glucides}g</Text>
                  <Text style={styles.macroLabel}>Glucides</Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={styles.macroValue}>{testData.macros.lipides}g</Text>
                  <Text style={styles.macroLabel}>Lipides</Text>
                </View>
              </View>
            </View>

            <ScrollView style={styles.ingredientsList}>
              <Text style={styles.sectionTitle}>Ingrédients détectés</Text>
              {ingredients.map((ingredient) => (
                <View key={ingredient.id} style={styles.ingredientItem}>
                  <Text style={styles.ingredientName}>{ingredient.nom}</Text>
                  <View style={styles.quantityContainer}>
                    <TextInput
                      style={styles.quantityInput}
                      value={ingredient.quantite.toString()}
                      onChangeText={(value) => updateIngredientQuantity(ingredient.id, value)}
                      keyboardType="number-pad"
                      returnKeyType="done"
                    />
                    <Text style={styles.unitText}>{ingredient.unite}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity 
              style={[
                styles.saveButton,
                isSaving && styles.saveButtonDisabled
              ]}
              onPress={saveToSupabase}
              disabled={isSaving}
            >
              {isSaving ? (
                <View style={styles.saveButtonContent}>
                  <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <Feather name="loader" size={24} color="white" />
                  </Animated.View>
                  <Text style={[styles.saveButtonText, { marginLeft: 8 }]}>
                    Sauvegarde en cours...
                  </Text>
                </View>
              ) : (
                <Text style={styles.saveButtonText}>Enregistrer et publier</Text>
              )}
            </TouchableOpacity>

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

  return (
    <View style={styles.container}>
      <CameraView 
        ref={cameraRef}
        style={styles.camera} 
        facing={facing}
      >
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={() => router.replace('/(tabs)')}
        >
          <Feather name="x" size={32} color="white" />
        </TouchableOpacity>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.flipButton} onPress={() => setFacing(current => (current === 'back' ? 'front' : 'back'))}>
            <Feather name="refresh-ccw" size={28} color="white" />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
  },
  flipButton: {
    position: 'absolute',
    right: 30,
    bottom: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
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
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
