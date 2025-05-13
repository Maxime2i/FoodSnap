import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

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
}) => {
  const colorScheme = useColorScheme();

  return (
    <View style={[getStyles(colorScheme).nutritionTable, style]}>
      <View style={getStyles(colorScheme).nutritionRow}>
        <Text style={getStyles(colorScheme).nutritionLabel}>Calories</Text>
      <Text style={getStyles(colorScheme).nutritionValue}>{calories.toFixed(1)} kcal</Text>
    </View>
    <View style={getStyles(colorScheme).nutritionRow}>
      <Text style={getStyles(colorScheme).nutritionLabel}>Glucides</Text>
      <Text style={getStyles(colorScheme).nutritionValue}>{glucides.toFixed(1)}g</Text>
    </View>
    <View style={[getStyles(colorScheme).nutritionRow, getStyles(colorScheme).subRow]}>
      <Text style={getStyles(colorScheme).nutritionSubLabel}>dont sucres</Text>
      <Text style={getStyles(colorScheme).nutritionValue}>{sucres.toFixed(1)}g</Text>
    </View>
    <View style={[getStyles(colorScheme).nutritionRow, getStyles(colorScheme).subRow]}>
      <Text style={getStyles(colorScheme).nutritionSubLabel}>dont fibres</Text>
      <Text style={getStyles(colorScheme).nutritionValue}>{fibres.toFixed(1)}g</Text>
    </View>
    <View style={getStyles(colorScheme).nutritionRow}>
      <Text style={getStyles(colorScheme).nutritionLabel}>Protéines</Text>
      <Text style={getStyles(colorScheme).nutritionValue}>{proteines.toFixed(1)}g</Text>
    </View>
    <View style={getStyles(colorScheme).nutritionRow}>
      <Text style={getStyles(colorScheme).nutritionLabel}>Lipides</Text>
      <Text style={getStyles(colorScheme).nutritionValue}>{lipides.toFixed(1)}g</Text>
    </View>
    <View style={[getStyles(colorScheme).nutritionRow, getStyles(colorScheme).subRow]}>
      <Text style={getStyles(colorScheme).nutritionSubLabel}>dont saturés</Text>
      <Text style={getStyles(colorScheme).nutritionValue}>{satures.toFixed(1)}g</Text>
    </View>
  </View>
  );
};


const getStyles = (colorScheme: string) => StyleSheet.create({
  nutritionTable: {
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  subRow: {
    paddingLeft: 20,
  },
  nutritionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  nutritionSubLabel: {
    fontSize: 14,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
});

export default NutritionTable; 