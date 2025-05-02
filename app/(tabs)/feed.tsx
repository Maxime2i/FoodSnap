import {
  StyleSheet,
  View,
  Text,
  Image,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/Colors";
import { router, useFocusEffect } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import HeaderTitle from "@/components/headerTitle";
import TabSelector from "@/components/tabSelector";
interface Profile {
  first_name: string;
  last_name: string;
  avatar_url: string;
}

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
  user_id: string;
  user_profile?: Profile;
  type: string;
  likes_count: number;
}

const MacroColors = {
  calories: "#FF6B6B", // Rouge
  glucides: "#4a90e2", // Turquoise
  proteines: "#f1c40f", // Bleu
  lipides: "#2ecc71", // Vert
};

export default function FeedScreen() {
  
  const [selectedTab, setSelectedTab] = useState("Actualités");
  


  return (
    <View>
      <HeaderTitle title="Actualités & Communauté" />
      <TabSelector
        tabs={["Actualités", "Communauté"]}
        selectedTab={selectedTab}
        onSelectTab={(tab) => {
          setSelectedTab(tab);
        }}
      />
      
    </View>
  );
}

const getStyles = (colorScheme: string) =>
  StyleSheet.create({
    
  });
