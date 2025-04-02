import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { router } from 'expo-router';


export default function HomeScreen() {
  const { user } = useAuth();
  const currentDate = new Date();
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  };
  const formattedDate = currentDate.toLocaleDateString('fr-FR', options);

  // Calculer le total des calories et macronutriments pour aujourd'hui
  const todayMeals = user?.meals?.filter(meal => {
    const mealDate = new Date(meal.created_at);
    return mealDate.toDateString() === currentDate.toDateString();
  }) || [];

  const totals = todayMeals.reduce((acc, meal) => ({
    calories: acc.calories + (meal.calories || 0),
    glucides: acc.glucides + (meal.glucides || 0),
    proteines: acc.proteines + (meal.proteines || 0),
    lipides: acc.lipides + (meal.lipides || 0),
  }), { calories: 0, glucides: 0, proteines: 0, lipides: 0 });

  const goals = {
    calories: 2000,
    glucides: 250,
    proteines: 120,
    lipides: 65
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Bonjour, {user?.first_name || 'Utilisateur'}</Text>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>

      <View style={styles.caloriesCard}>
        <View style={styles.caloriesHeader}>
          <Text style={styles.caloriesTitle}>Calories aujourd'hui</Text>
          <Text style={styles.caloriesTotal}>{totals.calories} / {goals.calories} kcal</Text>
        </View>

        <View style={styles.caloriesMain}>
          <Ionicons name="flame-outline" size={32} color="#ff9500" />
          <Text style={styles.caloriesValue}>{totals.calories}</Text>
        </View>

        <Text style={styles.caloriesRemaining}>{goals.calories - totals.calories} kcal restantes</Text>

        <View style={styles.caloriesBar}>
          <LinearGradient
            colors={['#3498db', '#e8f4f8']}
            style={[styles.caloriesProgress, { width: `${(totals.calories / goals.calories) * 100}%` }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
        <View style={styles.caloriesRange}>
          <Text style={styles.caloriesRangeText}>{totals.calories} kcal</Text>
          <Text style={styles.caloriesRangeText}>{goals.calories} kcal</Text>
        </View>
      </View>

      <View style={styles.macrosSection}>
        <Text style={styles.macrosTitle}>Macronutriments</Text>
        <View style={styles.macrosGrid}>
          <View style={styles.macroCard}>
            <View style={[styles.macroIcon, { backgroundColor: '#e8f0ff' }]}>
              <Ionicons name="pizza-outline" size={24} color="#4a90e2" />
            </View>
            <Text style={styles.macroLabel}>Glucides</Text>
            <Text style={styles.macroValue}>{totals.glucides}g</Text>
            <Text style={styles.macroGoal}>sur {goals.glucides}g</Text>
          </View>

          <View style={styles.macroCard}>
            <View style={[styles.macroIcon, { backgroundColor: '#e8fff0' }]}>
              <Ionicons name="fish-outline" size={24} color="#2ecc71" />
            </View>
            <Text style={styles.macroLabel}>Protéines</Text>
            <Text style={styles.macroValue}>{totals.proteines}g</Text>
            <Text style={styles.macroGoal}>sur {goals.proteines}g</Text>
          </View>

          <View style={styles.macroCard}>
            <View style={[styles.macroIcon, { backgroundColor: '#fff8e8' }]}>
              <Ionicons name="water-outline" size={24} color="#f1c40f" />
            </View>
            <Text style={styles.macroLabel}>Lipides</Text>
            <Text style={styles.macroValue}>{totals.lipides}g</Text>
            <Text style={styles.macroGoal}>sur {goals.lipides}g</Text>
          </View>
        </View>
      </View>

      <View style={styles.mealsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Repas récents</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/review')}>
            <Text style={styles.seeAll}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        {user?.meals?.slice(0, 2).map((meal) => (
          <View key={meal.id} style={styles.mealCard}>
            <Image source={{ uri: meal.photo_url }} style={styles.mealIcon} />
            <View style={styles.mealInfo}>
              <Text style={styles.mealTitle}>{meal.name}</Text>
              <Text style={styles.mealDetails}>
                {format(new Date(meal.created_at), 'HH:mm', { locale: fr })} • {meal.glucides}g glucides
              </Text>
            </View>
           
          </View>
        ))}

        <TouchableOpacity style={styles.addMealButton}>
          <Ionicons name="add" size={24} color="#4a90e2" />
          <Text style={styles.addMealText}>Ajouter un repas</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  date: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  caloriesCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  caloriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caloriesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  caloriesTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  caloriesMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  caloriesValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginLeft: 16,
  },
  caloriesRemaining: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  caloriesBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e8f4f8',
    marginTop: 20,
  },
  caloriesProgress: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3498db',
  },
  caloriesRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  caloriesRangeText: {
    fontSize: 14,
    color: '#666',
  },
  macrosSection: {
    padding: 16,
  },
  macrosTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  macroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  macroLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  macroGoal: {
    fontSize: 14,
    color: '#666',
  },
  mealsSection: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  seeAll: {
    fontSize: 14,
    color: '#4a90e2',
  },
  mealCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  mealIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    marginRight: 16,
  },
  mealInfo: {
    flex: 1,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  mealDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  glucoseChange: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a90e2',
  },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  addMealText: {
    fontSize: 16,
    color: '#4a90e2',
    marginLeft: 8,
  },
});
