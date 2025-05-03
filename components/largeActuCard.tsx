import React from "react";
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

interface LargeActuCardProps {
  id: string;
  titre: string;
  description: string;
  image: string;
}

const LargeActuCard: React.FC<LargeActuCardProps> = ({ id, titre, description, image }) => {
  const handlePress = () => {
    router.push(`/article?id=${id}`);
  };

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={handlePress} style={styles.card}>
      <ImageBackground source={{ uri: image }} style={styles.image} imageStyle={styles.imageStyle}>
        <LinearGradient
          colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.7)"]}
          style={styles.gradient}
        >
          <View style={styles.badgeContainer}>
            <Text style={styles.badge}>À la une</Text>
          </View>
          <Text style={styles.title}>{titre}</Text>
          <Text style={styles.description}>{description.length > 80 ? `${description.substring(0, 80)}...` : description}</Text>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    width: "auto",
    maxWidth: 430,
    minHeight: 180,
    height: 180,
    margin: 8,
    marginVertical: 4,
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  imageStyle: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-end',
  },
  badgeContainer: {
    marginBottom: 8,
  },
  badge: {
    backgroundColor: "#1976d2",
    color: "#fff",
    borderRadius: 8,
    fontWeight: "bold",
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  title: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 20,
    marginBottom: 8,
  },
  description: {
    color: "#e0e0e0",
    fontSize: 15,
  },
});

export default LargeActuCard;
