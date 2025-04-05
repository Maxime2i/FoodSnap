import { StyleSheet, View, Text, FlatList, Image, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';

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
  const colorScheme = useColorScheme();
  
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
      style={getStyles(colorScheme).card}
      onPress={() => router.push(`/meal-detail?id=${item.id}`)}
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: item.photo_url }} 
        style={getStyles(colorScheme).photo}
        resizeMode="cover"
      />
      {item.type && (
        <View style={getStyles(colorScheme).cardOverlay}>
          <View style={getStyles(colorScheme).typeContainer}>
            <Text style={getStyles(colorScheme).typeText}>{item.type}</Text>
          </View>
        </View>
      )}
      <View style={getStyles(colorScheme).cardContent}>
        <View style={getStyles(colorScheme).titleContainer}>
          <View>
            <Text style={getStyles(colorScheme).cardTitle}>{item.name}</Text>
            {item.description && <Text style={getStyles(colorScheme).cardDescription}>{item.description}</Text>}
          </View>
        </View>
        <View style={getStyles(colorScheme).statsContainer}>
          <View style={getStyles(colorScheme).macrosContainer}>
            <View style={getStyles(colorScheme).macroItem}>
              <Text style={[getStyles(colorScheme).macroValue, { color: MacroColors.calories }]}>{item.calories}</Text>
              <Text style={[getStyles(colorScheme).macroLabel, { color: MacroColors.calories }]}>calories</Text>
            </View>
            <View style={getStyles(colorScheme).macroItem}>
              <Text style={[getStyles(colorScheme).macroValue, { color: MacroColors.glucides }]}>{item.glucides}g</Text>
              <Text style={[getStyles(colorScheme).macroLabel, { color: MacroColors.glucides }]}>glucides</Text>
            </View>
            <View style={getStyles(colorScheme).macroItem}>
              <Text style={[getStyles(colorScheme).macroValue, { color: MacroColors.proteines }]}>{item.proteines}g</Text>
              <Text style={[getStyles(colorScheme).macroLabel, { color: MacroColors.proteines }]}>protéines</Text>
            </View>
            <View style={getStyles(colorScheme).macroItem}>
              <Text style={[getStyles(colorScheme).macroValue, { color: MacroColors.lipides }]}>{item.lipides}g</Text>
              <Text style={[getStyles(colorScheme).macroLabel, { color: MacroColors.lipides }]}>lipides</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={getStyles(colorScheme).voirButton}
            onPress={() => router.push(`/meal-detail?id=${item.id}`)}
          >
            <Text style={getStyles(colorScheme).voirText}>Voir</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.light.tint} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={getStyles(colorScheme).container}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  if (plats.length === 0) {
    return (
      <View style={[getStyles(colorScheme).container, getStyles(colorScheme).emptyContainer]}>
        <View style={getStyles(colorScheme).header}>
          <TouchableOpacity onPress={() => router.back()} style={getStyles(colorScheme).backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={getStyles(colorScheme).title}>Mes Repas</Text>
          <View style={getStyles(colorScheme).backButton} />
        </View>
        <Text style={getStyles(colorScheme).emptyText}>Vous n'avez pas encore publié de plats</Text>
      </View>
    );
  }

  return (
    <View style={getStyles(colorScheme).container}>
      <View style={getStyles(colorScheme).header}>
        <TouchableOpacity onPress={() => router.back()} style={getStyles(colorScheme).backButton}>
          <Ionicons name="arrow-back" size={24} color={colorScheme === 'dark' ? Colors.dark.text : Colors.light.text} />
        </TouchableOpacity>
        <Text style={getStyles(colorScheme).title}>Mes Repas</Text>
        <View style={getStyles(colorScheme).backButton} />
      </View>
      <FlatList
        data={plats}
        renderItem={renderPlat}
        keyExtractor={(item) => item.id}
        contentContainerStyle={getStyles(colorScheme).list}
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

const getStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
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
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    textAlign: 'center',
  },
  list: {
    padding: 10,
  },
  card: {
    backgroundColor: colorScheme === 'dark' ? '#121212' : '#fff',
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
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
    backgroundColor: colorScheme === 'dark' ? '#121212' : '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeText: {
    color: colorScheme === 'dark' ? '#2E7D32' : '#2E7D32',
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
    color: colorScheme === 'dark' ? '#fff' : '#000',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: colorScheme === 'dark' ? '#666' : '#000',
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
