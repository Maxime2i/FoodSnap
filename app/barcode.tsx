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
    <SafeAreaView style={styles.productScreen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToCapture} style={styles.backButton}>
          <Feather name="x" size={32} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails du produit</Text>
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {productData?.product.image_url && (
          <Image
            source={{ uri: productData.product.image_url }}
            style={styles.productImage}
            resizeMode="contain"
          />
        )}
        <View style={styles.contentContainer}>
          <Text style={styles.productTitle}>{productData?.product.product_name}</Text>
          <Text style={styles.brandText}>Marque: {productData?.product.brands}</Text>

          {productData?.product.nutriscore && (
            <View style={styles.nutriscoreContainer}>
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
                      <Text style={styles.nutriscoreTitle}>
                        Nutri-Score ({nutriscoreInfo.year})
                      </Text>
                      <Text style={[styles.nutriscoreGrade, { color: gradeColor }]}> 
                        {nutriscoreInfo.data.grade.toUpperCase()}
                      </Text>
                    </>
                  );
                }
                return null;
              })()}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingrédients</Text>
            <Text style={styles.sectionText}>{productData?.product.ingredients_text}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Valeurs nutritionnelles</Text>
            <Text style={styles.sectionSubtitle}>(pour 100g)</Text>
            <View style={styles.nutrientsGrid}>
              <View style={styles.nutrientItem}>
                <Text style={styles.nutrientValue}>{productData?.product.nutriments['energy-kcal_100g']}</Text>
                <Text style={styles.nutrientLabel}>kcal</Text>
              </View>
              <View style={styles.nutrientItem}>
                <Text style={styles.nutrientValue}>{productData?.product.nutriments.proteins_100g}g</Text>
                <Text style={styles.nutrientLabel}>Protéines</Text>
              </View>
              <View style={styles.nutrientItem}>
                <Text style={styles.nutrientValue}>{productData?.product.nutriments.carbohydrates_100g}g</Text>
                <Text style={styles.nutrientLabel}>Glucides</Text>
              </View>
              <View style={styles.nutrientItem}>
                <Text style={styles.nutrientValue}>{productData?.product.nutriments.sugars_100g}g</Text>
                <Text style={styles.nutrientLabel}>dont Sucres</Text>
              </View>
              <View style={styles.nutrientItem}>
                <Text style={styles.nutrientValue}>{productData?.product.nutriments.fat_100g}g</Text>
                <Text style={styles.nutrientLabel}>Lipides</Text>
              </View>
              <View style={styles.nutrientItem}>
                <Text style={styles.nutrientValue}>{productData?.product.nutriments['saturated-fat_100g']}g</Text>
                <Text style={styles.nutrientLabel}>dont Saturés</Text>
              </View>
              <View style={styles.nutrientItem}>
                <Text style={styles.nutrientValue}>{productData?.product.nutriments.fiber_100g}g</Text>
                <Text style={styles.nutrientLabel}>Fibres</Text>
              </View>
              <View style={styles.nutrientItem}>
                <Text style={styles.nutrientValue}>{productData?.product.nutriments.salt_100g}g</Text>
                <Text style={styles.nutrientLabel}>Sel</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

       <TouchableOpacity style={styles.scanButton} onPress={() => router.push('/camera')}>
        <Feather name="camera" size={24} color="#FFF" style={styles.scanIcon} />
        <Text style={styles.scanButtonText}>Scanner un nouveau produit</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  productScreen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
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
    backgroundColor: '#f8f8f8',
  },
  productTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  brandText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  nutriscoreContainer: {
    backgroundColor: '#fff',
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
    color: '#1a1a1a',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  sectionText: {
    fontSize: 16,
    color: '#444',
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
    color: '#1a1a1a',
  },
  nutrientLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
   scanButton: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    backgroundColor: '#007AFF',
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
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  scanIcon: {
    marginRight: 8,
  },
});
