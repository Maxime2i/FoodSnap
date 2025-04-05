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

const MacroColors = {
  calories: "#FF6B6B", // Rouge
  glucides: "#4a90e2", // Turquoise
  proteines: "#f1c40f", // Bleu
  lipides: "#2ecc71", // Vert
};

export default function FeedScreen() {
  const { user } = useAuth();
  const [plats, setPlats] = useState<Plat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [likedPlats, setLikedPlats] = useState<Set<string>>(new Set());
  const colorScheme = useColorScheme();

  const fetchPlats = async () => {
    if (!user) return;

    try {
      // 1. Récupérer tous les plats publiés sauf ceux de l'utilisateur connecté
      const { data: platsData, error: platsError } = await supabase
        .from("plats")
        .select(
          `
          *,
          likes:likes(count)
        `
        )
        .neq("user_id", user.id)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (platsError) throw platsError;

      // 2. Pour chaque plat, récupérer le profil de l'utilisateur
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
      console.error("Erreur lors de la récupération des plats:", error);
    }
  };

  const fetchUserLikes = async () => {
    if (!user) return;

    try {
      const { data: likes, error } = await supabase
        .from("likes")
        .select("plat_id")
        .eq("user_id", user.id);

      if (error) throw error;

      setLikedPlats(new Set(likes?.map((like) => like.plat_id)));
    } catch (error) {
      console.error("Erreur lors de la récupération des likes:", error);
    }
  };

  const toggleLike = async (platId: string) => {
    if (!user) return;

    try {
      const isLiked = likedPlats.has(platId);

      if (isLiked) {
        // Supprimer le like
        await supabase
          .from("likes")
          .delete()
          .eq("plat_id", platId)
          .eq("user_id", user.id);

        setLikedPlats((prev) => {
          const newSet = new Set(prev);
          newSet.delete(platId);
          return newSet;
        });

        setPlats((prev) =>
          prev.map((plat) =>
            plat.id === platId
              ? { ...plat, likes_count: Math.max(0, plat.likes_count - 1) }
              : plat
          )
        );
      } else {
        // Ajouter le like
        await supabase
          .from("likes")
          .insert([{ plat_id: platId, user_id: user.id }]);

        setLikedPlats((prev) => new Set([...prev, platId]));

        setPlats((prev) =>
          prev.map((plat) =>
            plat.id === platId
              ? { ...plat, likes_count: plat.likes_count + 1 }
              : plat
          )
        );
      }
    } catch (error) {
      console.error("Erreur lors du like/unlike:", error);
    }
  };

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    await Promise.all([fetchPlats(), fetchUserLikes()]);
    setLoading(false);
  }, [user]);

  // Charger les données au montage initial
  useEffect(() => {
    fetchData();
  }, [user]);

  // Recharger les données quand l'écran redevient actif
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
          Aucun plat à afficher pour le moment
        </Text>
      </View>
    );
  }

  return (
    <View style={getStyles(colorScheme).container}>
      <View style={getStyles(colorScheme).header}>
        <Text style={getStyles(colorScheme).title}>Feed</Text>
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
      fontSize: 12,
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
      justifyContent: "center",
      paddingHorizontal: 16,
      paddingTop: 30,
      paddingBottom: 10,
      backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    },
    title: {
      fontSize: 20,
      fontWeight: "bold",
      color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    },
  });
