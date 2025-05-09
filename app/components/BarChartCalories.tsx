import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Text, TouchableWithoutFeedback } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Colors } from '@/constants/Colors';

interface BarChartCaloriesProps {
  barData: { value: number; label: string; frontColor: string }[];
  selectedRange: number;
  colorScheme: 'light' | 'dark';
  axisTextStyle: object;
}

const BarChartCalories: React.FC<BarChartCaloriesProps> = ({ barData, selectedRange, colorScheme, axisTextStyle }) => {
  const screenWidth = Dimensions.get('window').width;
  // Largeur dynamique : si plus de 7 barres, on augmente la largeur pour permettre le scroll
  let barWidth = 30;
  let spacing = 20;
  let minWidth = screenWidth - 32;

  if (selectedRange === 7) {
    barWidth = 27;
    spacing = 15;
    minWidth = screenWidth - 32;
  } else if (selectedRange === 14) {
    barWidth = 14;
    spacing = 7;
    minWidth = screenWidth - 32;
  } else if (selectedRange === 30) {
    barWidth = 7;
    spacing = 3;
    minWidth = screenWidth - 32;
  }
  const dynamicWidth = barData.length > 7 ? barData.length * (barWidth + spacing) : minWidth;

  // Tooltip state
  const [tooltip, setTooltip] = useState<{ index: number; x: number; y: number } | null>(null);
  const [tooltipData, setTooltipData] = useState<{ label: string; value: number } | null>(null);
  let tooltipTimeout: NodeJS.Timeout;

  const handleBarPress = (item: any, index: number) => {
    // Si on appuie sur la même barre déjà sélectionnée, on ferme le tooltip
    if (tooltip && tooltip.index === index) {
      setTooltip(null);
      setTooltipData(null);
      return;
    }
    // Calculer la position x de la barre
    const x = index * (barWidth + spacing) + barWidth / 2;
    setTooltip({ index, x, y: 0 });
    setTooltipData({ label: item.label, value: item.value });
  };

  const handleCloseTooltip = () => {
    setTooltip(null);
    setTooltipData(null);
  };

  return (
    <View style={[styles.card, colorScheme === 'dark' ? styles.cardDark : styles.cardLight, { paddingHorizontal: 0 }]}> 
      <Text style={[styles.title, { color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text }]}>Calories par jour</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableWithoutFeedback onPress={handleCloseTooltip}>
          <View style={{ alignItems: 'center', marginVertical: 20, width: dynamicWidth }}>
            {tooltip && tooltipData && (
              <View
                style={[
                  styles.tooltip,
                  {
                    left: tooltip.x - 50, // centrer le tooltip sur la barre
                    top: 0,
                    backgroundColor: colorScheme === 'dark' ? '#222' : '#fff',
                    borderColor: colorScheme === 'dark' ? '#fff' : '#222',
                  },
                ]}
              >
                <Text style={{ color: colorScheme === 'dark' ? '#fff' : '#222', fontWeight: 'bold' }}>{tooltipData.label}</Text>
                <Text style={{ color: colorScheme === 'dark' ? '#fff' : '#222' }}>{tooltipData.value} kcal</Text>
              </View>
            )}
            <BarChart
              data={barData}
              width={dynamicWidth}
              height={220}
              barWidth={barWidth}
              spacing={spacing}
              hideRules
              xAxisLabelTextStyle={{ color: 'transparent', fontSize: 1 }}
              yAxisTextStyle={axisTextStyle}
              noOfSections={5}
              onPress={handleBarPress}
            />
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    paddingHorizontal: 0,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    width: '100%',
  },
  cardLight: {
    backgroundColor: '#fff',
  },
  cardDark: {
    backgroundColor: '#18181b',
  },
  tooltip: {
    position: 'absolute',
    zIndex: 10,
    width: 100,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
});

export default BarChartCalories; 