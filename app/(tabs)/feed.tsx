import React from "react";
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
import ActuCard from "@/components/actuCard";
import LargeActuCard from "@/components/largeActuCard";
import PostCard from "@/components/post";


interface Article {
  id: string;
  image: string;
  titre: string;
  categorie: string;
  created_at: string;
  large: boolean;
  text: string;
  bannerimage: string;
}

const MacroColors = {
  calories: "#FF6B6B", // Rouge
  glucides: "#4a90e2", // Turquoise
  proteines: "#f1c40f", // Bleu
  lipides: "#2ecc71", // Vert
};

export default function FeedScreen() {
  const { user } = useAuth();
  const userId = user?.id;

  const colorScheme = useColorScheme();
  
  const [selectedTab, setSelectedTab] = useState("Actualités");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  const fetchArticles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("article")
      .select("id, image, titre, categorie, created_at, large, text, bannerimage")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setArticles(data);
    }
    setLoading(false);
  };

  const fetchPosts = async () => {
    setPostsLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        profiles (
          first_name,
          last_name,
          avatar_url
        ),
        likes (
          count
        ),
        user_liked:likes(user_id)
      `)
      .order("created_at", { ascending: false });
    if (!error && data) {
      setPosts(data);
    }
    setPostsLoading(false);
  };

  useEffect(() => {
    if (selectedTab === "Actualités") {
      fetchArticles();
    } else if (selectedTab === "Communauté") {
      fetchPosts();
    }
  }, [selectedTab]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (selectedTab === "Actualités") {
      fetchArticles().then(() => setRefreshing(false));
    } else if (selectedTab === "Communauté") {
      fetchPosts().then(() => setRefreshing(false));
    }
  }, [selectedTab]);

  const handleLikePress = async (postId: string, liked: boolean) => {
    if (!userId) return;

    // Optimistic update
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id !== postId) return post;
        // Mise à jour du nombre de likes et du tableau user_liked
        if (liked) {
          return {
            ...post,
            likes: [{ count: post.likes[0].count - 1 }],
            user_liked: post.user_liked.filter((like: { user_id: string }) => like.user_id !== userId),
          };
        } else {
          return {
            ...post,
            likes: [{ count: post.likes[0].count + 1 }],
            user_liked: [...post.user_liked, { user_id: userId }],
          };
        }
      })
    );

    // Requête Supabase
    if (liked) {
      await supabase
        .from("likes")
        .delete()
        .match({ post_id: postId, user_id: userId });
    } else {
      await supabase
        .from("likes")
        .insert({ post_id: postId, user_id: userId });
    }
    // Tu peux éventuellement gérer les erreurs ici et rafraîchir si besoin
  };

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <HeaderTitle title="Actualités & Communauté" />
      <TabSelector
        tabs={["Actualités", "Communauté"]}
        selectedTab={selectedTab}
        onSelectTab={(tab) => {
          setSelectedTab(tab);
        }}
      />

      {selectedTab === "Actualités" && (
        loading ? (
          <ActivityIndicator style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            style={{ marginTop: 10 }}
            contentContainerStyle={{ paddingBottom: 80 }}
            data={articles}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              item.large ? (
                <LargeActuCard
                  id={item.id}
                  image={item.bannerimage}
                  titre={item.titre}
                  description={item.text}
                />
              ) : (
                <ActuCard
                  id={item.id}
                  image={item.image}
                  titre={item.titre}
                  categorie={item.categorie}
                  date={formatDate(item.created_at)}
                />
              )
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )
      )}
      {selectedTab === "Communauté" && (
        postsLoading ? (
          <ActivityIndicator style={{ marginTop: 20 }} />
        ) : (
          <>
            <FlatList
              style={{ marginTop: 10 }}
              contentContainerStyle={{ paddingBottom: 150 }}
              data={posts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <PostCard
                  id={item.id}
                  name={
                    item.profiles
                      ? `${item.profiles.first_name} ${item.profiles.last_name}`
                      : "utilisateur inconnu"
                  }
                  image={item.profiles ? item.profiles.avatar_url : undefined}
                  title={item.name}
                  description={item.description}
                  time={formatDate(item.created_at)}
                  likes={item.likes[0].count}
                  liked={item.user_liked.some((like: { user_id: string }) => like.user_id === userId)}
                  categorie={item.categorie}
                  onLikePress={() => handleLikePress(item.id, item.user_liked.some((like: { user_id: string }) => like.user_id === userId))}
                />
              )}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
            <TouchableOpacity
              style={getStyles(colorScheme).fab}
              onPress={() => router.push({ pathname: '/create-post' })}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={28} color="#fff" />
            </TouchableOpacity>
          </>
        )
      )}
    </View>
  );
}

// Fonction utilitaire pour formater la date (ex: "Il y a 2h")
function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) return "Il y a moins d'1h";
  if (diffH === 1) return "Il y a 1h";
  return `Il y a ${diffH}h`;
}

const getStyles = (colorScheme: string) =>
  StyleSheet.create({
    fab: {
      position: 'absolute',
      right: 16,
      bottom: 20,
      backgroundColor: colorScheme === 'dark' ? Colors.dark.primary : Colors.light.primary,
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      zIndex: 100,
  },
});
