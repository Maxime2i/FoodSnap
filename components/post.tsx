import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
}

const PostCard: React.FC<PostCardProps> = ({ id, name, image, title, description, time, likes, liked, onLikePress }) => {

    return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Image source={{ uri: image }} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.subtext}>{time}</Text>
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <View style={styles.footer}>
        <TouchableOpacity onPress={onLikePress}>
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={24}
            color={liked ? "red" : "black"}
          />
        </TouchableOpacity>
        <Text style={styles.footerText}>{likes}</Text>
        {/* <Text style={[styles.icon, { marginLeft: 16 }]}>💬</Text>
        <Text style={styles.footerText}>8</Text> */}
        {/* <Text style={[styles.icon, { marginLeft: 16 }]}>⤴️</Text>
        <Text style={[styles.footerText, { marginLeft: 4 }]}>Partager</Text> */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    margin: 8,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    maxWidth: 400,
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
    backgroundColor: '#eee',
  },
  name: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  subtext: {
    color: '#888',
    fontSize: 12,
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  icon: {
    fontSize: 16,
    color: '#888',
  },
  footerText: {
    fontSize: 14,
    color: '#444',
    marginLeft: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
});

export default PostCard;
