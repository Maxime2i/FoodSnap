import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import { Stack, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Picker } from '@react-native-picker/picker';
import { Database } from '@/types/supabase';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  avatar_url?: string | null;
};
type GoalType = Database['public']['Enums']['goal_type'];

export default function ProfileEdit() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Partial<Profile>>({
    first_name: '',
    last_name: '',
    goal: null,
    age: null,
    height: null,
    weight: null,
    avatar_url: null,
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    getProfile();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'Nous avons besoin de votre permission pour accéder à vos photos.'
        );
      }
    }
  };

  const getProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('Utilisateur non connecté');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data) setProfile(data);
    } catch (error) {

      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      // Vérifier la taille du fichier
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error("Le fichier n'existe pas");
      }
      
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      if (fileInfo.size > MAX_FILE_SIZE) {
        throw new Error('Le fichier est trop volumineux (max 5MB)');
      }

      // Créer un nom de fichier unique
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}/${Math.random().toString(36).slice(2)}.${fileExt}`;

      // Lire et uploader le fichier
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: fileName,
        type: `image/${fileExt}`,
      } as any);

      // Upload avec retry
      let uploadError;
      for (let i = 0; i < 3; i++) {
        try {
          const { error } = await supabase.storage
            .from('avatars')
            .upload(fileName, formData, {
              contentType: `image/${fileExt}`,
              cacheControl: '3600',
              upsert: true
            });
          
          if (!error) {
            uploadError = null;
            break;
          }
          uploadError = error;
        } catch (error) {
          uploadError = error;
        }
        
        if (i < 2) { // Ne pas attendre après la dernière tentative
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i))); // Attente exponentielle
        }
      }

      if (uploadError) throw uploadError;

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Mettre à jour le profil avec la nouvelle URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
    } catch (error) {
      let message = 'Erreur lors du téléchargement de l\'image';
      if (error instanceof Error) {
        message = error.message;
      }

      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {

      console.error(error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('Utilisateur non connecté');

      const updates = {
        id: user.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        goal: profile.goal,
        age: profile.age,
        height: profile.height,
        weight: profile.weight,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updates);

      if (error) throw error;

      router.back();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Modifier mon profil' }} />

      <TouchableOpacity 
        style={styles.avatarContainer} 
        onPress={pickImage}
        disabled={uploading}>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>
              {uploading ? 'Téléchargement...' : 'Ajouter une photo'}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nom"
          value={profile.last_name || ''}
          onChangeText={(text) => setProfile(prev => ({ ...prev, last_name: text }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Prénom"
          value={profile.first_name || ''}
          onChangeText={(text) => setProfile(prev => ({ ...prev, first_name: text }))}
        />
        
        <Picker
          selectedValue={profile.goal}
          style={styles.input}
          onValueChange={(value) => setProfile(prev => ({ ...prev, goal: value as GoalType }))}>
          <Picker.Item label="Sélectionnez un objectif" value={null} />
          <Picker.Item label="Perte de poids" value="weight_loss" />
          <Picker.Item label="Prise de masse" value="muscle_gain" />
          <Picker.Item label="Maintien" value="maintenance" />
          <Picker.Item label="Amélioration de la santé" value="health_improvement" />
        </Picker>

        <TextInput
          style={styles.input}
          placeholder="Âge"
          value={profile.age?.toString() || ''}
          keyboardType="numeric"
          onChangeText={(text) => setProfile(prev => ({ ...prev, age: text ? parseInt(text) : null }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Taille (cm)"
          value={profile.height?.toString() || ''}
          keyboardType="numeric"
          onChangeText={(text) => setProfile(prev => ({ ...prev, height: text ? parseInt(text) : null }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Poids (kg)"
          value={profile.weight?.toString() || ''}
          keyboardType="numeric"
          onChangeText={(text) => setProfile(prev => ({ ...prev, weight: text ? parseInt(text) : null }))}
        />
      </View>

      <TouchableOpacity 
        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={loading}>
        <Text style={styles.saveButtonText}>
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  avatarPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  avatarPlaceholderText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    padding: 10,
  },
  inputContainer: {
    gap: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

