import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

type FoodItem = {
  name: string;
  quantity: number;
  calories: number;
  carbs: number;
  proteins: number;
  fats: number;
  glycemicImpact: number;
  photo?: string;
};

type Meal = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  total_calories: number;
  total_carbs: number;
  total_proteins: number;
  total_fats: number;
  glycemic_index: number;
  glycemic_load: number;
  foods: FoodItem[];
};

const MealCard = ({
  meal
}: { meal: Meal }) => {
  const displayedFoods = meal.foods.slice(0, 3);
  const extraCount = meal.foods.length - displayedFoods.length;
  const colorScheme = useColorScheme();

  return (
    <TouchableOpacity style={getStyles(colorScheme).card} onPress={() => router.push(`/meal-detail?id=${meal.id}`)}>
      <View style={getStyles(colorScheme).header}>
        <Text style={getStyles(colorScheme).title}>{meal.name}</Text>
        <View style={getStyles(colorScheme).badge}>
          <Text style={getStyles(colorScheme).badgeText}>{Math.round(meal.total_carbs)} g glucides</Text>
        </View>
      </View>
      <View style={getStyles(colorScheme).subHeader}>
        <Text style={getStyles(colorScheme).time}>{new Date(meal.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
        <Text style={getStyles(colorScheme).dot}>•</Text>
        <Text style={getStyles(colorScheme).date}>{new Date(meal.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
      </View>
      <View style={getStyles(colorScheme).separator} />
      <View style={getStyles(colorScheme).avatarsRow}>
        {displayedFoods.map((food, idx) => (
          <View key={idx} style={getStyles(colorScheme).avatarPlaceholder}>
            {food.photo ? (
              <Image
                source={{ uri: food.photo }}
                style={{ width: 28, height: 28, borderRadius: 14 }}
              />
            ) : (
              <Text>{food.name[0]}</Text>
            )}
          </View>
        ))}
        {extraCount > 0 && (
          <View style={getStyles(colorScheme).avatarPlaceholder}>
            <Text style={getStyles(colorScheme).plusText}>+{extraCount}</Text>
          </View>
        )}
        <Text style={getStyles(colorScheme).arrow}>→</Text>
      </View>
    </TouchableOpacity>
  );
};


const getStyles = (colorScheme: string) =>
  StyleSheet.create({
  card: {
    backgroundColor: colorScheme === 'light' ? '#fff' : '#1c1c1c',
    borderRadius: 12,
    padding: 16,
    margin: 4,
    shadowColor: colorScheme === 'light' ? '#000' : '#fff',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 17,
    color: colorScheme === 'light' ? '#000' : '#fff',
  },
  badge: {
    backgroundColor: colorScheme === 'light' ? '#e6f0ff' : '#2c2c2c',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  badgeText: {
    color: colorScheme === 'light' ? '#338bff' : '#338bff',
    fontWeight: '600',
    fontSize: 13,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  time: {
    color: colorScheme === 'light' ? '#888' : '#fff',
    fontSize: 13,
  },
  dot: {
    marginHorizontal: 6,
    color: colorScheme === 'light' ? '#888' : '#fff',
    fontSize: 13,
  },
  date: {
    color: colorScheme === 'light' ? '#888' : '#fff',
    fontSize: 13,
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colorScheme === 'light' ? '#f0f0f0' : '#2c2c2c',
    marginRight: -8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colorScheme === 'light' ? '#fff' : '#2c2c2c',
    overflow: 'hidden',
  },
  plusText: {
    color: colorScheme === 'light' ? '#338bff' : '#338bff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  arrow: {
    marginLeft: 'auto',
    fontSize: 20,
    color: colorScheme === 'light' ? 'black' : 'white',
  },
  separator: {
    borderBottomColor: colorScheme === 'light' ? '#e0e0e0' : '#2c2c2c',
    borderBottomWidth: 1,
    marginVertical: 2,
  },
});

export default MealCard;
