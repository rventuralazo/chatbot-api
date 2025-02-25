export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      chat: {
        Row: {
          assignedTo: string | null;
          created_at: string;
          id: number;
          lastMessageDate: string | null;
          name: string | null;
          notes: string | null;
          paused: boolean;
          pausedAnswered: boolean | null;
          pausedTime: string | null;
          phone: string;
          theadId: string | null;
          urlPicture: string | null;
        };
        Insert: {
          assignedTo?: string | null;
          created_at?: string;
          id?: number;
          lastMessageDate?: string | null;
          name?: string | null;
          notes?: string | null;
          paused?: boolean;
          pausedAnswered?: boolean | null;
          pausedTime?: string | null;
          phone: string;
          theadId?: string | null;
          urlPicture?: string | null;
        };
        Update: {
          assignedTo?: string | null;
          created_at?: string;
          id?: number;
          lastMessageDate?: string | null;
          name?: string | null;
          notes?: string | null;
          paused?: boolean;
          pausedAnswered?: boolean | null;
          pausedTime?: string | null;
          phone?: string;
          theadId?: string | null;
          urlPicture?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'chat_assignedTo_fkey';
            columns: ['assignedTo'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      chat_event_log: {
        Row: {
          action: string | null;
          chat: number | null;
          created_at: string;
          extra_information: Json | null;
          id: number;
          response_time: number | null;
          tags: string | null;
          user: string | null;
        };
        Insert: {
          action?: string | null;
          chat?: number | null;
          created_at?: string;
          extra_information?: Json | null;
          id?: number;
          response_time?: number | null;
          tags?: string | null;
          user?: string | null;
        };
        Update: {
          action?: string | null;
          chat?: number | null;
          created_at?: string;
          extra_information?: Json | null;
          id?: number;
          response_time?: number | null;
          tags?: string | null;
          user?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'chat_event_chat_fkey';
            columns: ['chat'];
            isOneToOne: false;
            referencedRelation: 'chat';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'chat_event_user_fkey';
            columns: ['user'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      chat_message: {
        Row: {
          chat: number | null;
          created_at: string;
          id: number;
          imageUrl: string | null;
          in_response_of: string | null;
          isBot: boolean;
          isRead: boolean | null;
          media_type: string | null;
          media_url: string | null;
          message: string | null;
          whatsapp_data: Json | null;
          whatsapp_ref: string | null;
        };
        Insert: {
          chat?: number | null;
          created_at?: string;
          id?: number;
          imageUrl?: string | null;
          in_response_of?: string | null;
          isBot: boolean;
          isRead?: boolean | null;
          media_type?: string | null;
          media_url?: string | null;
          message?: string | null;
          whatsapp_data?: Json | null;
          whatsapp_ref?: string | null;
        };
        Update: {
          chat?: number | null;
          created_at?: string;
          id?: number;
          imageUrl?: string | null;
          in_response_of?: string | null;
          isBot?: boolean;
          isRead?: boolean | null;
          media_type?: string | null;
          media_url?: string | null;
          message?: string | null;
          whatsapp_data?: Json | null;
          whatsapp_ref?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'chat_message_chat_fkey';
            columns: ['chat'];
            isOneToOne: false;
            referencedRelation: 'chat';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'chat_message_in_response_of_fkey';
            columns: ['in_response_of'];
            isOneToOne: false;
            referencedRelation: 'chat_message';
            referencedColumns: ['whatsapp_ref'];
          },
        ];
      };
      contact: {
        Row: {
          created_at: string | null;
          id: number;
          last_interaction: string | null;
          phone: string | null;
          updated_in: string | null;
          values: Json | null;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          last_interaction?: string | null;
          phone?: string | null;
          updated_in?: string | null;
          values?: Json | null;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          last_interaction?: string | null;
          phone?: string | null;
          updated_in?: string | null;
          values?: Json | null;
        };
        Relationships: [];
      };
      history: {
        Row: {
          answer: string;
          contact_id: number | null;
          created_at: string | null;
          id: number;
          keyword: string | null;
          options: Json | null;
          phone: string | null;
          ref: string;
          refserialize: string;
          updated_in: string | null;
        };
        Insert: {
          answer: string;
          contact_id?: number | null;
          created_at?: string | null;
          id?: number;
          keyword?: string | null;
          options?: Json | null;
          phone?: string | null;
          ref: string;
          refserialize: string;
          updated_in?: string | null;
        };
        Update: {
          answer?: string;
          contact_id?: number | null;
          created_at?: string | null;
          id?: number;
          keyword?: string | null;
          options?: Json | null;
          phone?: string | null;
          ref?: string;
          refserialize?: string;
          updated_in?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'history_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contact';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatarUrl: string | null;
          email: string | null;
          fullname: string | null;
          id: string;
        };
        Insert: {
          avatarUrl?: string | null;
          email?: string | null;
          fullname?: string | null;
          id: string;
        };
        Update: {
          avatarUrl?: string | null;
          email?: string | null;
          fullname?: string | null;
          id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      save_or_update_contact: {
        Args: {
          in_phone: string;
          in_values: Json;
        };
        Returns: undefined;
      };
      save_or_update_history_and_contact: {
        Args: {
          in_ref: string;
          in_keyword: string;
          in_answer: string;
          in_refserialize: string;
          in_phone: string;
          in_options: Json;
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
        PublicSchema['Views'])
    ? (PublicSchema['Tables'] &
        PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema['CompositeTypes']
    ? PublicSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;
