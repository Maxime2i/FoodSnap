import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = 'https://hfdltmksxfbydatkfvfn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmZGx0bWtzeGZieWRhdGtmdmZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MDkzMDUsImV4cCI6MjA1OTA4NTMwNX0.02AZkjNHKeB95HR8AUd544Xt8v-rzDBXgfE8TJkNHC8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})