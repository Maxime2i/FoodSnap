import { StyleSheet, View, Text, Pressable, ScrollView, Switch, Image } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '@/types/auth';
import { Colors } from '@/constants/Colors';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/context/ThemeContext';
import { useColorScheme } from "@/hooks/useColorScheme";

export default function ProfilScreen() {
  const { user } = useAuth();
  const { theme, setTheme, isSystemTheme, setIsSystemTheme } = useTheme();
  const colorScheme = useColorScheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger le profil au montage initial
  useEffect(() => {
    fetchProfile();
  }, [user]);

  // Recharger le profil quand l'écran redevient actif
  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [user])
  );

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  if (loading) {
    return (
      <View style={getStyles(colorScheme).container}>
        <Text style={getStyles(colorScheme).loadingText}>Chargement...</Text>
      </View>
    );
  }

  const getGoalLabel = (goal: string) => {
    switch (goal) {
      case 'weight_loss': return 'Perte de poids';
      case 'muscle_gain': return 'Prise de muscle';
      case 'maintenance': return 'Maintien du poids';
      case 'health_improvement': return 'Amélioration de la santé';
      default: return goal;
    }
  };

  return (
    <ScrollView style={getStyles(colorScheme).container}>
      <View style={getStyles(colorScheme).titleContainer}>
        <Text style={getStyles(colorScheme).titleText}>Profil</Text>
      </View>

      <View style={getStyles(colorScheme).header}>
        <View style={getStyles(colorScheme).profileImageContainer}>
          <Image 
            source={profile?.avatar_url ? { uri: profile.avatar_url } : require('@/assets/images/defaultProfilPicture.png')} 
            style={getStyles(colorScheme).profileImage} 
          />
        </View>
        <View style={getStyles(colorScheme).profileInfo}>
          <Text style={getStyles(colorScheme).name}>{profile?.first_name || 'Thomas'} {profile?.last_name || 'Martin'}</Text>
          <Text style={getStyles(colorScheme).objective}>Objectif: {profile?.goal ? getGoalLabel(profile.goal) : 'Prise de masse musculaire'}</Text>
          <Pressable style={getStyles(colorScheme).editButton} onPress={() => router.push('/profilEdit')}>
            <Text style={getStyles(colorScheme).editButtonText}>Modifier le profil</Text>
          </Pressable>
        </View>
      </View>

      <Text style={getStyles(colorScheme).sectionTitle}>Objectifs nutritionnels</Text>

      <Pressable style={getStyles(colorScheme).menuItem} onPress={() => router.push('/nutritional-goals')}>
        <View style={getStyles(colorScheme).menuItemLeft}>
          <View style={[getStyles(colorScheme).iconContainer, { backgroundColor: '#E8FFE8' }]}>
            <Ionicons name="stats-chart" size={24} color="#4CAF50" />
          </View>
          <View>
            <Text style={getStyles(colorScheme).menuItemTitle}>Objectifs personnalisés</Text>
            <Text style={getStyles(colorScheme).menuItemSubtitle}>Calories, macronutriments</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#999" />
      </Pressable>

      <Pressable style={getStyles(colorScheme).menuItem}>
        <View style={getStyles(colorScheme).menuItemLeft}>
          <View style={[getStyles(colorScheme).iconContainer, { backgroundColor: '#F8E8FF' }]}>
            <MaterialIcons name="person-outline" size={24} color="#9C27B0" />
          </View>
          <View>
            <Text style={getStyles(colorScheme).menuItemTitle}>Préférences alimentaires</Text>
            <Text style={getStyles(colorScheme).menuItemSubtitle}>Allergies, régimes spécifiques</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#999" />
      </Pressable>

      <Pressable style={getStyles(colorScheme).menuItem} onPress={() => router.push('/liked-meals')}>
        <View style={getStyles(colorScheme).menuItemLeft}>
          <View style={[getStyles(colorScheme).iconContainer, { backgroundColor: '#E8F1FF' }]}>
            <Ionicons name="heart-outline" size={24} color="#4A90E2" />
          </View>
          <View>
            <Text style={getStyles(colorScheme).menuItemTitle}>Plats likés</Text>
            <Text style={getStyles(colorScheme).menuItemSubtitle}>Voir les plats que vous aimez</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#999" />
      </Pressable>

      <Text style={getStyles(colorScheme).sectionTitle}>Paramètres de l'application</Text>

      <View style={getStyles(colorScheme).menuItem}>
        <View style={getStyles(colorScheme).menuItemLeft}>
          <View style={[getStyles(colorScheme).iconContainer, { backgroundColor: '#E8F1FF' }]}>
            <Ionicons name="moon-outline" size={24} color="#4A90E2" />
          </View>
          <View>
            <Text style={getStyles(colorScheme).menuItemTitle}>Mode sombre</Text>
            <Text style={getStyles(colorScheme).menuItemSubtitle}>Suivre le système</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>

       
            <Switch
              value={theme === 'dark'}
              onValueChange={(value) => setTheme(value ? 'dark' : 'light')}
              trackColor={{ false: '#D1D1D6', true: '#4A90E2' }}
            />
     
        </View>
      </View>

      {/* <View style={getStyles(colorScheme).menuItem}>
        <View style={getStyles(colorScheme).menuItemLeft}>
          <View style={[getStyles(colorScheme).iconContainer, { backgroundColor: '#FFE8E8' }]}>
            <Ionicons name="notifications-outline" size={24} color="#F44336" />
          </View>
          <View>
            <Text style={getStyles(colorScheme).menuItemTitle}>Notifications</Text>
            <Text style={getStyles(colorScheme).menuItemSubtitle}>Rappels de repas, conseils nutritionnels</Text>
          </View>
        </View>
        <Switch
          value={notifications}
          onValueChange={setNotifications}
          trackColor={{ false: '#D1D1D6', true: '#4A90E2' }}
        />
      </View> */}

      <Pressable style={getStyles(colorScheme).menuItem} onPress={() => router.push('/help')}>
        <View style={getStyles(colorScheme).menuItemLeft}>
          <View style={[getStyles(colorScheme).iconContainer, { backgroundColor: '#E8F1FF' }]}>
            <Ionicons name="help-circle-outline" size={24} color="#4A90E2" />
          </View>
          <Text style={getStyles(colorScheme).menuItemTitle}>Aide et support</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#999" />
      </Pressable>

      <Text style={getStyles(colorScheme).version}>Version 1.0.0</Text>

      <Pressable style={getStyles(colorScheme).logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#FF4444" />
        <Text style={getStyles(colorScheme).logoutText}>Déconnexion</Text>
      </Pressable>
    </ScrollView>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  titleText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  settingsButton: {
    padding: 8,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    borderRadius: 12,
    shadowColor: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
    paddingBottom: 10,
    alignItems: 'flex-start',
  },
  profileImageContainer: {
    marginRight: 15,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.buttonInactive : Colors.light.buttonInactive,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    marginBottom: 4,
  },
  objective: {
    fontSize: 16,
    color: colorScheme === 'dark' ? Colors.dark.icon : Colors.light.icon,
    marginBottom: 4,
  },
  editButton: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    color: Colors.light.primary,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colorScheme === 'dark' ? Colors.dark.buttonInactive : Colors.light.buttonInactive,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  menuItemTitle: {
    fontSize: 16,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: colorScheme === 'dark' ? Colors.dark.icon : Colors.light.icon,
  },
  version: {
    textAlign: 'center',
    color: colorScheme === 'dark' ? Colors.dark.icon : Colors.light.icon,
    marginTop: 20,
    marginBottom: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    marginBottom: 30,
    margin: 20,
    borderRadius: 10,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? Colors.dark.error : Colors.light.error,
  },
  logoutText: {
    color: colorScheme === 'dark' ? Colors.dark.error : Colors.light.error,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});
