/**
 * Database types in the shape produced by `supabase gen types typescript`.
 * Keep in sync with supabase/migrations. Once a project is linked, regenerate with:
 *   npx supabase gen types typescript --linked > types/database.ts
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Timestamps = { created_at: string; updated_at: string };
type OptionalTimestamps = { created_at?: string; updated_at?: string };

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string } & Timestamps;
        Insert: { id: string; full_name?: string } & OptionalTimestamps;
        Update: { full_name?: string } & OptionalTimestamps;
        Relationships: [];
      };
      businesses: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          business_type: string;
          description: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          currency: string;
          opening_hours: string | null;
          delivery_info: string | null;
          payment_info: string | null;
          preferred_language: Database["public"]["Enums"]["business_language"];
          low_stock_threshold: number;
          last_order_number: number;
        } & Timestamps;
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          business_type?: string;
          description?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          currency?: string;
          opening_hours?: string | null;
          delivery_info?: string | null;
          payment_info?: string | null;
          preferred_language?: Database["public"]["Enums"]["business_language"];
          low_stock_threshold?: number;
        } & OptionalTimestamps;
        Update: Partial<Omit<Database["public"]["Tables"]["businesses"]["Insert"], "id" | "owner_id">>;
        Relationships: [
          {
            foreignKeyName: "businesses_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          name_km: string | null;
          description: string | null;
          description_km: string | null;
          sku: string | null;
          category: string | null;
          price: number;
          stock_quantity: number;
          image_path: string | null;
          is_active: boolean;
        } & Timestamps;
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          name_km?: string | null;
          description?: string | null;
          description_km?: string | null;
          sku?: string | null;
          category?: string | null;
          price?: number;
          stock_quantity?: number;
          image_path?: string | null;
          is_active?: boolean;
        } & OptionalTimestamps;
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      customers: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          notes: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          notes?: string | null;
        } & OptionalTimestamps;
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          business_id: string;
          order_number: string;
          customer_id: string | null;
          status: Database["public"]["Enums"]["order_status"];
          subtotal: number;
          total: number;
          notes: string | null;
          stock_deducted: boolean;
        } & Timestamps;
        Insert: {
          id?: string;
          business_id: string;
          order_number?: string;
          customer_id?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal?: number;
          total?: number;
          notes?: string | null;
          stock_deducted?: boolean;
        } & OptionalTimestamps;
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "orders_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_customer_id_business_id_fkey";
            columns: ["customer_id", "business_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id", "business_id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          business_id: string;
          product_id: string | null;
          product_name: string;
          unit_price: number;
          quantity: number;
          line_total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          business_id: string;
          product_id?: string | null;
          product_name: string;
          unit_price: number;
          quantity: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_business_id_fkey";
            columns: ["order_id", "business_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id", "business_id"];
          },
          {
            foreignKeyName: "order_items_product_id_business_id_fkey";
            columns: ["product_id", "business_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id", "business_id"];
          },
        ];
      };
      knowledge_base: {
        Row: {
          id: string;
          business_id: string;
          title: string;
          content: string;
          category: Database["public"]["Enums"]["knowledge_category"];
        } & Timestamps;
        Insert: {
          id?: string;
          business_id: string;
          title: string;
          content: string;
          category?: Database["public"]["Enums"]["knowledge_category"];
        } & OptionalTimestamps;
        Update: Partial<Database["public"]["Tables"]["knowledge_base"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "knowledge_base_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      conversations: {
        Row: { id: string; business_id: string; created_by: string | null; title: string } & Timestamps;
        Insert: { id?: string; business_id: string; created_by?: string | null; title?: string } & OptionalTimestamps;
        Update: Partial<Database["public"]["Tables"]["conversations"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "conversations_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          business_id: string;
          role: Database["public"]["Enums"]["message_role"];
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          business_id: string;
          role: Database["public"]["Enums"]["message_role"];
          content: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_business_id_fkey";
            columns: ["conversation_id", "business_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id", "business_id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_business_owner: { Args: { target_business_id: string }; Returns: boolean };
      adjust_product_stock: { Args: { p_product_id: string; p_delta: number }; Returns: number };
    };
    Enums: {
      business_language: "km" | "en" | "km_en";
      order_status: "pending" | "confirmed" | "completed" | "cancelled";
      knowledge_category:
        | "faq"
        | "business_info"
        | "delivery_policy"
        | "return_policy"
        | "payment_info"
        | "product_info"
        | "other";
      message_role: "user" | "assistant";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];

export type Business = Tables<"businesses">;
export type Product = Tables<"products">;
