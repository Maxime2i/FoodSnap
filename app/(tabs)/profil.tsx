import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { UserProfile } from '@/types/auth';
import { Colors } from '@/constants/Colors';

export default function ProfilScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [user]);

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
      <View style={styles.container}>
        <Text style={styles.text}>Chargement...</Text>
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mon Profil</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations Personnelles</Text>
        <View style={styles.infoContainer}>
          <Text style={styles.label}>Nom:</Text>
          <Text style={styles.text}>{profile?.last_name || '-'}</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.label}>Prénom:</Text>
          <Text style={styles.text}>{profile?.first_name || '-'}</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.text}>{profile?.email || '-'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mensurations</Text>
        <View style={styles.infoContainer}>
          <Text style={styles.label}>Âge:</Text>
          <Text style={styles.text}>{profile?.age || '-'} ans</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.label}>Taille:</Text>
          <Text style={styles.text}>{profile?.height || '-'} cm</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.label}>Poids:</Text>
          <Text style={styles.text}>{profile?.weight || '-'} kg</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Objectif</Text>
        <Text style={styles.text}>{profile?.goal ? getGoalLabel(profile.goal) : '-'}</Text>
      </View>

      {profile?.allergies && profile.allergies.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allergies</Text>
          {profile.allergies.map((allergie, index) => (
            <Text key={index} style={styles.listItem}>• {allergie}</Text>
          ))}
        </View>
      )}

      {profile?.medical_conditions && profile.medical_conditions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conditions Médicales</Text>
          {profile.medical_conditions.map((condition, index) => (
            <Text key={index} style={styles.listItem}>• {condition}</Text>
          ))}
        </View>
      )}
      
      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Déconnexion</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 20,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: Colors.light.text,
  },
  infoContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  label: {
    width: 100,
    fontWeight: '500',
    color: Colors.light.text,
  },
  text: {
    flex: 1,
    color: Colors.light.text,
  },
  listItem: {
    marginBottom: 5,
    color: Colors.light.text,
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    padding: 15,
    borderRadius: 10,
    margin: 20,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
