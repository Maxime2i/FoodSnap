import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from "react-native";
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import NutritionTable from './components/NutritionTable';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from "@/hooks/useColorScheme";
import HeaderTitle from "@/components/headerTitle";

interface NutriScoreData {
  grade: string;
  score: number;
  data: {
    negative_points: number;
    positive_points: number;
    components: {
      negative: Array<{
        id: string;
        points: number;
        value: number;
        unit: string;
      }>;
      positive: Array<{
        id: string;
        points: number;
        value: number;
        unit: string;
      }>;
    };
  };
}

interface NutriScore {
  [year: string]: NutriScoreData;
}

interface ProductData {
  product: {
    product_name: string;
    brands: string;
    ingredients_text: string;
    image_url: string;
    nutriscore: NutriScore;
    nutriments: {
      energy_100g: number;
      'energy-kcal_100g': number;
      proteins_100g: number;
      carbohydrates_100g: number;
      fat_100g: number;
      fiber_100g: number;
      'saturated-fat_100g': number;
      sugars_100g: number;
      salt_100g: number;
      sodium_100g: number;
    };
  };
  status: number;
}

export default function ProductScreen() {
  const { code } = useLocalSearchParams();
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  useEffect(() => {
    if (!code) return;
    setLoading(true);
    fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`)
      .then(res => res.json())
      .then(data => setProductData(data))
      .catch(() => setProductData(null))
      .finally(() => setLoading(false));
  }, [code]);

  const handleBackToCapture = () => {
    router.push('/(tabs)/capture');
  };

  const getMostRecentNutriScore = (nutriscore: NutriScore) => {
    if (!nutriscore) return null;
    const years = Object.keys(nutriscore).sort().reverse();
    return years.length > 0 ? { year: years[0], data: nutriscore[years[0]] } : null;
  };

  if (loading) return <Text>Chargement...</Text>;
  if (!productData || productData.status !== 1) return <Text>Produit non trouvé</Text>;

  return (
    <SafeAreaView style={getStyles(colorScheme).productScreen}>
      <View style={getStyles(colorScheme).header}>
        <HeaderTitle title="Détails du produit" showBackArrow/>
      </View>
      <ScrollView style={getStyles(colorScheme).scrollView} contentContainerStyle={getStyles(colorScheme).scrollContent}>
        {productData?.product.image_url && (
          <Image
            source={{ uri: productData.product.image_url }}
            style={getStyles(colorScheme).productImage}
            resizeMode="contain"
          />
        )}
        <View style={getStyles(colorScheme).contentContainer}>
          <Text style={getStyles(colorScheme).productTitle}>{productData?.product.product_name}</Text>
          <Text style={getStyles(colorScheme).brandText}>Marque: {productData?.product.brands}</Text>

          {productData?.product.nutriscore && (
            <View style={getStyles(colorScheme).nutriscoreContainer}>
              {(() => {
                const nutriscoreInfo = getMostRecentNutriScore(productData.product.nutriscore);
                if (nutriscoreInfo) {
                  const gradeColor = {
                    'a': '#038141',
                    'b': '#85BB2F',
                    'c': '#FECB02',
                    'd': '#EE8100',
                    'e': '#E63E11'
                  }[nutriscoreInfo.data.grade.toLowerCase()] || '#2ecc71';

                  return (
                    <>
                      <Text style={getStyles(colorScheme).nutriscoreTitle}>
                        Nutri-Score ({nutriscoreInfo.year})
                      </Text>
                      <Text style={[getStyles(colorScheme).nutriscoreGrade, { color: gradeColor }]}> 
                        {nutriscoreInfo.data.grade.toUpperCase()}
                      </Text>
                    </>
                  );
                }
                return null;
              })()}
            </View>
          )}

          <View style={getStyles(colorScheme).section}>
            <Text style={getStyles(colorScheme).sectionTitle}>Ingrédients</Text>
            <Text style={getStyles(colorScheme).sectionText}>{productData?.product.ingredients_text}</Text>
          </View>

          <View style={getStyles(colorScheme).section}>
            <Text style={getStyles(colorScheme).sectionTitle}>Valeurs nutritionnelles</Text>
            <Text style={getStyles(colorScheme).sectionSubtitle}>(pour 100g)</Text>
            <NutritionTable
              calories={productData?.product.nutriments['energy-kcal_100g'] || 0}
              glucides={productData?.product.nutriments.carbohydrates_100g || 0}
              sucres={productData?.product.nutriments.sugars_100g || 0}
              fibres={productData?.product.nutriments.fiber_100g || 0}
              proteines={productData?.product.nutriments.proteins_100g || 0}
              lipides={productData?.product.nutriments.fat_100g || 0}
              satures={productData?.product.nutriments['saturated-fat_100g'] || 0}
            />
          </View>
        </View>
      </ScrollView>

       <TouchableOpacity style={getStyles(colorScheme).scanButton} onPress={() => router.push('/camera')}>
        <Feather name="camera" size={24} color={colorScheme === 'dark' ? Colors.dark.text : Colors.light.text} style={getStyles(colorScheme).scanIcon} />
        <Text style={getStyles(colorScheme).scanButtonText}>Scanner un nouveau produit</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const getStyles = (colorScheme: string) => StyleSheet.create({
productScreen: {
    flex: 1,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  contentContainer: {
    padding: 16,
  },
  productImage: {
    width: '100%',
    height: 300,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  brandText: {
    fontSize: 16,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    marginBottom: 24,
  },
  nutriscoreContainer: {
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  nutriscoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  nutriscoreGrade: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    marginBottom: 16,
  },
  sectionText: {
    fontSize: 16,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    lineHeight: 24,
  },
  nutrientsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  nutrientItem: {
    width: '50%',
    padding: 8,
  },
  nutrientValue: {
    fontSize: 20,
    fontWeight: '600',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  nutrientLabel: {
    fontSize: 14,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    marginTop: 4,
  },
   scanButton: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.primary : Colors.light.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  scanButtonText: {
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  scanIcon: {
    marginRight: 8,
  },
});
