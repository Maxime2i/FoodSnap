import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/Colors";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import HeaderTitle from "@/components/headerTitle";

export default function ArticleScreen() {
  const colorScheme = useColorScheme();
  const { id } = useLocalSearchParams();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchArticle = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("article")
        .select("*")
        .eq("id", id)
        .single();
      if (!error) setArticle(data);
      setLoading(false);
    };
    fetchArticle();
  }, [id]);

  if (loading) {
    return (
      <View style={getStyles(colorScheme).container}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  if (!article) {
    return (
      <View style={getStyles(colorScheme).container}>
        <HeaderTitle title="Article" showBackArrow />
        <Text style={{ color: "red", textAlign: "center", marginTop: 20 }}>
          Article non trouvé
        </Text>
      </View>
    );
  }

  return (
    <View style={getStyles(colorScheme).container}>
      <HeaderTitle title={article.titre || "Article"} showBackArrow />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {article.image && (
          <Image
            source={{ uri: article.image }}
            style={{
              width: "100%",
              height: 200,
              borderRadius: 12,
              marginBottom: 16,
            }}
            resizeMode="cover"
          />
        )}
        <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 8, color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text }}>
          {article.titre}
        </Text>
        <Text style={{ color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text, marginBottom: 8 }}>
          {article.categorie}
        </Text>
        <Text style={{ color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text, marginBottom: 16 }}>
          {article.created_at &&
            new Date(article.created_at).toLocaleDateString("fr-FR")}
        </Text>
        {article.text && (
          <Text style={{ fontSize: 16, lineHeight: 24, marginBottom: 16, color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text }}>
            {article.text}
          </Text>
        )}

        {article.sources && (
          <View style={{ marginTop: 24 }}>
            <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 8, color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text }}>
              Sources :
            </Text>
            {Array.isArray(article.sources) ? (
              article.sources.map((src: string, idx: number) => (
                <Text
                  key={idx}
                  style={{ color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text, marginBottom: 4 }}
                >
                  {src}
                </Text>
              ))
            ) : (
              <Text style={{ color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text }}>
                {article.sources}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
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
  });
