import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useColorScheme } from "@/hooks/useColorScheme";

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOTP, setShowOTP] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  const handleResendOTP = async () => {
    setResendLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
        },
      });
      if (error) throw error;
      alert('Un nouveau code de vérification a été envoyé à votre email');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi du code');
    } finally {
      setResendLoading(false);
    }
  };

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
      style={getStyles(colorScheme).container}
    >
      <View style={getStyles(colorScheme).form}>
        <Text style={getStyles(colorScheme).title}>
          {isLogin ? 'Connexion' : (showOTP ? 'Vérification Email' : 'Inscription')}
        </Text>
        
        {error && (
          <Text style={getStyles(colorScheme).error}>{error}</Text>
        )}

        {!showOTP && (
          <>
            <TextInput
              style={getStyles(colorScheme).input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TextInput
              style={getStyles(colorScheme).input}
              placeholder="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </>
        )}

        {showOTP && (
          <>
            <Text style={getStyles(colorScheme).description}>
              Veuillez entrer le code de vérification envoyé à votre email
            </Text>
            <TextInput
              style={getStyles(colorScheme).input}
              placeholder="Code de vérification"
              value={otpCode}
              onChangeText={setOtpCode}
              keyboardType="number-pad"
              autoCapitalize="none"
            />
            <TouchableOpacity 
              style={getStyles(colorScheme).resendButton}
              onPress={handleResendOTP}
              disabled={resendLoading}
            >
              <Text style={getStyles(colorScheme).resendButtonText}>
                {resendLoading ? 'Envoi en cours...' : 'Renvoyer le code'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity 
          style={getStyles(colorScheme).button}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={getStyles(colorScheme).buttonText}>
            {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : (showOTP ? 'Vérifier' : "S'inscrire"))}
          </Text>
        </TouchableOpacity>

        {!showOTP && (
          <TouchableOpacity 
            onPress={() => setIsLogin(!isLogin)}
            style={getStyles(colorScheme).switchButton}
          >
            <Text style={getStyles(colorScheme).switchText}>
              {isLogin ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
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
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  input: {
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  button: {
    backgroundColor: colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint,
    fontSize: 14,
  },
  error: {
    color: colorScheme === 'dark' ? Colors.dark.error : Colors.light.error,
    marginBottom: 15,
    textAlign: 'center',
  },
  resendButton: {
    marginBottom: 15,
    alignItems: 'center',
  },
  resendButtonText: {
    color: colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
}); 