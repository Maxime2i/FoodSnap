import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
interface ActuCardProps {
  id: string;
  image: string;
  titre: string;
  categorie: string;
  date: string;
}

const ActuCard: React.FC<ActuCardProps> = ({ id, image, titre, categorie, date }) => {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();

  const handlePress = () => {
   router.push(`/article?id=${id}`);
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <View style={styles(colorScheme).card}>
        <Image
          source={{ uri: image }}
          style={styles(colorScheme).image}
        />
        <View style={styles(colorScheme).content}>
          <Text style={styles(colorScheme).badge}>{categorie}</Text>
          <Text style={styles(colorScheme).title}>{titre}</Text>
          <Text style={styles(colorScheme).date}>{date}</Text>
          <View style={styles(colorScheme).arrowContainer}>
            <Text style={styles(colorScheme).arrow}>{'>'}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
    maxWidth: 400,
    margin: 8,
    marginVertical: 4,
  },
  image: {
    width: 100,
    height: 100,
    resizeMode: "cover",
    backgroundColor: "#eee",
  },
  content: {
    padding: 6,
    paddingLeft: 16,
    flex: 1,
    height: 100,
    justifyContent: "space-between",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#e3f0ff",
    color: "#1976d2",
    borderRadius: 8,
    fontSize: 8,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 0,
    overflow: "hidden",
  },
  title: {
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 0,
  },
  date: {
    color: "#888",
    fontSize: 12,
  },
  arrowContainer: {
    position: "absolute",
    right: 8,
    bottom: 8,
  },
  arrow: {
    fontSize: 18,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    fontWeight: "bold",
  },
});

export default ActuCard;
