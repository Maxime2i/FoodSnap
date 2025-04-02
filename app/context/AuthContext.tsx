import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type Meal = {
  id: string;
  name: string;
  calories: number;
  proteines: number;
  glucides: number;
  lipides: number;
  created_at: string;
  photo_url?: string;
};

type AuthContextType = {
  user: { 
    id: string; 
    email: string; 
    first_name: string;
    meals: Meal[];
  } | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      return null;
    }

    return data?.first_name;
  };

  const fetchUserMeals = async (userId: string) => {
    const { data, error } = await supabase
      .from('plats')
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
      const [first_name, meals] = await Promise.all([
        fetchUserProfile(session.user.id),
        fetchUserMeals(session.user.id)
      ]);

      setUser({
        id: session.user.id,
        email: session.user.email || '',
        first_name: first_name || 'Utilisateur',
        meals: meals
      });
    } else {
      setUser(null);
    }
    setLoading(false);
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
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 