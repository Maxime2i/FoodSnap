import {
  StyleSheet,
} from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { Camera } from "expo-camera";
import CameraScreen from "../camera";

interface SearchResult {
  food_name: string;
  tag_id: number;
  photo: {
    thumb: string;
  };
  serving_qty: number;
  serving_unit: string;
}

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
  

  return (
    <CameraScreen />
  );
}

const getStyles = (colorScheme: "light" | "dark") =>
  StyleSheet.create({
   
  });
