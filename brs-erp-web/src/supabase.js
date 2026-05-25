import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qceafhvudijkqwspymyq.supabase.co';
const supabaseKey = 'sb_publishable_sSWY3zbIB5rXFzAn0KqetQ_KQ6Wqha1';

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);