import { StyleSheet, View, Text, FlatList, Image, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

interface Plat {
  id: string;
  photo_url: string;
  calories: number;
  proteines: number;
  glucides: number;
  lipides: number;
  created_at: string;
  likes_count: number;
}

export default function ReviewScreen() {
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
      onPress={() => router.push(`/plat-detail?id=${item.id}`)}
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: item.photo_url }} 
        style={styles.photo}
        resizeMode="cover"
      />
      <View style={styles.cardContent}>
        <View style={styles.statsContainer}>
          <View style={styles.macrosContainer}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{item.calories}</Text>
              <Text style={styles.macroLabel}>kcal</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{item.proteines}g</Text>
              <Text style={styles.macroLabel}>Prot.</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{item.glucides}g</Text>
              <Text style={styles.macroLabel}>Gluc.</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{item.lipides}g</Text>
              <Text style={styles.macroLabel}>Lip.</Text>
            </View>
          </View>
          <View style={styles.likesContainer}>
            <Text style={styles.likesCount}>{item.likes_count}</Text>
            <Text style={styles.likesLabel}>❤️</Text>
          </View>
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
        <Text style={styles.emptyText}>Vous n'avez pas encore publié de plats</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  photo: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  cardContent: {
    padding: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macrosContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.tint,
  },
  macroLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likesCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  likesLabel: {
    fontSize: 16,
  },
});
