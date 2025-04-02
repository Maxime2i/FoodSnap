import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOTP, setShowOTP] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        }); 
        if (error) throw error;
        router.replace('/(tabs)');
      } else {
        if (!showOTP) {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: undefined,
            },
          });
          if (error) throw error;
          setShowOTP(true);
        } else {
          const { error } = await supabase.auth.verifyOtp({
            email,
            token: otpCode,
            type: 'signup',
          });
          if (error) throw error;
          router.replace('/(onboarding)/step1');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.form}>
        <Text style={styles.title}>
          {isLogin ? 'Connexion' : (showOTP ? 'Vérification Email' : 'Inscription')}
        </Text>
        
        {error && (
          <Text style={styles.error}>{error}</Text>
        )}

        {!showOTP && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </>
        )}

        {showOTP && (
          <>
            <Text style={styles.description}>
              Veuillez entrer le code de vérification envoyé à votre email
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Code de vérification"
              value={otpCode}
              onChangeText={setOtpCode}
              keyboardType="number-pad"
              autoCapitalize="none"
            />
          </>
        )}

        <TouchableOpacity 
          style={styles.button}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : (showOTP ? 'Vérifier' : "S'inscrire"))}
          </Text>
        </TouchableOpacity>

        {!showOTP && (
          <TouchableOpacity 
            onPress={() => setIsLogin(!isLogin)}
            style={styles.switchButton}
          >
            <Text style={styles.switchText}>
              {isLogin ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  form: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: Colors.light.text,
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
    color: Colors.light.text,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: Colors.light.tint,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: Colors.light.tint,
    fontSize: 14,
  },
  error: {
    color: '#ff0000',
    marginBottom: 15,
    textAlign: 'center',
  },
}); 