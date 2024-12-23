import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';
@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient<Database>;
  constructor() {
    const supabaseUrl = 'https://rejkqhpabcmhunldeywz.supabase.co';
    const supabaseKey = process.env.SUPABASE_KEY;
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  getSupabase() {
    return this.supabase;
  }
}
