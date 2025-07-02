import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxckrcsuqqbjiyemajvf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4Y2tyY3N1cXFiaml5ZW1hanZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMjc3MDIsImV4cCI6MjA2NjcwMzcwMn0.lB_B_B5UurFCBigBog53Xk0fGT2bMvEAkbXSre6wF-8'; // paste the full anon key here

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});
