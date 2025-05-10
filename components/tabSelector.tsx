import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

const TAB_MARGIN = 0; // Doit correspondre à marginHorizontal dans le style tab

interface TabSelectorProps {
  tabs: string[];
  selectedTab: string;
  onSelectTab: (tab: string) => void;
}

const TabSelector: React.FC<TabSelectorProps> = ({ tabs, selectedTab, onSelectTab }) => {
  const colorScheme = useColorScheme();
  const [tabWidths, setTabWidths] = useState<number[]>(Array(tabs.length).fill(0));
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [bgWidth, setBgWidth] = useState(0);

  // Trouver l'index du tab sélectionné
  const selectedIndex = tabs.indexOf(selectedTab);

  // Calculer la position cible en additionnant les largeurs et marges précédentes
  const getTargetPosition = () => {
    let pos = 0;
    for (let i = 0; i < selectedIndex; i++) {
      pos += tabWidths[i] + 2 * TAB_MARGIN;
    }
    return pos;
  };

  // Animer la translation lors du changement de tab ou de largeur
  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: getTargetPosition(),
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
    setBgWidth(tabWidths[selectedIndex] || 0);
  }, [selectedIndex, tabWidths.join(",")]);

  // Mettre à jour la largeur de chaque tab individuellement
  const onTabLayout = (index: number) => (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    setTabWidths((prev) => {
      if (prev[index] === width) return prev;
      const next = [...prev];
      next[index] = width;
      return next;
    });
  };

  return (
    <View style={getStyles(colorScheme).container}>
      {/* Animated background */}
      {bgWidth > 0 && (
        <Animated.View
          style={[
            styles(colorScheme).animatedBg,
            {
              width: bgWidth,
              left: 4,
              transform: [{ translateX: animatedValue }],
            },
          ]}
        />
      )}
      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => onSelectTab(tab)}
          activeOpacity={0.8}
          style={[
            getStyles(colorScheme).tab,
            selectedTab === tab ? getStyles(colorScheme).selectedTab : {},
          ]}
          onLayout={onTabLayout(index)}
        >
          <Text style={{
            color: selectedTab === tab ? colorScheme === 'dark' ? Colors.dark.text : Colors.light.text : colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
            fontWeight: selectedTab === tab ? 'bold' : 'normal',
          }}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const getStyles = (colorScheme: string) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
    borderRadius: 24,
    padding: 4,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 15,
    height: 40,
    width: '90%',
    position: 'relative',
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    fontSize: 14,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    paddingVertical: 5,
    borderRadius: 20,
    marginHorizontal: TAB_MARGIN,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  selectedTab: {
    // Le fond est géré par l'Animated.View
  },
});

const styles = (colorScheme: string) => StyleSheet.create({
  animatedBg: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    // left est géré dynamiquement
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 0,
  },
});

export default TabSelector;

