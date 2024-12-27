export interface User {
  id: string;
  aud: string;
  role: string;
  email: string;
  email_confirmed_at: string;
  phone: string;
  confirmed_at: string;
  last_sign_in_at: string;
  app_metadata: AppMetadata;
  // user_metadata: UserMetadata;
  identities: any;
  created_at: string;
  updated_at: string;
  is_anonymous: boolean;
}

export interface AppMetadata {
  provider: string;
  providers: string[];
}

// export interface UserMetadata {}
