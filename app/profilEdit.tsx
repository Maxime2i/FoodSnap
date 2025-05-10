import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import { Stack, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Picker } from '@react-native-picker/picker';
import { Database } from '@/types/supabase';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import HeaderTitle from '@/components/headerTitle';

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  avatar_url?: string | null;
  location?: string;
  bio?: string;
  email?: string;
  phone?: string;
};
type GoalType = Database['public']['Enums']['goal_type'];
type ActivityLevel = 'sedentaire' | 'modere' | 'actif' | 'tres_actif';

export default function ProfileEdit() {
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Partial<Profile>>({
    first_name: '',
    last_name: '',
    age: null,
    height: null,
    weight: null,
    avatar_url: null,
    location: '',
    bio: '',
  });
  const [uploading, setUploading] = useState(false);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('actif');
  const [activeTab, setActiveTab] = useState('informations');

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
    <ScrollView style={getStyles(colorScheme).container}>
      <Stack.Screen options={{ 
        title: 'Modifier le profil',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#f5f5f5' }
      }} />

      <HeaderTitle title="Modifier le profil" showBackArrow/>

      <View style={getStyles(colorScheme).photoSection}>
        <View style={getStyles(colorScheme).avatarContainer}>
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={getStyles(colorScheme).avatar} />
          ) : (
            <View style={getStyles(colorScheme).avatarPlaceholder}>
              <Ionicons name="person" size={40} color="#999" />
            </View>
          )}
          <TouchableOpacity style={getStyles(colorScheme).cameraButton} onPress={pickImage}>
            <Ionicons name="camera" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        <Text style={getStyles(colorScheme).photoText}>Appuyez pour modifier la photo</Text>
      </View>

      <View style={getStyles(colorScheme).section}>
        <Text style={getStyles(colorScheme).sectionTitle}>Informations personnelles</Text>

        <View style={getStyles(colorScheme).fieldContainer}>
          <Text style={getStyles(colorScheme).label}>Nom complet</Text>
          <View style={getStyles(colorScheme).inputWithIcon}>
            <Ionicons name="person-outline" size={20} color="#666" style={getStyles(colorScheme).inputIcon} />
            <TextInput
              style={getStyles(colorScheme).inputWithIconField}
              placeholder="Thomas Martin"
              value={`${profile.first_name || ''} ${profile.last_name || ''}`}
              onChangeText={(text) => {
                const [firstName = '', lastName = ''] = text.split(' ');
                setProfile(prev => ({ ...prev, first_name: firstName, last_name: lastName }));
              }}
            />
          </View>
        </View>

        <View style={getStyles(colorScheme).fieldContainer}>
          <Text style={getStyles(colorScheme).label}>Email</Text>
          <View style={[getStyles(colorScheme).inputWithIcon, getStyles(colorScheme).disabledInput]}>
            <Ionicons name="mail-outline" size={20} color="#999" style={getStyles(colorScheme).inputIcon} />
            <TextInput
              style={[getStyles(colorScheme).inputWithIconField, getStyles(colorScheme).disabledText]}
              value={profile.email || ''}
              editable={false}
            />
          </View>
        </View>

        <View style={getStyles(colorScheme).row}>
          <View style={getStyles(colorScheme).halfWidth}>
            <Text style={getStyles(colorScheme).label}>Âge</Text>
            <TextInput
              style={getStyles(colorScheme).input}
              placeholder="25"
              placeholderTextColor={colorScheme === 'dark' ? '#666' : '#999'}
              value={profile.age?.toString()}
              keyboardType="numeric"
              onChangeText={(text) => setProfile(prev => ({ ...prev, age: text ? parseInt(text) : null }))}
            />
          </View>
          <View style={getStyles(colorScheme).halfWidth}>
            <Text style={getStyles(colorScheme).label}>Genre</Text>
            <View style={getStyles(colorScheme).pickerContainer}>
              <Picker
                selectedValue={profile.gender}
                style={getStyles(colorScheme).picker}
                onValueChange={(value) => setProfile(prev => ({ ...prev, gender: value }))}>
                <Picker.Item label="Homme" value="homme" />
                <Picker.Item label="Femme" value="femme" />
                <Picker.Item label="Autre" value="autre" />
              </Picker>
            </View>
          </View>
        </View>
      </View>

      <View style={getStyles(colorScheme).section}>
        <Text style={getStyles(colorScheme).sectionTitle}>Mesures corporelles</Text>
        <View style={getStyles(colorScheme).row}>
          <View style={getStyles(colorScheme).halfWidth}>
            <Text style={getStyles(colorScheme).label}>Taille (cm)</Text>
            <TextInput
              style={getStyles(colorScheme).input}
              placeholder="182"
              value={profile.height?.toString()}
              keyboardType="numeric"
              onChangeText={(text) => setProfile(prev => ({ ...prev, height: text ? parseInt(text) : null }))}
            />
          </View>
          <View style={getStyles(colorScheme).halfWidth}>
            <Text style={getStyles(colorScheme).label}>Poids (kg)</Text>
            <TextInput
              style={getStyles(colorScheme).input}
              placeholder="78"
              value={profile.weight?.toString()}
              keyboardType="numeric"
              onChangeText={(text) => setProfile(prev => ({ ...prev, weight: text ? parseInt(text) : null }))}
            />
          </View>
        </View>
      </View>

      <View style={getStyles(colorScheme).buttonContainer}>
        <TouchableOpacity 
          style={getStyles(colorScheme).cancelButton}
          onPress={() => router.back()}>
          <Text style={getStyles(colorScheme).cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[getStyles(colorScheme).saveButton, loading && getStyles(colorScheme).saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}>
          <Text style={getStyles(colorScheme).saveButtonText}>
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const getStyles = (colorScheme: "dark" | "light") => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
  },
  section: {
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,

  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    height: 60,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
  },
  cancelButtonText: {
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  saveButton: {
    flex: 1,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.primary : Colors.light.primary,
    padding: 15,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colorScheme === 'dark' ? Colors.dark.primary : Colors.light.primary,
  },
  tabText: {
    fontSize: 16,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  activeTabText: {
    color: colorScheme === 'dark' ? Colors.dark.primary : Colors.light.primary,
    fontWeight: '600',
  },
  photoSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
  },
  photoText: {
    marginTop: 8,
    fontSize: 14,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
    borderRadius: 8,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
  },
  inputIcon: {
    padding: 12,
  },
  inputWithIconField: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
    borderRadius: 8,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    justifyContent: 'center',
  },
  picker: {
    height: 60,
    width: '100%',
  },
  disabledInput: {
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    borderColor: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
  },
  disabledText: {
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
});

