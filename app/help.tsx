import { StyleSheet, View, Text, FlatList, Image, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function HelpScreen() {
  const colorScheme = useColorScheme();

  return (
    <View style={getStyles(colorScheme).container}>
      <View style={getStyles(colorScheme).header}>
        <TouchableOpacity onPress={() => router.back()} style={getStyles(colorScheme).backButton}>
          <Ionicons name="arrow-back" size={24} color={getStyles(colorScheme).text} />
        </TouchableOpacity>
        <Text style={getStyles(colorScheme).title}>Aide et Support</Text>
        <View style={getStyles(colorScheme).backButton} />
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
    backgroundColor: Colors.light.background,
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

});
