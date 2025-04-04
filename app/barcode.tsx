import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from "react-native";
import {
  Camera,
  CameraView,
  CameraType,
  useCameraPermissions,
} from "expo-camera";
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

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

export default function CameraScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [showScanner, setShowScanner] = useState(true);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };

    getCameraPermissions();
  }, []);

  const fetchProductData = async (barcode: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );
      const data: ProductData = await response.json();
      setProductData(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
      alert("Impossible de récupérer les informations du produit");
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setShowScanner(false);
    fetchProductData(data);
  };

  const handleBackToCapture = () => {
    router.push('/(tabs)/capture');
  };

  const handleRescanProduct = () => {
    setShowScanner(true);
    setScanned(false);
    setProductData(null);
  };

  const getMostRecentNutriScore = (nutriscore: NutriScore) => {
    if (!nutriscore) return null;
    const years = Object.keys(nutriscore).sort().reverse();
    return years.length > 0 ? { year: years[0], data: nutriscore[years[0]] } : null;
  };

  if (hasPermission === null) {
    return <Text>Demande d'autorisation de la caméra</Text>;
  }
  if (hasPermission === false) {
    return <Text>Pas d'accès à la caméra</Text>;
  }

  const renderProductScreen = () => (
    <SafeAreaView style={styles.productScreen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToCapture} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
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
      <TouchableOpacity style={styles.scanButton} onPress={handleRescanProduct}>
        <Ionicons name="scan" size={24} color="#FFF" style={styles.scanIcon} />
        <Text style={styles.scanButtonText}>Scanner un nouveau produit</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  return (
    <View style={styles.container}>
      {showScanner ? (
        <>
          <CameraView
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
            }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame} />
          </View>
        </>
      ) : (
        <>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Chargement des données...</Text>
            </View>
          ) : (
            productData && productData.status === 1 && renderProductScreen()
          )}
        </>
      )}
    </View>
  );
}

const { width, height } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
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
  scoreDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: width * 0.7,
    height: width * 0.7,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
  },
});
