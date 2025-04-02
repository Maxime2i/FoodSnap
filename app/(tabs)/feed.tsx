import { StyleSheet, View, Text, Image, FlatList, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';

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
  const [plats, setPlats] = useState<Plat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlats();
  }, []);

  const fetchPlats = async () => {
    try {
      // 1. Récupérer d'abord tous les plats
      const { data: platsData, error: platsError } = await supabase
        .from('plats')
        .select('*')
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

          console.log(profileData);
          if (profileError) {
            console.error('Erreur lors de la récupération du profil:', profileError);
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
    }
  };

  const MacroBadge = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeValue}>{value}</Text>
      <Text style={styles.badgeLabel}>{label}</Text>
    </View>
  );

  const renderPlat = ({ item }: { item: Plat }) => (
    <View style={styles.card}>
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
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
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
