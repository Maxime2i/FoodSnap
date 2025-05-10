import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
} from "react-native";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { format, parseISO, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { PieChart, BarChart } from "react-native-gifted-charts";
import HeaderTitle from "@/components/headerTitle";
import TabSelector from "@/components/tabSelector";
import MealCard from "@/components/mealCard";
import MacroPieChart from '../components/MacroPieChart';
import BarChartCalories from '../components/BarChartCalories';

type Tab = "Historique" | "Analyse IA" | "Statistiques";


type FoodItem = {
  name: string;
  quantity: number;
  calories: number;
  carbs: number;
  proteins: number;
  fats: number;
  glycemicImpact: number;
  photo?: string;
};

type Meal = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  total_calories: number;
  total_carbs: number;
  total_proteins: number;
  total_fats: number;
  glycemic_index: number;
  glycemic_load: number;
  foods: FoodItem[];
};

interface CaloriesPerDay {
  [key: string]: number;
}

interface MacroData {
  x: string;
  y: number;
  color: string;
}

export default function ReviewScreen() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("Historique");
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<7 | 14 | 30>(7);

  useEffect(() => {
    fetchMeals();
  }, [user]);

  const fetchMeals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("meals")
        .select('*')
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setMeals(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des repas:", error);
    } finally {
      setLoading(false);
    }
  };

  const determineType = (date: Date) => {
    const hour = date.getHours();
    if (hour < 11) return "Petit déjeuner";
    if (hour < 15) return "Déjeuner";
    if (hour < 19) return "Goûter";
    return "Dîner";
  };

  const groupMealsByDate = (meals: Meal[]) => {
    const groups: { [key: string]: Meal[] } = {};

    meals.forEach((meal) => {
      const date = meal.created_at;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(meal);
    });

    return groups;
  };

  const formatDate = (date: string) => {
    const today = format(new Date(), "yyyy-MM-dd");
    const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");

    switch (date) {
      case today:
        return "Aujourd'hui";
      case yesterday:
        return "Hier";
      default:
        return format(parseISO(date), "d MMMM yyyy", { locale: fr });
    }
  };

  const renderMeal = (meal: Meal) => (
    <MealCard meal={meal} />
  );

  const renderDaySection = (date: string, dayMeals: Meal[]) => (
    <View key={date + Math.random()} style={getStyles(colorScheme).daySection}>
      <Text style={getStyles(colorScheme).dayTitle}>{formatDate(date)}</Text>
      {dayMeals.map(renderMeal)}
    </View>
  );

  const calculateStatistics = useMemo(() => {
    if (!meals.length) return null;

    // Moyennes des macros sur la plage sélectionnée
    const lastXDays = meals.filter(meal => {
      const mealDate = parseISO(meal.created_at);
      const xDaysAgo = subDays(new Date(), selectedRange);
      return mealDate >= xDaysAgo;
    });

    const macroAverages = lastXDays.reduce(
      (acc, meal) => {
        acc.proteines += meal.total_proteins;
        acc.glucides += meal.total_carbs;
        acc.lipides += meal.total_fats;
        acc.calories += meal.total_calories;
        return acc;
      },
      { proteines: 0, glucides: 0, lipides: 0, calories: 0 }
    );

    const daysCount = lastXDays.length || 1;
    
    return {
      macroDistribution: [
        { x: "Protéines", y: macroAverages.proteines / daysCount, color: "#2ecc71" },
        { x: "Glucides", y: macroAverages.glucides / daysCount, color: "#4a90e2" },
        { x: "Lipides", y: macroAverages.lipides / daysCount, color: "#f1c40f" },
      ] as MacroData[],
      caloriesPerDay: lastXDays.reduce((acc: CaloriesPerDay, meal) => {
        const date = format(parseISO(meal.created_at), 'yyyy-MM-dd');
        acc[date] = (acc[date] || 0) + meal.total_calories;
        return acc;
      }, {}),
    };
  }, [meals, selectedRange]);

  const renderStatistics = () => {
    if (!calculateStatistics) return null;

    const screenWidth = Dimensions.get("window").width;
    const chartWidth = screenWidth - 132;

    // Données pour le graphique en camembert
    const pieData = calculateStatistics.macroDistribution.map(item => ({
      value: item.y,
      text: `${Math.round(item.y)}g`,
      color: item.color,
      label: item.x,
    }));

    // Données pour le graphique en barres
    // Générer toutes les dates de la période sélectionnée
    const today = new Date();
    const daysArray = Array.from({ length: selectedRange }, (_, i) => {
      const d = subDays(today, selectedRange - 1 - i);
      return format(d, 'yyyy-MM-dd');
    });

    const barData = daysArray.map(date => ({
      value: calculateStatistics.caloriesPerDay[date] || 0,
      label: format(parseISO(date), 'dd/MM'),
      frontColor: '#4a90e2',
    }));

    return (
      <ScrollView style={getStyles(colorScheme).statisticsContainer}>
        <View style={{flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 8, gap: 8}}>
          {[7, 14, 30].map((range) => {
            const isSelected = selectedRange === range;
            return (
              <TouchableOpacity
                key={range}
                style={{
                  paddingVertical: 2,
                  paddingHorizontal: 8,
                  borderRadius: 12,
                  backgroundColor: isSelected ? '#e8f0fe' : 'transparent',
                }}
                onPress={() => setSelectedRange(range as 7 | 14 | 30)}
              >
                <Text style={{
                  color: isSelected ? colorScheme === 'dark' ? Colors.dark.primary : Colors.light.primary : colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
                  fontWeight: isSelected ? 'bold' : 'normal',
                  fontSize: 14,
                }}>{range}j</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <MacroPieChart pieData={pieData} colorScheme={colorScheme} />

        <BarChartCalories
          barData={barData}
          colorScheme={colorScheme}
          axisTextStyle={getStyles(colorScheme).axisText}
          selectedRange={selectedRange}
        />
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={[getStyles(colorScheme).container, getStyles(colorScheme).centered]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  const groupedMeals = groupMealsByDate(meals);

  return (
    <View style={getStyles(colorScheme).container}>
      
      <HeaderTitle title="Review" />
      <TabSelector
        tabs={["Historique", "Statistiques"]}
        selectedTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab as Tab)}
      />

   

      <ScrollView style={getStyles(colorScheme).content} key={activeTab}>
        {activeTab === "Historique" &&
          Object.entries(groupedMeals).map(([created_at, dayMeals]) =>
            renderDaySection(created_at, dayMeals)
          )}
        {activeTab === "Statistiques" && renderStatistics()}
      </ScrollView>
    </View>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "bold",
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
  },
  tabBackground: {
    flexDirection: "row",
    backgroundColor: colorScheme === 'dark' ? Colors.dark.border : Colors.light.border,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
  },
  tabText: {
    fontSize: 15,
    textAlign: "center",
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  activeTabText: {
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  daySection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  mealCard: {
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  mealIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    marginRight: 16,
  },
  mealInfo: {
    flex: 1,
  },
  mealDetailsText: {
    fontSize: 14,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  mealDetails: {
    fontSize: 14,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroColumn: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginLeft: 'auto',
    gap: 4,
  },
  macroValue: {
    fontSize: 12,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    fontWeight: '500',
  },
  statisticsContainer: {
    padding: 16,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
    textAlign: 'center',
  },
  centerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
  axisText: {
    fontSize: 12,
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
});

