import React, { useState } from 'react';
import { View, TextInput, ActivityIndicator, TouchableOpacity, Image, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchResult {
  food_name: string;
  tag_id: number;
  photo: {
    thumb: string;
  };
  serving_qty: number;
  serving_unit: string;
}

interface SearchBarProps {
  colorScheme: 'light' | 'dark';
  getStyles: (colorScheme: 'light' | 'dark') => any;
  onResultSelect: (result: SearchResult) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ colorScheme, getStyles, onResultSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    if (query.trim() === '') {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await fetch(`https://food-snap.vercel.app/api/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data.common || []);
    } catch (error) {
      setSearchResults([
        {
          tag_id: 0,
          food_name: 'Erreur de connexion au serveur',
          photo: {
            thumb: 'https://d2eawub7utcl6.cloudfront.net/images/nix-apple-grey.png',
          },
          serving_qty: 0,
          serving_unit: '',
        },
      ]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <View style={getStyles(colorScheme).searchContainer}>
      <View style={getStyles(colorScheme).searchInputContainer}>
        <Ionicons name="search-outline" size={20} color={colorScheme === 'dark' ? '#fff' : '#000'} />
        <TextInput
          style={getStyles(colorScheme).searchInput}
          placeholder="Rechercher..."
          placeholderTextColor={colorScheme === 'dark' ? '#fff' : '#000'}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && !isSearching && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              setSearchResults([]);
            }}
            style={{ marginLeft: 8 }}
          >
            <Ionicons name="close-circle" size={20} color={colorScheme === 'dark' ? '#fff' : '#000'} />
          </TouchableOpacity>
        )}
        {isSearching && <ActivityIndicator size="small" color="#4a90e2" />}
      </View>
      {searchResults.length > 0 && (
        <ScrollView
          style={[getStyles(colorScheme).searchResults, { maxHeight: 350 }]}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
        >
          {searchResults.map((result, index) => (
            <TouchableOpacity
              key={result.tag_id + result.food_name || index}
              style={getStyles(colorScheme).searchResultItem}
              onPress={async () => {
                setSearchQuery('');
                setSearchResults([]);
                try {
                  const response = await fetch(`https://food-snap.vercel.app/api/food-info?query=${encodeURIComponent(result.food_name)}`);
                  const data = await response.json();

                  onResultSelect(data);
                } catch (error) {
                  Alert.alert('Erreur', 'Erreur lors de la récupération des infos nutritionnelles.');
                }
              }}
            >
              <View style={getStyles(colorScheme).searchResultContent}>
                <Image
                  source={{ uri: result.photo.thumb }}
                  style={getStyles(colorScheme).searchResultImage}
                />
                <View style={getStyles(colorScheme).searchResultTextContainer}>
                  <Text style={getStyles(colorScheme).searchResultText}>{result.food_name}</Text>
                  <Text style={getStyles(colorScheme).searchResultSubtext}>
                    {result.serving_qty} {result.serving_unit}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default SearchBar; 