import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface TabSelectorProps {
  tabs: string[];
  selectedTab: string;
  onSelectTab: (tab: string) => void;
}

const TabSelector: React.FC<TabSelectorProps> = ({ tabs, selectedTab, onSelectTab }) => {
  const colorScheme = useColorScheme();
  return (
    <View style={getStyles(colorScheme).container}>
      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => onSelectTab(tab)}
          activeOpacity={0.8}
          style={[
            getStyles(colorScheme).tab,
            selectedTab === tab ? getStyles(colorScheme).selectedTab : {},
          ]}
        >
          <Text style={{
            color: selectedTab === tab ? '#222B45' : '#7B8A9D',
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
    backgroundColor: '#E0E3E7',
    borderRadius: 24,
    padding: 4,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 15,
    height: 40,
    width: '90%',
  },
  tab: {
    flex: 1,
    fontSize: 14,
    color: '#7B8A9D',
    paddingVertical: 5,
    borderRadius: 20,
    marginHorizontal: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default TabSelector;

