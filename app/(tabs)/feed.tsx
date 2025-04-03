import { StyleSheet, View, Text, Image, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';

interface Profile {
  first_name: string;
  last_name: string;
}

interface Plat {
  id: string;
  photo_url: string;
  name: string;
  description: string;
  calories: number;
  proteines: number;
  glucides: number;
  lipides: number;
  created_at: string;
  user_id: string;
  user_profile?: Profile;
  type: string;
  likes_count: number;
}

const MacroColors = {
  calories: '#FF6B6B',  // Rouge
  glucides: '#4ECDC4', // Turquoise
  proteines: '#45B7D1', // Bleu
  lipides: '#96C93D',  // Vert
};

export default function FeedScreen() {
  const { user } = useAuth();
  const [plats, setPlats] = useState<Plat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [likedPlats, setLikedPlats] = useState<Set<string>>(new Set());
  const colorScheme = useColorScheme();

  const fetchPlats = async () => {
    if (!user) return;

    try {
      // 1. Récupérer tous les plats publiés sauf ceux de l'utilisateur connecté
      const { data: platsData, error: platsError } = await supabase
        .from('plats')
        .select(`
          *,
          likes:likes(count)
        `)
        .neq('user_id', user.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (platsError) throw platsError;

      // 2. Pour chaque plat, récupérer le profil de l'utilisateur
      const platsWithProfiles = await Promise.all(
        (platsData || []).map(async (plat) => {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', plat.user_id)
            .single();

          return {
            ...plat,
            likes_count: plat.likes?.[0]?.count || 0,
            user_profile: profileError ? { first_name: 'Utilisateur', last_name: 'Inconnu' } : profileData
          };
        })
      );

      setPlats(platsWithProfiles);
    } catch (error) {
      console.error('Erreur lors de la récupération des plats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUserLikes = async () => {
    if (!user) return;

    try {
      const { data: likes, error } = await supabase
        .from('likes')
        .select('plat_id')
        .eq('user_id', user.id);

      if (error) throw error;

      setLikedPlats(new Set(likes?.map(like => like.plat_id)));
    } catch (error) {
      console.error('Erreur lors de la récupération des likes:', error);
    }
  };

  const toggleLike = async (platId: string) => {
    if (!user) return;

    try {
      const isLiked = likedPlats.has(platId);

      if (isLiked) {
        // Supprimer le like
        await supabase
          .from('likes')
          .delete()
          .eq('plat_id', platId)
          .eq('user_id', user.id);

        setLikedPlats(prev => {
          const newSet = new Set(prev);
          newSet.delete(platId);
          return newSet;
        });

        setPlats(prev =>
          prev.map(plat =>
            plat.id === platId
              ? { ...plat, likes_count: Math.max(0, plat.likes_count - 1) }
              : plat
          )
        );
      } else {
        // Ajouter le like
        await supabase
          .from('likes')
          .insert([{ plat_id: platId, user_id: user.id }]);

        setLikedPlats(prev => new Set([...prev, platId]));

        setPlats(prev =>
          prev.map(plat =>
            plat.id === platId
              ? { ...plat, likes_count: plat.likes_count + 1 }
              : plat
          )
        );
      }
    } catch (error) {
      console.error('Erreur lors du like/unlike:', error);
    }
  };

  useEffect(() => {
    fetchPlats();
    fetchUserLikes();
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPlats();
  }, [user]);

  const renderPlat = ({ item }: { item: Plat }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/meal-detail?id=${item.id}`)}
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: item.photo_url }} 
        style={styles.photo}
        resizeMode="cover"
      />
      {item.type && (
        <View style={styles.cardOverlay}>
          <View style={styles.typeContainer}>
            <Text style={styles.typeText}>{item.type}</Text>
          </View>
        </View>
      )}
      <View style={styles.cardContent}>
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.userName}>
                {item.user_profile?.first_name} {item.user_profile?.last_name}
              </Text>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardDescription}>{item.description}</Text>
            </View>
            <TouchableOpacity 
              style={styles.likeButton}
              onPress={(e) => {
                e.stopPropagation();
                toggleLike(item.id);
              }}
            >
              <Ionicons 
                name={likedPlats.has(item.id) ? "heart" : "heart-outline"} 
                size={24} 
                color={likedPlats.has(item.id) ? "#FF6B6B" : Colors.light.text} 
              />
              <Text style={styles.likeCount}>{item.likes_count}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.macrosContainer}>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: MacroColors.calories }]}>{item.calories}</Text>
              <Text style={[styles.macroLabel, { color: MacroColors.calories }]}>calories</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: MacroColors.glucides }]}>{item.glucides}g</Text>
              <Text style={[styles.macroLabel, { color: MacroColors.glucides }]}>glucides</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: MacroColors.proteines }]}>{item.proteines}g</Text>
              <Text style={[styles.macroLabel, { color: MacroColors.proteines }]}>protéines</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: MacroColors.lipides }]}>{item.lipides}g</Text>
              <Text style={[styles.macroLabel, { color: MacroColors.lipides }]}>lipides</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.voirButton}
            onPress={() => router.push(`/meal-detail?id=${item.id}`)}
          >
            <Text style={styles.voirText}>Voir</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.light.tint} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  if (plats.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text style={styles.emptyText}>Aucun plat à afficher pour le moment</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Feed</Text>
      </View>
      <FlatList
        data={plats}
        renderItem={renderPlat}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.tint}
            colors={[Colors.light.tint]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.text,
    textAlign: 'center',
  },
  list: {
    padding: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 200,
  },
  cardOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 12,
  },
  typeContainer: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
  },
  cardContent: {
    padding: 16,
  },
  titleContainer: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userName: {
    fontSize: 14,
    color: Colors.light.tint,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  macrosContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  macroItem: {
    alignItems: 'flex-start',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  macroLabel: {
    fontSize: 14,
    opacity: 0.8,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 4,
  },
  likeCount: {
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 4,
  },
  voirButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  voirText: {
    fontSize: 16,
    color: Colors.light.tint,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 10,
    backgroundColor: Colors.light.background,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
});
