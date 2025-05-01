import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function HelpScreen() {
  const colorScheme = useColorScheme();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmitFeedback = async () => {
    if (!message.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un message');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('feedback')
        .insert([
          {
            user_id: user?.id,
            message: message.trim(),
          },
        ]);

      if (error) throw error;

      Alert.alert('Succès', 'Merci pour votre feedback!');
      setMessage('');
      router.push('/(tabs)');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer le feedback');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={getStyles(colorScheme).container}>
      <View style={getStyles(colorScheme).header}>
        <TouchableOpacity onPress={() => router.back()} style={getStyles(colorScheme).backButton}>
          <Ionicons name="arrow-back" size={24} color={colorScheme === 'dark' ? Colors.dark.text : Colors.light.text} />
        </TouchableOpacity>
        <Text style={getStyles(colorScheme).title}>Aide et Support</Text>
        <View style={getStyles(colorScheme).backButton} />
      </View>

      <View style={getStyles(colorScheme).feedbackContainer}>
        <Text style={getStyles(colorScheme).feedbackTitle}>Envoyez-nous votre feedback</Text>
        <TextInput
          style={getStyles(colorScheme).input}
          placeholder="Votre message..."
          placeholderTextColor={colorScheme === 'dark' ? Colors.dark.text : Colors.light.text}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
        />
        <TouchableOpacity 
          style={getStyles(colorScheme).submitButton}
          onPress={handleSubmitFeedback}
          disabled={loading}
        >
          <Text style={getStyles(colorScheme).submitButtonText}>
            {loading ? 'Envoi...' : 'Envoyer'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  feedbackContainer: {
    padding: 20,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    borderRadius: 8,
    padding: 12,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: Colors.light.tint,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
