import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { Colors } from '@/constants/Colors';

interface PieDataItem {
  value: number;
  text: string;
  color: string;
  label: string;
}

interface MacroPieChartProps {
  pieData: PieDataItem[];
  colorScheme: 'light' | 'dark';
}

export default function MacroPieChart({ pieData, colorScheme }: MacroPieChartProps) {
  return (
    <View style={[styles(colorScheme).card, { backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background }]}> 
      <Text style={[styles(colorScheme).title, { color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text }]}>Distribution des macros</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 20, marginLeft: 32 }}>
        {/* PieChart à gauche */}
        <PieChart
          data={pieData}
          donut
          radius={55}
          innerRadius={38}
          centerLabelComponent={() => (
            <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.light.text }}>Macros</Text>
          )}
        />
        {/* Colonne des données à droite */}
        <View style={{ flex: 1, justifyContent: 'center', gap: 12, marginLeft: 32 }}>
          {pieData.map((item) => (
            <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: item.color,
                marginRight: 8,
              }} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text }}>
                {item.label}
              </Text>
              <Text style={{ marginLeft: 8, fontSize: 15, color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text }}>
                {item.text}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
}); 