import { StyleSheet, View, Text, FlatList, Image, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';

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
  likes_count: number;
  type: string;
}

const MacroColors = {
  calories: '#FF6B6B',  // Rouge
  glucides: '#4ECDC4', // Turquoise
  proteines: '#45B7D1', // Bleu
  lipides: '#96C93D',  // Vert
};

export default function MyMealsScreen() {
  const { user } = useAuth();
  const [plats, setPlats] = useState<Plat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPlats = async () => {
    if (!user) return;

    try {
      // Récupérer les plats de l'utilisateur connecté
      const { data: platsData, error: platsError } = await supabase
        .from('plats')
        .select(`
          *,
          likes:likes(count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (platsError) throw platsError;

      // Transformer les données pour inclure le nombre de likes
      const platsWithLikes = (platsData || []).map(plat => ({
        ...plat,
        likes_count: plat.likes?.[0]?.count || 0
      }));

      setPlats(platsWithLikes);
    } catch (error) {
      console.error('Erreur lors de la récupération des plats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPlats();
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
          <View>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardDescription}>{item.description}</Text>
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Mes Repas</Text>
          <View style={styles.backButton} />
        </View>
        <Text style={styles.emptyText}>Vous n'avez pas encore publié de plats</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Mes Repas</Text>
        <View style={styles.backButton} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.light.background,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
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
});
