import { StyleSheet, View, Text, Image, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

interface Profile {
  first_name: string;
  last_name: string;
}

interface Plat {
  id: string;
  photo_url: string;
  calories: number;
  proteines: number;
  glucides: number;
  lipides: number;
  created_at: string;
  user_id: string;
  user_profile?: Profile;
}

export default function FeedScreen() {
  const { user } = useAuth();
  const [plats, setPlats] = useState<Plat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPlats = async () => {
    if (!user) return;

    try {
      // 1. Récupérer tous les plats sauf ceux de l'utilisateur connecté
      const { data: platsData, error: platsError } = await supabase
        .from('plats')
        .select('*')
        .neq('user_id', user.id) // Exclure les plats de l'utilisateur connecté
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

          console.log("profileData", profileData, plat.user_id);

          if (profileError) {
            //console.error('Erreur lors de la récupération du profil:', profileError);
            return {
              ...plat,
              user_profile: { first_name: 'Utilisateur', last_name: 'Inconnu' }
            };
          }

          return {
            ...plat,
            user_profile: profileData
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

  useEffect(() => {
    fetchPlats();
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPlats();
  }, [user]);

  const MacroBadge = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeValue}>{value}</Text>
      <Text style={styles.badgeLabel}>{label}</Text>
    </View>
  );

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
        <Text style={styles.userName}>
          {item.user_profile?.first_name} {item.user_profile?.last_name}
        </Text>
        
        <View style={styles.macrosContainer}>
          <MacroBadge label="kcal" value={item.calories} color="#FF6B6B" />
          <MacroBadge label="P" value={item.proteines} color="#4ECDC4" />
          <MacroBadge label="G" value={item.glucides} color="#45B7D1" />
          <MacroBadge label="L" value={item.lipides} color="#96CEB4" />
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
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: Colors.light.text,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 5,
  },
  badge: {
    padding: 8,
    borderRadius: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  badgeValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  badgeLabel: {
    color: 'white',
    fontSize: 12,
    marginTop: 2,
  },
});
