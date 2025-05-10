import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface NutritionTableProps {
  calories: number;
  glucides: number;
  sucres: number;
  fibres: number;
  proteines: number;
  lipides: number;
  satures: number;
  style?: ViewStyle;
}

const NutritionTable: React.FC<NutritionTableProps> = ({
  calories,
  glucides,
  sucres,
  fibres,
  proteines,
  lipides,
  satures,
  style,
}) => (
  <View style={[styles.nutritionTable, style]}>
    <View style={styles.nutritionRow}>
      <Text style={styles.nutritionLabel}>Calories</Text>
      <Text style={styles.nutritionValue}>{calories} kcal</Text>
    </View>
    <View style={styles.nutritionRow}>
      <Text style={styles.nutritionLabel}>Glucides</Text>
      <Text style={styles.nutritionValue}>{glucides}g</Text>
    </View>
    <View style={[styles.nutritionRow, styles.subRow]}>
      <Text style={styles.nutritionSubLabel}>dont sucres</Text>
      <Text style={styles.nutritionValue}>{sucres}g</Text>
    </View>
    <View style={[styles.nutritionRow, styles.subRow]}>
      <Text style={styles.nutritionSubLabel}>dont fibres</Text>
      <Text style={styles.nutritionValue}>{fibres}g</Text>
    </View>
    <View style={styles.nutritionRow}>
      <Text style={styles.nutritionLabel}>Protéines</Text>
      <Text style={styles.nutritionValue}>{proteines}g</Text>
    </View>
    <View style={styles.nutritionRow}>
      <Text style={styles.nutritionLabel}>Lipides</Text>
      <Text style={styles.nutritionValue}>{lipides}g</Text>
    </View>
    <View style={[styles.nutritionRow, styles.subRow]}>
      <Text style={styles.nutritionSubLabel}>dont saturés</Text>
      <Text style={styles.nutritionValue}>{satures}g</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  nutritionTable: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  subRow: {
    paddingLeft: 20,
  },
  nutritionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  nutritionSubLabel: {
    fontSize: 14,
    color: '#666',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default NutritionTable; 