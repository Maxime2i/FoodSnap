import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { useState, useEffect } from 'react';
import Slider from '@react-native-community/slider';
import HeaderTitle from '@/components/headerTitle';
import NutritionTable from './components/NutritionTable';

type FoodInfo = {
  food_name: string;
  serving_weight_grams: number;
  nf_calories: number;
  nf_total_carbohydrate: number;
  nf_protein: number;
  nf_total_fat: number;
  nf_sugars: number;
  nf_dietary_fiber: number;
  nf_saturated_fat: number;
  photo: {
    thumb: string;
    highres: string;
  };
};

type IndexGlycemique = {
  aliment: string;
  ig: number;
};

type ApiResponse = {
  foods: FoodInfo[];
  index_glycemique: IndexGlycemique;
};

export default function FoodDetailsScreen() {
  const { food_name, photo_url, tag_id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const [quantity, setQuantity] = useState(300);
  const [foodData, setFoodData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFoodInfo = async () => {
      try {
        const response = await fetch(`https://food-snap.vercel.app/api/food-info?query=${food_name}`);
        const data = await response.json();
        setFoodData(data);
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFoodInfo();
  }, [food_name]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  const food = foodData?.foods[0];
  const ig = foodData?.index_glycemique?.ig || 0;

  // Calcul des valeurs nutritionnelles en fonction de la quantité
  const ratio = quantity / (food?.serving_weight_grams || 100);
  const nutritionInfo = {
    calories: Math.round((food?.nf_calories || 0) * ratio),
    glucides: Math.round((food?.nf_total_carbohydrate || 0) * ratio),
    proteines: Math.round((food?.nf_protein || 0) * ratio),
    lipides: Math.round((food?.nf_total_fat || 0) * ratio),
    ig: ig,
    cg: Math.round((food?.nf_total_carbohydrate || 0) * ratio * ig / 100),
    sugars: Math.round((food?.nf_sugars || 0) * ratio),
    fibers: Math.round((food?.nf_dietary_fiber || 0) * ratio),
    saturatedFats: Math.round((food?.nf_saturated_fat || 0) * ratio)
  };

  return (
    <View style={styles.container}>
      <View style={styles.heroContainer}>
        <Image 
          source={{ uri: food?.photo?.highres || photo_url as string }} 
          style={styles.heroImage}
          resizeMode="cover"
        />
        <View style={styles.headerOverlay}>
          <HeaderTitle title={food_name as string} showBackArrow/>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoCard}>
          <View style={styles.igContainer}>
            <View style={styles.igTitleContainer}>
              <View style={[
                styles.igBadge,
                { backgroundColor: ig <= 55 ? '#4CAF50' : ig <= 70 ? '#FFC107' : '#FF5722' }
              ]}>
                <Text style={styles.igBadgeText}>
                  {ig <= 55 ? 'IG Bas' : ig <= 70 ? 'IG Moyen' : 'IG Élevé'}
                </Text>
              </View>
              <Text style={styles.categorySubtext} numberOfLines={2}>
                {foodData?.index_glycemique?.aliment || food?.food_name}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.createButton} 
              onPress={() => router.push({
                pathname: '/create-meal',
                params: {
                  initial_food: JSON.stringify({
                    name: food?.food_name,
                    quantity: quantity,
                    calories: nutritionInfo.calories,
                    carbs: nutritionInfo.glucides,
                    proteins: nutritionInfo.proteines,
                    fats: nutritionInfo.lipides,
                    glycemicImpact: nutritionInfo.cg,
                    sugars: nutritionInfo.sugars,
                    fibers: nutritionInfo.fibers,
                    saturatedFats: nutritionInfo.saturatedFats,
                    photo: food?.photo?.thumb || food?.photo?.highres || photo_url
                  })
                }
              })}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Créer un repas</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.quantitySection}>
            <Text style={styles.sectionTitle}>Quantité</Text>
            <View style={styles.quantityControl}>
              <TouchableOpacity onPress={() => setQuantity(Math.max(0, quantity - 50))}>
                <Ionicons name="remove" size={24} color="#4a90e2" />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}g</Text>
              <TouchableOpacity onPress={() => setQuantity(quantity + 50)}>
                <Ionicons name="add" size={24} color="#4a90e2" />
              </TouchableOpacity>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1000}
              value={quantity}
              onValueChange={(value) => setQuantity(Math.round(value))}
              onSlidingComplete={(value) => setQuantity(Math.round(value))}
              minimumTrackTintColor="#4a90e2"
              maximumTrackTintColor="#ddd"
              step={50}
            />
          </View>

          <NutritionTable
            calories={nutritionInfo.calories}
            glucides={nutritionInfo.glucides}
            sucres={Math.round((food?.nf_sugars || 0) * ratio)}
            fibres={Math.round((food?.nf_dietary_fiber || 0) * ratio)}
            proteines={nutritionInfo.proteines}
            lipides={nutritionInfo.lipides}
            satures={Math.round((food?.nf_saturated_fat || 0) * ratio)}
          />

          {nutritionInfo.ig && (
          <View style={styles.impactSection}>
            <Text style={styles.sectionTitle}>Impact glycémique</Text>
            <View style={styles.impactCard}>
              <View style={styles.glycemicMetrics}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Index glycémique</Text>
                  <View style={[styles.metricValue, { backgroundColor: ig <= 55 ? '#E8F5E9' : ig <= 70 ? '#FFF3E0' : '#FBE9E7' }]}>
                    <Text style={styles.metricNumber}>{nutritionInfo.ig}</Text>
                  </View>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Charge glycémique</Text>
                  <View style={[styles.metricValue, { backgroundColor: '#FFF8E1' }]}>
                    <Text style={styles.metricNumber}>{nutritionInfo.cg}</Text>
                  </View>
                </View>
              </View>

              
            </View>
          </View>

          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroContainer: {
    height: 200,
    width: '100%',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 16,
    flex: 1,
    marginRight: 16,
  },
  backButton: {
    padding: 8,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    padding: 20,
    paddingBottom: 40,
  },
  igContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    marginTop: 12,
  },
  igTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  igBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  igBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  categorySubtext: {
    fontSize: 16,
    color: '#666',
    flexShrink: 1,
  },
  createButton: {
    backgroundColor: '#4a90e2',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 4,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  nutritionTable: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  subRow: {
    paddingLeft: 20,
  },
  nutritionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  nutritionSubLabel: {
    fontSize: 14,
    color: '#666',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  quantitySection: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  impactSection: {
    marginTop: 24,
  },
  glycemicMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  metricValue: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 20,
    fontWeight: '600',
  },
  impactEstimate: {
    marginBottom: 24,
  },
  impactLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  impactBar: {
    height: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  impactProgress: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  impactValue: {
    fontSize: 14,
    color: '#666',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  warningText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#F57C00',
    lineHeight: 20,
  },
  alternativesButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  alternativesText: {
    fontSize: 16,
    color: '#4a90e2',
    fontWeight: '500',
  },
  impactCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
}); 