import { StyleSheet, View, Text, Image, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

interface Ingredient {
  nom: string;
  quantite: number;
  unite: string;
}

interface PlatDetail {
  id: string;
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
  const { id } = useLocalSearchParams();
  const [plat, setPlat] = useState<PlatDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [likeLoading, setLikeLoading] = useState(false);

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
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  if (!plat) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Plat non trouvé</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.resultContainer}>
        <Image source={{ uri: plat.photo_url }} style={styles.thumbnailImage} />
        
        <View style={styles.headerContainer}>
          <Text style={styles.userName}>
            {plat.user_profile?.first_name} {plat.user_profile?.last_name}
          </Text>
          <TouchableOpacity 
            style={styles.likeButton} 
            onPress={handleLike}
            disabled={likeLoading}
          >
            <Ionicons 
              name={plat.is_liked ? "heart" : "heart-outline"} 
              size={24} 
              color={plat.is_liked ? Colors.light.tint : "#666"} 
            />
            <Text style={styles.likeCount}>{plat.likes_count}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.macrosContainer}>
          <Text style={styles.sectionTitle}>Valeurs nutritionnelles</Text>
          <View style={styles.macrosGrid}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{plat.calories}</Text>
              <Text style={styles.macroLabel}>Calories</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{plat.proteines}g</Text>
              <Text style={styles.macroLabel}>Protéines</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{plat.glucides}g</Text>
              <Text style={styles.macroLabel}>Glucides</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{plat.lipides}g</Text>
              <Text style={styles.macroLabel}>Lipides</Text>
            </View>
          </View>
        </View>

        <View style={styles.ingredientsContainer}>
          <Text style={styles.sectionTitle}>Ingrédients</Text>
          {plat.ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientItem}>
              <Text style={styles.ingredientName}>{ingredient.nom}</Text>
              <Text style={styles.ingredientQuantity}>
                {ingredient.quantite} {ingredient.unite}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  resultContainer: {
    flex: 1,
  },
  thumbnailImage: {
    width: '100%',
    height: 250,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 15,
    color: Colors.light.text,
  },
  macrosContainer: {
    padding: 15,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: Colors.light.text,
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
  ingredientsContainer: {
    padding: 15,
    backgroundColor: '#fff',
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
    color: Colors.light.text,
  },
  ingredientQuantity: {
    fontSize: 16,
    color: '#666',
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
    color: '#666',
  },
}); 