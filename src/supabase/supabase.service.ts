import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';
@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient<Database>;
  private adminClient: SupabaseClient<Database>;
  constructor() {
    const supabaseUrl = 'https://rejkqhpabcmhunldeywz.supabase.co';
    const supabaseKey = process.env.SUPABASE_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
    this.adminClient = createClient<Database>(supabaseUrl, supabaseServiceKey);
  }

  get client() {
    return this.supabase;
  }
  get admin() {
    return this.adminClient.auth.admin;
  }
}
