import { StyleSheet, View, Text, Image, ScrollView, ActivityIndicator, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';

interface Ingredient {
  nom: string;
  quantite: number;
  unite: string;
}

interface PlatDetail {
  id: string;
  name: string;
  description: string;
  photo_url: string;
  calories: number;
  proteines: number;
  glucides: number;
  lipides: number;
  created_at: string;
  user_id: string;
  user_profile?: {
    first_name: string;
    last_name: string;
  };
  ingredients: Ingredient[];
  likes_count: number;
  is_liked: boolean;
}

export default function PlatDetailScreen() {
  const colorScheme = useColorScheme();
  const { id } = useLocalSearchParams();
  const [plat, setPlat] = useState<PlatDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [likeLoading, setLikeLoading] = useState(false);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);

  useEffect(() => {
    fetchPlatDetail();
  }, [id]);

  const fetchPlatDetail = async () => {
    try {
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      // 1. Récupérer le plat
      const { data: platData, error: platError } = await supabase
        .from('plats')
        .select('*')
        .eq('id', id)
        .single();

      if (platError) throw platError;

      // 2. Récupérer le nombre total de likes
      const { count: likesCount } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('plat_id', id);

      // 3. Vérifier si l'utilisateur a liké
      const { data: userLike } = await supabase
        .from('likes')
        .select('id')
        .eq('plat_id', id)
        .eq('user_id', session.session?.user.id)
        .maybeSingle();

      // 4. Récupérer le profil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', platData.user_id)
        .single();

      if (profileError) {
        //console.error('Erreur lors de la récupération du profil:', profileError);
      }

      // 5. Récupérer les ingrédients
      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from('plats_ingredients')
        .select('*')
        .eq('plat_id', id);

      if (ingredientsError) throw ingredientsError;

      setPlat({
        ...platData,
        user_profile: profileError ? undefined : profileData,
        ingredients: ingredientsData || [],
        likes_count: likesCount || 0,
        is_liked: !!userLike
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du plat:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!plat || likeLoading) return;
    
    setLikeLoading(true);
    try {
      if (plat.is_liked) {
        // Supprimer le like
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('plat_id', plat.id);
        
        if (error) throw error;
        
        setPlat({
          ...plat,
          is_liked: false,
          likes_count: plat.likes_count - 1
        });
      } else {
        // Ajouter le like
        const { data: session } = await supabase.auth.getSession();
        const { error } = await supabase
          .from('likes')
          .insert({ 
            plat_id: plat.id,
            user_id: session.session?.user.id 
          });
        
        if (error) throw error;
        
        setPlat({
          ...plat,
          is_liked: true,
          likes_count: plat.likes_count + 1
        });
      }
    } catch (error) {
      console.error('Erreur lors du like:', error);
    } finally {
      setLikeLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={getStyles(colorScheme).container}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  if (!plat) {
    return (
      <View style={getStyles(colorScheme).container}>
        <Text style={getStyles(colorScheme).errorText}>Plat non trouvé</Text>
      </View>
    );
  }

  return (
    <View style={getStyles(colorScheme).container}>
      <TouchableOpacity 
        style={getStyles(colorScheme).backButton}
        onPress={() => router.back()}
      >
        <Ionicons 
          name="arrow-back" 
          size={24} 
          color={colorScheme === 'dark' ? Colors.dark.text : Colors.light.text} 
        />
      </TouchableOpacity>

      <ScrollView style={getStyles(colorScheme).resultContainer}>
        <TouchableOpacity onPress={() => setIsImageModalVisible(true)}>
          <Image source={{ uri: plat.photo_url }} style={getStyles(colorScheme).thumbnailImage} />
        </TouchableOpacity>
        
        <View style={getStyles(colorScheme).headerContainer}>
          <View style={getStyles(colorScheme).titleContainer}>
            <Text style={getStyles(colorScheme).platName}>{plat.name}</Text>
            <Text style={getStyles(colorScheme).userName}>
              {plat.user_profile?.first_name} {plat.user_profile?.last_name}
            </Text>
          </View>
          <TouchableOpacity 
            style={getStyles(colorScheme).likeButton} 
            onPress={handleLike}
            disabled={likeLoading}
          >
            <Ionicons 
              name={plat.is_liked ? "heart" : "heart-outline"} 
              size={24} 
              color={plat.is_liked ? Colors.light.tint : "#666"} 
            />
            <Text style={getStyles(colorScheme).likeCount}>{plat.likes_count}</Text>
          </TouchableOpacity>
        </View>

        <View style={getStyles(colorScheme).macrosContainer}>
          <Text style={getStyles(colorScheme).sectionTitle}>Valeurs nutritionnelles</Text>
          <View style={getStyles(colorScheme).macrosGrid}>
            <View style={[getStyles(colorScheme).macroItem, {backgroundColor: "#ffd8a1"}]}>
              <Text style={getStyles(colorScheme).macroLabel}>Calories</Text>
              <Text style={getStyles(colorScheme).macroValue}>{plat.calories}</Text>
              <Text style={getStyles(colorScheme).macroUnit}>kcal</Text>
            </View>
            <View style={[getStyles(colorScheme).macroItem, {backgroundColor: "#e8f0ff"}]}>
              <Text style={getStyles(colorScheme).macroLabel}>Glucides</Text>
              <Text style={getStyles(colorScheme).macroValue}>{plat.glucides}</Text>
              <Text style={getStyles(colorScheme).macroUnit}>g</Text>
            </View>
            <View style={[getStyles(colorScheme).macroItem, {backgroundColor: "#e8fff0"}]}>
              <Text style={getStyles(colorScheme).macroLabel}>Protéines</Text>
              <Text style={getStyles(colorScheme).macroValue}>{plat.proteines}</Text>
              <Text style={getStyles(colorScheme).macroUnit}>g</Text>
            </View>
            <View style={[getStyles(colorScheme).macroItem, {backgroundColor: "#fff8e8"}]}>
              <Text style={getStyles(colorScheme).macroLabel}>Lipides</Text>
              <Text style={getStyles(colorScheme).macroValue}>{plat.lipides}</Text>
              <Text style={getStyles(colorScheme).macroUnit}>g</Text>
            </View>
          </View>
        </View>

        {plat.description && (
          <View style={getStyles(colorScheme).descriptionContainer}>
            <Text style={getStyles(colorScheme).sectionTitle}>Description</Text>
            <Text style={getStyles(colorScheme).descriptionText}>{plat.description}</Text>
          </View>
        )}

        {plat.ingredients.length > 0 && (
          <View style={getStyles(colorScheme).ingredientsContainer}>
            <Text style={getStyles(colorScheme).sectionTitle}>Ingrédients</Text>
            {plat.ingredients.map((ingredient, index) => (
              <View key={index} style={getStyles(colorScheme).ingredientItem}>
                <Text style={getStyles(colorScheme).ingredientBullet}>•</Text>
                <Text style={getStyles(colorScheme).ingredientText}>
                  {ingredient.quantite} {ingredient.unite} {ingredient.nom}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>


      <Modal
        visible={isImageModalVisible}
        transparent={true}
        onRequestClose={() => setIsImageModalVisible(false)}
      >
        <TouchableOpacity 
          style={getStyles(colorScheme).modalContainer}
          activeOpacity={1}
          onPress={() => setIsImageModalVisible(false)}
        >
          <Image 
            source={{ uri: plat?.photo_url }} 
            style={getStyles(colorScheme).fullScreenImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
  },
  resultContainer: {
    flex: 1,
  },
  thumbnailImage: {
    width: '100%',
    height: 250,
  },
  userName: {
    fontSize: 16,
    color: colorScheme === 'dark' ? Colors.dark.text : '#666666',
  },
  titleContainer: {
    flex: 1,
    marginRight: 15,
  },
  platName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    marginBottom: 4,
  },
  macrosContainer: {
    padding: 6,
    margin: 10,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    padding: 15,
    borderRadius: 10,
    gap: 6,
    alignItems: 'center',
  },
  macroItem: {
    alignItems: 'center',
    padding: 6,
    borderRadius: 8,
    minWidth: 80,
  },
  macroValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  macroLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  macroUnit: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  descriptionContainer: {
    padding: 15,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    marginBottom: 15,
  },
  descriptionText: {
    fontSize: 16,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    lineHeight: 24,
  },
  ingredientsContainer: {
    padding: 15,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  ingredientBullet: {
    fontSize: 20,
    color: '#666666',
    marginRight: 10,
  },
  ingredientText: {
    fontSize: 16,
    color: '#666666',
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  likeCount: {
    marginLeft: 5,
    fontSize: 16,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 15,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
}); 