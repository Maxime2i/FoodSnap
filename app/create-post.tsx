import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import HeaderTitle from "@/components/headerTitle";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { useAuth } from "./context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useNavigation } from "@react-navigation/native";

export default function CreerPublication() {
  const [type, setType] = useState("Question");
  const [titre, setTitre] = useState("");
  const [contenu, setContenu] = useState("");
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const navigation = useNavigation();

  const publier = async () => {
    if (!contenu.trim()) {
      Alert.alert("Erreur", "Le contenu ne peut pas être vide.");
      return;
    }
    const { error } = await supabase.from("posts").insert([
      {
        name: titre,
        categorie: type,
        description: contenu,
        user_id: user?.id,
        created_at: new Date().toISOString(),
      },
    ]);
    if (error) {
      console.log(error);
      Alert.alert("Erreur", "Impossible d'enregistrer la publication.");
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={getStyles(colorScheme).container}>
      <HeaderTitle title="Créer une publication" showBackArrow />
      <View style={getStyles(colorScheme).content}>
        <View style={getStyles(colorScheme).userRow}>
          {user?.avatar_url ? (
            <Image
              source={{ uri: user.avatar_url }}
              style={getStyles(colorScheme).avatar}
            />
          ) : (
            <View style={getStyles(colorScheme).avatar} />
          )}
          <View>
            <Text style={getStyles(colorScheme).username}>
              {user?.first_name} {user?.last_name}
            </Text>
            <View style={getStyles(colorScheme).pickerWrapper}>
              <Picker
                selectedValue={type}
                style={getStyles(colorScheme).picker}
                onValueChange={(itemValue) => setType(itemValue)}
                mode="dropdown"
              >
                <Picker.Item
                  label="Question"
                  value="Question"
                  style={getStyles(colorScheme).pickerItem}
                />
                <Picker.Item
                  label="Conseil"
                  value="Conseil"
                  style={getStyles(colorScheme).pickerItem}
                />
                <Picker.Item
                  label="Experience"
                  value="Experience"
                  style={getStyles(colorScheme).pickerItem}
                />
                <Picker.Item
                  label="Recette"
                  value="Recette"
                  style={getStyles(colorScheme).pickerItem}
                />
              </Picker>
            </View>
          </View>
        </View>
        <TextInput
          style={getStyles(colorScheme).titleInput}
          placeholder="Titre de la publication"
          value={titre}
          onChangeText={setTitre}
          maxLength={100}
        />
        <TextInput
          style={getStyles(colorScheme).input}
          placeholder="Partagez votre expérience, posez une question ou donnez un conseil à la communauté…"
          multiline
          scrollEnabled={true}
          value={contenu}
          onChangeText={setContenu}
        />
        <TouchableOpacity
          style={getStyles(colorScheme).button}
          onPress={publier}
        >
          <Text style={getStyles(colorScheme).buttonText}>Publier</Text>
        </TouchableOpacity>
        <View style={getStyles(colorScheme).reminderBox}>
          <Text style={getStyles(colorScheme).reminderTitle}>Rappel :</Text>
          <Text style={getStyles(colorScheme).reminderText}>
            Partagez votre expérience personnelle et des conseils, mais
            n'oubliez pas que les informations médicales doivent toujours être
            validées par un professionnel de santé.
          </Text>
        </View>
      </View>
    </View>
  );
}

const getStyles = (colorScheme: string) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    userRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#e0e0e0",
      marginRight: 10,
    },
    content: {
      padding: 20,
    },
    username: { fontWeight: "bold", fontSize: 16 },
    picker: { height: 50, width: 140, color: "#222" },
    pickerWrapper: {
      borderWidth: 1,
      borderColor: "#d0d0d0",
      borderRadius: 8,
      marginTop: 4,
      height: 50,
      width: 140,
    },
    pickerItem: { color: "#222", fontSize: 13 },
    titleInput: {
      borderWidth: 1,
      borderColor: "#e0e0e0",
      borderRadius: 10,
      padding: 12,
      marginBottom: 0,
      fontWeight: "bold",
      fontSize: 16,
    },
    input: {
      borderWidth: 1,
      borderColor: "#e0e0e0",
      borderRadius: 10,
      padding: 12,
      height: 160,
      marginVertical: 15,
      textAlignVertical: "top",
    },
    iconsRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginBottom: 15,
    },
    button: {
      backgroundColor: "#7daaff",
      borderRadius: 20,
      alignItems: "center",
      padding: 12,
      marginBottom: 15,
    },
    buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
    reminderBox: {
      backgroundColor: "#fffbe6",
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: "#fff3cd",
    },
    reminderTitle: { fontWeight: "bold", color: "#a05a00" },
    reminderText: { color: "#a05a00", marginTop: 4 },
  });
