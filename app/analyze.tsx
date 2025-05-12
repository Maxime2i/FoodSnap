import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system';

export default function AnalyzeScreen() {
  const { photoUri } = useLocalSearchParams();

  useEffect(() => {
    if (!photoUri) return;
    const analyze = async () => {
      try {
        // Lire le fichier et l'encoder en base64
        const base64Image = await FileSystem.readAsStringAsync(photoUri as string, { encoding: FileSystem.EncodingType.Base64 });

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
                    text: "Analyze this food image and return a JSON object. Give me the name of the dish (nom_plat), and for each ingredient, provide its name, estimated quantity, and nutritional values per 100g. Use this format: { nom_plat: string, ingredients: [{ nom: string, quantite: number, unite: string, nutritionPer100g: { calories: number, proteines: number, glucides: number, lipides: number } }] }. Return ONLY the JSON, no other text."
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

        console.log(cleanedContent);
      } catch (error) {
        console.error('Erreur lors de l\'analyse :', error);
      }
    };
    analyze();
  }, [photoUri]);

  if (!photoUri) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Aucune photo reçue.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: photoUri as string }} style={styles.fullImage} resizeMode="cover" />
      <View style={styles.overlay}>
        <ActivityIndicator size="large" color="#fff" style={styles.loader} />
        <Text style={styles.loadingText}>Analyse en cours...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
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
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  loadingText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  loader: {
    marginBottom: 10,
  },
  error: {
    color: 'red',
    fontSize: 18,
  },
});
