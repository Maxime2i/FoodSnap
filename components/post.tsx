import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";

interface PostCardProps {
  id: string;
  name: string;
  image: string; // URL de l'avatar
  title: string; // ex: "Conseil"
  description: string; // texte du post
  time: string; // ex: "Il y a 1h"
  likes: number;
  liked: boolean;
  onLikePress: () => void;
  categorie: string;
}

const getBadgeStyle = (categorie: string) => {
  switch (categorie?.toLowerCase()) {
    case "question":
      return { backgroundColor: '#FFD600' };
    case "conseil":
      return { backgroundColor: '#2196F3' };
    case "experience":
      return { backgroundColor: '#4CAF50' };
    case "recette":
      return { backgroundColor: '#9C27B0' };
    default:
      return { backgroundColor: '#CCCCCC' };
  }
};

const PostCard: React.FC<PostCardProps> = ({ id, name, image, title, description, time, likes, liked, onLikePress, categorie }) => {
  const colorScheme = useColorScheme();

    return (
    <View style={styles(colorScheme).card}>
      {/* Badge catégorie */}
      {categorie && (
        <View style={[styles(colorScheme).badgeContainer]}>
          <View style={[styles(colorScheme).badge, getBadgeStyle(categorie)]}>
            <Text style={styles(colorScheme).badgeText}>{categorie}</Text>
          </View>
        </View>
      )}
      {/* Fin badge */}
      <View style={styles(colorScheme).header}>
        <Image source={{ uri: image }} style={styles(colorScheme).avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles(colorScheme).name}>{name}</Text>
          <Text style={styles(colorScheme).subtext}>{time}</Text>
        </View>
      </View>
      <Text style={styles(colorScheme).title}>{title}</Text>
      <Text style={styles(colorScheme).description}>{description}</Text>
      <View style={styles(colorScheme).footer}>
        <TouchableOpacity onPress={onLikePress}>
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={24}
            color={liked ? colorScheme === 'dark' ? Colors.dark.primary : Colors.light.primary : colorScheme === 'dark' ? Colors.dark.text : Colors.light.text}
          />
        </TouchableOpacity>
        <Text style={styles(colorScheme).footerText}>{likes}</Text>
        {/* <Text style={[styles.icon, { marginLeft: 16 }]}>💬</Text>
        <Text style={styles.footerText}>8</Text> */}
        {/* <Text style={[styles.icon, { marginLeft: 16 }]}>⤴️</Text>
        <Text style={[styles.footerText, { marginLeft: 4 }]}>Partager</Text> */}
      </View>
    </View>
  );
};

const styles = (colorScheme: string) => StyleSheet.create({
  card: {
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    borderRadius: 16,
    padding: 16,
    margin: 8,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    maxWidth: 400,
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  badgeText: {
    color: colorScheme === 'dark' ? Colors.dark.white : Colors.light.white,
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 15,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  subtext: {
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    fontSize: 12,
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
    marginTop: 4,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  icon: {
    fontSize: 16,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  footerText: {
    fontSize: 14,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    marginLeft: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
});

export default PostCard;
