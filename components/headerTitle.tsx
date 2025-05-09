import { router } from "expo-router";
import React from "react";
import { Text, StyleSheet, View, TouchableOpacity } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";


interface Props {
  title: string;
  showBackArrow?: boolean;
  color?: string;
}

const HeaderTitle = ({ title, showBackArrow = false, color }: Props) => {
  const colorScheme = useColorScheme();
  return (
    <View style={getStyles(colorScheme).container}>
      {showBackArrow && (
        <TouchableOpacity
          onPress={() => router.back()}
          style={getStyles(colorScheme).backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={color ? color : colorScheme === "dark" ? Colors.dark.text : Colors.light.text}
          />
        </TouchableOpacity>
      )}
      <Text style={[getStyles(colorScheme).title, color ? { color } : null]}>{title}</Text>
    </View>
  );
};

const getStyles = (colorScheme: string) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 40,
      marginLeft: 16,
    },
    backButton: {
      fontSize: 24,
      marginRight: 12,
      marginBottom: -4,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: colorScheme === "dark" ? Colors.dark.text : Colors.light.text,
    },
  });

export default HeaderTitle;
