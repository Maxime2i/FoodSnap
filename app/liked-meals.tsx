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

export default function LikedMealsScreen() {
  const { user } = useAuth();
  const [plats, setPlats] = useState<Plat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();

  const fetchLikedPlats = async () => {
    if (!user) return;

    try {
      // 1. Récupérer les IDs des plats likés par l'utilisateur
      const { data: likedPlatsData, error: likesError } = await supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", user.id);

      if (likesError) throw likesError;

      const likedPlatsIds = likedPlatsData.map(like => like.post_id);
      
      if (likedPlatsIds.length === 0) {
        setPlats([]);
        return;
      }

      // 2. Récupérer les détails des plats likés
      const { data: platsData, error: platsError } = await supabase
        .from("posts")
        .select(`
          *,
          likes:likes(count)
        `)
        .in("id", likedPlatsIds)
        .order("created_at", { ascending: false });

      if (platsError) throw platsError;

      // 3. Pour chaque plat, récupérer le profil de l'utilisateur
      const platsWithProfiles = await Promise.all(
        (platsData || []).map(async (plat) => {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("first_name, last_name, avatar_url")
            .eq("id", plat.user_id)
            .single();

          return {
            ...plat,
            likes_count: plat.likes?.[0]?.count || 0,
            user_profile: profileError
              ? { first_name: "Utilisateur", last_name: "Inconnu" }
              : profileData,
          };
        })
      );

      setPlats(platsWithProfiles);
    } catch (error) {
      console.error("Erreur lors de la récupération des plats likés:", error);
    }
  };

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    await fetchLikedPlats();
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [user])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
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
   
      <View style={getStyles(colorScheme).cardHeader}>
        <View style={getStyles(colorScheme).userInfo}>
          <Image
            source={item.user_profile?.avatar_url ? { uri: item.user_profile?.avatar_url } : require("@/assets/images/defaultProfilPicture.png")}
            style={getStyles(colorScheme).userAvatar}
          />
          <Text style={getStyles(colorScheme).userName}>{item.user_profile?.first_name} {item.user_profile?.last_name}</Text>
        </View>
        {item.type && (
          <View style={getStyles(colorScheme).typeContainer}>
            <Text style={getStyles(colorScheme).typeText}>{item.type}</Text>
          </View>
        )}
      </View>

      <View style={getStyles(colorScheme).cardContent}>
        <Text style={getStyles(colorScheme).cardTitle}>{item.name}</Text>
        <Text style={getStyles(colorScheme).cardDescription}>
          {item.description}
        </Text>

        <View style={getStyles(colorScheme).macroContainer}>
          <View style={[getStyles(colorScheme).macroItem, {backgroundColor: "#ffd8a1"}]}>
            <Text style={[getStyles(colorScheme).macroValue, {color: "#ff9500"}]}>{item.calories}kcal C</Text>
          </View>
          <View style={[getStyles(colorScheme).macroItem, {backgroundColor: "#e8f0ff"}]}>
            <Text style={[getStyles(colorScheme).macroValue, {color: "#4a90e2"}]}>{item.glucides}g G</Text>
          </View>
          <View style={[getStyles(colorScheme).macroItem, {backgroundColor: "#e8fff0"}]}>
            <Text style={[getStyles(colorScheme).macroValue, {color: "#2ecc71"}]}>{item.proteines}g P</Text>
          </View>
          <View style={[getStyles(colorScheme).macroItem, {backgroundColor: "#fff8e8"}]}>
            <Text style={[getStyles(colorScheme).macroValue, {color: "#f1c40f"}]}>{item.lipides}g L</Text>
          </View>
          <TouchableOpacity
            style={getStyles(colorScheme).voirButton}
            onPress={() => router.push(`/meal-detail?id=${item.id}`)}
          >
            <Text style={getStyles(colorScheme).voirText}>Voir</Text>
            <Ionicons
              name="arrow-forward"
              size={16}
              color={colorScheme === 'dark' ? Colors.dark.primary : Colors.light.primary}
            />
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
      <View
        style={[
          getStyles(colorScheme).container,
          getStyles(colorScheme).emptyContainer,
        ]}
      >
        <Text style={getStyles(colorScheme).emptyText}>
          Vous n'avez pas encore liké de plats
        </Text>
      </View>
    );
  }

  return (
    <View style={getStyles(colorScheme).container}>
      <View style={getStyles(colorScheme).header}>
        <TouchableOpacity
          style={getStyles(colorScheme).backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={colorScheme === 'dark' ? Colors.dark.text : Colors.light.text}
          />
        </TouchableOpacity>
        <Text style={getStyles(colorScheme).title}>Mes plats favoris</Text>
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

const getStyles = (colorScheme: string) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    },
    emptyContainer: {
      justifyContent: "center",
      alignItems: "center",
    },
    emptyText: {
      fontSize: 16,
      color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
      textAlign: "center",
    },
    list: {
      padding: 10,
    },
    card: {
      backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
      borderRadius: 12,
      marginBottom: 15,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      paddingTop: 0,
      paddingBottom: 8,
    },
    userInfo: {
      flexDirection: "row",
      alignItems: "center",
    },
    userAvatar: {
      width: 30,
      height: 30,
      borderRadius: 15,
      marginRight: 8,
    },
    userName: {
      fontSize: 14,
      color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
      fontWeight: "500",
    },
    typeContainer: {
      backgroundColor: "#E8F5E9",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    typeText: {
      color: "#2E7D32",
      fontSize: 14,
      fontWeight: "500",
    },
    photo: {
      width: "100%",
      height: 200,
      marginBottom: 16,
    },
    cardContent: {
      padding: 16,
      paddingTop: 0,
      gap: 8,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    },
    cardDescription: {
      fontSize: 14,
      color: colorScheme === 'dark' ? Colors.dark.text : "#666",
      marginBottom: 12,
    },
    macroContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 4,
      gap: 12,
    },
    macroItem: {
      flex: 1,
      padding: 2,
      borderRadius: 10,
      alignItems: "center",
    },
    macroValue: {
      fontSize: 10,
      fontWeight: "600",
      color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    },
    macroLabel: {
      fontSize: 14,
      color: colorScheme === 'dark' ? Colors.dark.text : "#666",
    },
    voirButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    voirText: {
      fontSize: 14,
      color: colorScheme === 'dark' ? Colors.dark.primary : Colors.light.primary,
      fontWeight: "500",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 30,
      paddingBottom: 10,
      backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    },
    backButton: {
      position: 'absolute',
      left: 16,
      top: 30,
      zIndex: 1,
    },
    title: {
      fontSize: 20,
      fontWeight: "bold",
      color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
      flex: 1,
      textAlign: 'center',
    },
  });
