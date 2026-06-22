import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qceafhvudijkqwspymyq.supabase.co';
const supabaseAnonKey = 'sb_publishable_sSWY3zbIB5rXFzAn0KqetQ_KQ6Wqha1';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
