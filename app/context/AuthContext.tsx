import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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

type AuthContextType = {
  user: { 
    id: string; 
    email: string; 
    first_name: string;
    last_name: string;
    avatar_url: string;
    glucides: number;
    calories: number;
    proteines: number;
    lipides: number;
    meals: Meal[];
  } | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  refreshUser: async () => {} 
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url, glucides, calories, proteines, lipides')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      return null;
    }

    return data;
  };
  
  const fetchUserMeals = async (userId: string) => {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Erreur lors de la récupération des repas:', error);
      return [];
    }

    return data || [];
  };

  const updateUserState = async (session: any) => {
    if (session?.user) {
      const [data, meals] = await Promise.all([
        fetchUserProfile(session.user.id),
        fetchUserMeals(session.user.id)
      ]);

      setUser({
        id: session.user.id,
        email: session.user.email || '',
        first_name: data?.first_name || 'Utilisateur',
        last_name: data?.last_name || 'Utilisateur',
        glucides: data?.glucides || 0,
        calories: data?.calories || 0,
        proteines: data?.proteines || 0,
        lipides: data?.lipides || 0,
        avatar_url: data?.avatar_url || '',
        meals: meals
      });
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  const refreshUser = async () => {
    if (!user) return;
    const [data, meals] = await Promise.all([
      fetchUserProfile(user.id),
      fetchUserMeals(user.id)
    ]);
    setUser(prev => prev ? {
      ...prev,
      first_name: data?.first_name || prev.first_name,
      glucides: data?.glucides || 0,
      calories: data?.calories || 0,
      proteines: data?.proteines || 0,
      lipides: data?.lipides || 0,
      meals
    } : null);
  };

  useEffect(() => {
    // Vérifier la session actuelle
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateUserState(session);
    });

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      updateUserState(session);
    });

    // Écouter les changements dans la table meals
    const mealsSubscription = supabase
      .channel('meals_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meals',
          filter: user ? `user_id=eq.${user.id}` : undefined
        },
        () => {
          // Mettre à jour les repas quand il y a un changement
          if (user) {
            fetchUserMeals(user.id).then(meals => {
              setUser(prev => prev ? { ...prev, meals } : null);
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      mealsSubscription.unsubscribe();
    };
  }, [user?.id]);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 

export default AuthProvider;