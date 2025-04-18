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
import { PieChart, BarChart } from "react-native-chart-kit";

type Tab = "Historique" | "Analyse IA" | "Statistiques";
type Meal = {
  id: string;
  type: string;
  time: string;
  calories: number;
  proteines: number;
  glucides: number;
  lipides: number;
  created_at: string;
  name: string;
  photo_url: string;
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

  useEffect(() => {
    fetchMeals();
  }, [user]);

  const fetchMeals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("plats")
        .select('*')
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transformer les données pour correspondre à notre structure Meal
      const transformedMeals = (data || []).map(plat => ({
        id: plat.id,
        type: determineType(parseISO(plat.created_at)),
        time: format(parseISO(plat.created_at), 'HH:mm'),
        calories: plat.calories || 0,
        proteines: plat.proteines || 0,
        glucides: plat.glucides || 0,
        lipides: plat.lipides || 0,
        created_at: format(parseISO(plat.created_at), 'yyyy-MM-dd'),
        name: plat.name || '',
        photo_url: plat.photo_url || ''
      }));

      setMeals(transformedMeals);
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
    <View key={meal.id} style={getStyles(colorScheme).mealCard}>
    <Image source={{ uri: meal.photo_url }} style={getStyles(colorScheme).mealIcon} />
    <View style={getStyles(colorScheme).mealInfo}>
      <Text style={getStyles(colorScheme).mealTitle}>{meal.name}</Text>
      <Text style={getStyles(colorScheme).mealDetailsText}>
        {format(new Date(meal.created_at), 'HH:mm', { locale: fr })} • {meal.calories} kcal
      </Text>
    </View>
    <View style={getStyles(colorScheme).macroColumn}>
      <Text style={[getStyles(colorScheme).macroValue, { color: '#4a90e2' }]}>{meal.glucides}g G</Text>
      <Text style={[getStyles(colorScheme).macroValue, { color: '#2ecc71' }]}>{meal.proteines}g P</Text>
      <Text style={[getStyles(colorScheme).macroValue, { color: '#f1c40f' }]}>{meal.lipides}g L</Text>
    </View>
  </View>
  );

  const renderDaySection = (date: string, dayMeals: Meal[]) => (
    <View key={date} style={getStyles(colorScheme).daySection}>
      <Text style={getStyles(colorScheme).dayTitle}>{formatDate(date)}</Text>
      {dayMeals.map(renderMeal)}
    </View>
  );

  const calculateStatistics = useMemo(() => {
    if (!meals.length) return null;

    // Moyennes des macros sur 7 jours
    const last7Days = meals.filter(meal => {
      const mealDate = parseISO(meal.created_at);
      const sevenDaysAgo = subDays(new Date(), 7);
      return mealDate >= sevenDaysAgo;
    });

    const macroAverages = last7Days.reduce(
      (acc, meal) => {
        acc.proteines += meal.proteines;
        acc.glucides += meal.glucides;
        acc.lipides += meal.lipides;
        acc.calories += meal.calories;
        return acc;
      },
      { proteines: 0, glucides: 0, lipides: 0, calories: 0 }
    );

    const daysCount = last7Days.length || 1;
    
    return {
      macroDistribution: [
        { x: "Protéines", y: macroAverages.proteines / daysCount, color: "#2ecc71" },
        { x: "Glucides", y: macroAverages.glucides / daysCount, color: "#4a90e2" },
        { x: "Lipides", y: macroAverages.lipides / daysCount, color: "#f1c40f" },
      ] as MacroData[],
      caloriesPerDay: last7Days.reduce((acc: CaloriesPerDay, meal) => {
        const date = meal.created_at;
        acc[date] = (acc[date] || 0) + meal.calories;
        return acc;
      }, {}),
    };
  }, [meals]);

  const renderStatistics = () => {
    if (!calculateStatistics) return null;

    const screenWidth = Dimensions.get("window").width;
    const chartWidth = screenWidth - 32;
    const chartConfig = {
      backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
      backgroundGradientFrom: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
      backgroundGradientTo: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
      color: (opacity = 1) => colorScheme === 'dark' ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
      labelColor: (opacity = 1) => colorScheme === 'dark' ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
      strokeWidth: 2,
      barPercentage: 0.5,
    };

    const pieData = calculateStatistics.macroDistribution.map(item => ({
      name: item.x,
      value: item.y,
      color: item.color,
      legendFontColor: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
      legendFontSize: 12,
    }));

    const barData = {
      labels: Object.keys(calculateStatistics.caloriesPerDay).map(date => 
        format(parseISO(date), "dd/MM")
      ),
      datasets: [{
        data: Object.values(calculateStatistics.caloriesPerDay),
      }],
    };

    return (
      <ScrollView style={getStyles(colorScheme).statisticsContainer}>
        <View style={getStyles(colorScheme).chartCard}>
          <Text style={getStyles(colorScheme).chartTitle}>
            Distribution moyenne des macronutriments
          </Text>
          <PieChart
            data={pieData}
            width={chartWidth}
            height={220}
            chartConfig={chartConfig}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>

        <View style={getStyles(colorScheme).chartCard}>
          <Text style={getStyles(colorScheme).chartTitle}>
            Calories par jour (7 derniers jours)
          </Text>
          <BarChart
            data={barData}
            width={chartWidth}
            height={220}
            yAxisLabel=""
            yAxisSuffix=" cal"
            chartConfig={chartConfig}
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </View>
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
      <View style={getStyles(colorScheme).header}>
        <Text style={getStyles(colorScheme).headerTitle}>Review</Text>
      </View>
      <View style={getStyles(colorScheme).tabContainer}>
        <View style={getStyles(colorScheme).tabBackground}>
          {(["Historique", "Analyse IA", "Statistiques"] as Tab[]).map(
            (tab) => (
              <TouchableOpacity
                key={tab}
                style={[getStyles(colorScheme).tab, activeTab === tab && getStyles(colorScheme).activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    getStyles(colorScheme).tabText,
                    activeTab === tab && getStyles(colorScheme).activeTabText,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>

      <ScrollView style={getStyles(colorScheme).content}>
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
    flex: 1,
    padding: 16,
  },
  chartCard: {
    backgroundColor: colorScheme === 'dark' ? Colors.dark.card : Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
    color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
  },
});
