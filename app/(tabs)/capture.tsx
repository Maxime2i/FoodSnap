import {
  StyleSheet,
  View,
  Text,
  Button,
  TouchableOpacity,
  Image,
  Animated,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  Switch,
} from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";

interface FoodItem {
  food_id: string;
  food_name: string;
  food_description: string;
  brand_name?: string;
  protein: number;
  carbohydrates: number;
  fat: number;
  calories: number;
  imageUrl?: string;
}

export default function CaptureScreen() {
  const colorScheme = useColorScheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

  const searchFood = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `http://13.60.13.92:3000/food-data?search=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      setSuggestions(data.foods.food);
    } catch (error) {
      console.error("Erreur lors de la recherche:", error);
      Alert.alert("Erreur", "Impossible de récupérer les suggestions");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFoodImage = async (
    foodName: string
  ): Promise<string | undefined> => {
    try {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(
          foodName
        )}&per_page=1`,
        {
          headers: {
            Authorization: process.env.EXPO_PUBLIC_PEXELS_API_KEY || "",
          },
        }
      );
      const data = await response.json();
      
      return data.photos?.[0]?.src?.medium;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'image:", error);
      return undefined;
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    searchFood(text);
  };

  const handleSelectFood = async (food: FoodItem) => {
    // Extraire les valeurs de la description si elles sont présentes
    if (food.food_description) {
      const caloriesMatch = food.food_description.match(
        /Calories:\s*(\d+(?:\.\d+)?)/i
      );
      const fatMatch = food.food_description.match(/Fat:\s*(\d+(?:\.\d+)?)/i);
      const carbsMatch = food.food_description.match(
        /Carbs:\s*(\d+(?:\.\d+)?)/i
      );
      const proteinMatch = food.food_description.match(
        /Protein:\s*(\d+(?:\.\d+)?)/i
      );

      const parsedFood = {
        ...food,
        calories: caloriesMatch ? parseFloat(caloriesMatch[1]) : food.calories,
        fat: fatMatch ? parseFloat(fatMatch[1]) : food.fat,
        carbohydrates: carbsMatch
          ? parseFloat(carbsMatch[1])
          : food.carbohydrates,
        protein: proteinMatch ? parseFloat(proteinMatch[1]) : food.protein,
        imageUrl: undefined,
      };

      setSelectedFood(parsedFood);
    } else {
      setSelectedFood({ ...food, imageUrl: undefined });
    }

    setSearchQuery("");
    setSuggestions([]);

    const imageUrl = await fetchFoodImage(food.food_name);
    if (imageUrl) {
      setSelectedFood((prev) => (prev ? { ...prev, imageUrl } : null));
    }
  };

  const handleRemoveFood = () => {
    setSelectedFood(null);
  };

  return (
    <ScrollView style={getStyles(colorScheme).container}>
      <View style={getStyles(colorScheme).headerContainer}>
        <Text style={getStyles(colorScheme).headerText}>Ajouter un repas</Text>
      </View>
      <View style={getStyles(colorScheme).cardsContainer}>
        <TouchableOpacity
          style={getStyles(colorScheme).card}
          onPress={() => router.push("/camera")}
        >
          <MaterialIcons
            name="photo-camera"
            size={40}
            color={
              colorScheme === "dark" ? Colors.dark.text : Colors.light.text
            }
          />
          <Text style={getStyles(colorScheme).cardText}>Photo du plat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={getStyles(colorScheme).card}
          onPress={() => router.push("/barcode")}
        >
          <MaterialIcons
            name="qr-code-scanner"
            size={40}
            color={
              colorScheme === "dark" ? Colors.dark.text : Colors.light.text
            }
          />
          <Text style={getStyles(colorScheme).cardText}>
            Scanner code-barres
          </Text>
        </TouchableOpacity>
      </View>

      <View style={getStyles(colorScheme).searchContainer}>
        <View style={getStyles(colorScheme).searchWrapper}>
          <MaterialIcons
            name="search"
            size={24}
            color={
              colorScheme === "dark" ? Colors.dark.text : Colors.light.text
            }
            style={getStyles(colorScheme).searchIcon}
          />
          <TextInput
            style={getStyles(colorScheme).searchInput}
            placeholder="Rechercher un aliment..."
            placeholderTextColor={
              colorScheme === "dark" ? Colors.dark.text : Colors.light.text
            }
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {isLoading && (
            <MaterialIcons
              name="hourglass-empty"
              size={24}
              color={
                colorScheme === "dark" ? Colors.dark.text : Colors.light.text
              }
              style={getStyles(colorScheme).loadingIcon}
            />
          )}
        </View>

        {suggestions.length > 0 && (
          <View style={getStyles(colorScheme).suggestionsContainer}>
            {suggestions.slice(0, 4).map((item) => (
              <TouchableOpacity
                key={item.food_id}
                style={getStyles(colorScheme).suggestionItem}
                onPress={() => handleSelectFood(item)}
              >
                <Text style={getStyles(colorScheme).suggestionTitle}>
                  {item.food_name}
                </Text>
                {item.brand_name && (
                  <Text style={getStyles(colorScheme).suggestionBrand}>
                    {item.brand_name}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selectedFood && (
          <View style={getStyles(colorScheme).selectedFoodsContainer}>
            <View style={getStyles(colorScheme).selectedFoodItem}>
              <Text style={getStyles(colorScheme).selectedFoodText}>
                {selectedFood.food_name}
              </Text>
              {selectedFood.brand_name && (
                <Text style={getStyles(colorScheme).selectedFoodBrand}>
                  {selectedFood.brand_name}
                </Text>
              )}
              {selectedFood.imageUrl && (
                <Image
                  source={{ uri: selectedFood.imageUrl }}
                  style={getStyles(colorScheme).foodImage}
                  resizeMode="cover"
                />
              )}
              <Text style={getStyles(colorScheme).macroLabel}>Valeurs nutritionnelles pour 100g</Text>

              <View style={getStyles(colorScheme).macrosContainer}>
                <View style={getStyles(colorScheme).macroItem}>
                  <View>
                    <Text style={[getStyles(colorScheme).macroValue, { color: '#ff9500' }]}>
                      {selectedFood.calories}Kcal
                    </Text>
                    <Text style={getStyles(colorScheme).macroLabel}>kcal</Text>
                  </View>
                </View>
                <View style={getStyles(colorScheme).macroItem}>
                  <View>
                    <Text style={[getStyles(colorScheme).macroValue, { color: '#4a90e2' }]}>
                      {selectedFood.protein}g
                    </Text>
                    <Text style={[getStyles(colorScheme).macroLabel]}>
                      Protéines
                    </Text>
                  </View>
                </View>
                <View style={getStyles(colorScheme).macroItem}>
                  <View>
                    <Text style={[getStyles(colorScheme).macroValue, { color: '#2ecc71' }]}>
                      {selectedFood.carbohydrates}g
                    </Text>
                    <Text style={getStyles(colorScheme).macroLabel}>
                      Glucides
                    </Text>
                  </View>
                </View>
                <View style={getStyles(colorScheme).macroItem}>
                  <View>
                    <Text style={[getStyles(colorScheme).macroValue, { color: '#f1c40f' }]}>
                      {selectedFood.fat}g
                    </Text>
                    <Text style={[getStyles(colorScheme).macroLabel]}>
                      Lipides
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const getStyles = (colorScheme: "light" | "dark") =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        colorScheme === "dark"
          ? Colors.dark.background
          : Colors.light.background,
    },
    headerContainer: {
      padding: 20,
      paddingTop: 40,
      alignItems: "center",
    },
    headerText: {
      fontSize: 24,
      fontWeight: "bold",
      color: colorScheme === "dark" ? Colors.dark.text : Colors.light.text,
    },
    cardsContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      padding: 20,
      marginTop: 20,
    },
    card: {
      backgroundColor: colorScheme === "dark" ? Colors.dark.background : Colors.light.background,
      borderRadius: 15,
      padding: 20,
      width: "45%",
      alignItems: "center",
      justifyContent: "center",
      elevation: 3,
      shadowColor: colorScheme === "dark" ? Colors.dark.text : Colors.light.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    cardText: {
      marginTop: 10,
      fontSize: 16,
      textAlign: "center",
      color: colorScheme === "dark" ? Colors.dark.text : Colors.light.text,
    },
    searchContainer: {
      padding: 20,
    },
    searchWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colorScheme === "dark" ? Colors.dark.background : Colors.light.background,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colorScheme === "dark" ? "#404040" : "#E0E0E0",
      width: "95%",
      alignSelf: "center",
    },
    searchIcon: {
      padding: 10,
      marginLeft: 5,
    },
    searchInput: {
      flex: 1,
      padding: 15,
      fontSize: 16,
      color: colorScheme === "dark" ? Colors.dark.text : Colors.light.text,
    },
    loadingIcon: {
      padding: 10,
      marginRight: 5,
    },
    suggestionsContainer: {
      marginTop: 10,
      backgroundColor: colorScheme === "dark" ? Colors.dark.background : Colors.light.background,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colorScheme === "dark" ? "#404040" : "#E0E0E0",
      maxHeight: 300,
    },
    suggestionItem: {
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: colorScheme === "dark" ? "#404040" : "#E0E0E0",
    },
    suggestionTitle: {
      fontSize: 16,
      color: colorScheme === "dark" ? Colors.dark.text : Colors.light.text,
    },
    suggestionBrand: {
      fontSize: 14,
      color: colorScheme === "dark" ? Colors.dark.text : Colors.light.text,
      marginTop: 4,
    },
    foodImage: {
      width: "100%",
      height: 200,
      borderRadius: 10,
      marginVertical: 15,
    },
    selectedFoodsContainer: {
      marginTop: 20,
      backgroundColor: colorScheme === "dark" ? Colors.dark.background : Colors.light.background,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colorScheme === "dark" ? "#404040" : "#E0E0E0",
      padding: 15,
      overflow: "hidden",
    },
    selectedFoodItem: {
      alignItems: "center",
    },
    selectedFoodText: {
      fontSize: 20,
      fontWeight: "bold",
      color: colorScheme === "dark" ? Colors.dark.text : Colors.light.text,
      marginBottom: 5,
      textAlign: "center",
    },
    selectedFoodBrand: {
      fontSize: 16,
      color: colorScheme === "dark" ? Colors.dark.text : Colors.light.text,
      marginBottom: 15,
      textAlign: "center",
    },
    macrosContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-around",
      width: "100%",
      marginTop: 10,
    },
    macroItem: {
      alignItems: "center",
      width: "25%",
      padding: 5,
    },
    macroEmoji: {
      fontSize: 24,
      marginBottom: 5,
    },
    macroValue: {
      fontSize: 18,
      fontWeight: "bold",
      color: colorScheme === "dark" ? Colors.dark.text : Colors.light.text,
      textAlign: "center",
    },
    macroLabel: {
      fontSize: 12,
      color: colorScheme === "dark" ? Colors.dark.text : Colors.light.text,
      textAlign: "center",
    },
  });
