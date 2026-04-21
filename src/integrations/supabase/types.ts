export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      character_perks: {
        Row: {
          character_id: string
          created_at: string
          id: string
          perk_id: string
          tier: number
        }
        Insert: {
          character_id: string
          created_at?: string
          id?: string
          perk_id: string
          tier?: number
        }
        Update: {
          character_id?: string
          created_at?: string
          id?: string
          perk_id?: string
          tier?: number
        }
        Relationships: [
          {
            foreignKeyName: "character_perks_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          atk: number
          class: string
          created_at: string
          crit_chance: number
          def: number
          gold: number
          hp: number
          id: string
          level: number
          max_hp: number
          max_mp: number
          mp: number
          name: string
          perk_points: number
          prestige: number
          spd: number
          subclass: string | null
          user_id: string
          xp: number
        }
        Insert: {
          atk?: number
          class: string
          created_at?: string
          crit_chance?: number
          def?: number
          gold?: number
          hp: number
          id?: string
          level?: number
          max_hp: number
          max_mp: number
          mp: number
          name: string
          perk_points?: number
          prestige?: number
          spd?: number
          subclass?: string | null
          user_id: string
          xp?: number
        }
        Update: {
          atk?: number
          class?: string
          created_at?: string
          crit_chance?: number
          def?: number
          gold?: number
          hp?: number
          id?: string
          level?: number
          max_hp?: number
          max_mp?: number
          mp?: number
          name?: string
          perk_points?: number
          prestige?: number
          spd?: number
          subclass?: string | null
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      clan_members: {
        Row: {
          character_id: string
          clan_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          character_id: string
          clan_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          character_id?: string
          clan_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clan_members_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clan_members_clan_id_fkey"
            columns: ["clan_id"]
            isOneToOne: false
            referencedRelation: "clans"
            referencedColumns: ["id"]
          },
        ]
      }
      clans: {
        Row: {
          created_at: string
          description: string | null
          icon: string
          id: string
          leader_id: string
          level: number
          max_members: number
          name: string
          xp: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          leader_id: string
          level?: number
          max_members?: number
          name: string
          xp?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          leader_id?: string
          level?: number
          max_members?: number
          name?: string
          xp?: number
        }
        Relationships: []
      }
      combat_log: {
        Row: {
          character_id: string
          combat_data: Json | null
          created_at: string
          enemy_level: number
          enemy_name: string
          gold_gained: number
          id: string
          location_id: string | null
          loot_item_id: string | null
          result: string
          xp_gained: number
        }
        Insert: {
          character_id: string
          combat_data?: Json | null
          created_at?: string
          enemy_level?: number
          enemy_name: string
          gold_gained?: number
          id?: string
          location_id?: string | null
          loot_item_id?: string | null
          result: string
          xp_gained?: number
        }
        Update: {
          character_id?: string
          combat_data?: Json | null
          created_at?: string
          enemy_level?: number
          enemy_name?: string
          gold_gained?: number
          id?: string
          location_id?: string | null
          loot_item_id?: string | null
          result?: string
          xp_gained?: number
        }
        Relationships: [
          {
            foreignKeyName: "combat_log_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combat_log_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      dungeon_progress: {
        Row: {
          character_id: string
          completed: boolean
          created_at: string
          current_floor: number
          id: string
          location_id: string
          max_floor: number
        }
        Insert: {
          character_id: string
          completed?: boolean
          created_at?: string
          current_floor?: number
          id?: string
          location_id: string
          max_floor?: number
        }
        Update: {
          character_id?: string
          completed?: boolean
          created_at?: string
          current_floor?: number
          id?: string
          location_id?: string
          max_floor?: number
        }
        Relationships: [
          {
            foreignKeyName: "dungeon_progress_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dungeon_progress_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          atk: number
          character_id: string
          created_at: string
          crit_chance: number
          def: number
          description: string | null
          equipped: boolean
          hp_bonus: number
          icon: string
          id: string
          mp_bonus: number
          name: string
          rarity: string
          sell_price: number
          set_name: string | null
          socket_gems: string[] | null
          spd: number
          type: string
        }
        Insert: {
          atk?: number
          character_id: string
          created_at?: string
          crit_chance?: number
          def?: number
          description?: string | null
          equipped?: boolean
          hp_bonus?: number
          icon?: string
          id?: string
          mp_bonus?: number
          name: string
          rarity?: string
          sell_price?: number
          set_name?: string | null
          socket_gems?: string[] | null
          spd?: number
          type: string
        }
        Update: {
          atk?: number
          character_id?: string
          created_at?: string
          crit_chance?: number
          def?: number
          description?: string | null
          equipped?: boolean
          hp_bonus?: number
          icon?: string
          id?: string
          mp_bonus?: number
          name?: string
          rarity?: string
          sell_price?: number
          set_name?: string | null
          socket_gems?: string[] | null
          spd?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          status: string
          target_id: string
          to_user_id: string
          type: string
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          status?: string
          target_id: string
          to_user_id: string
          type: string
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          status?: string
          target_id?: string
          to_user_id?: string
          type?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          connected_to: string[] | null
          description: string | null
          grid_x: number
          grid_y: number
          icon: string
          id: string
          level_req: number
          name: string
          type: string
          world: number
        }
        Insert: {
          connected_to?: string[] | null
          description?: string | null
          grid_x?: number
          grid_y?: number
          icon?: string
          id?: string
          level_req?: number
          name: string
          type?: string
          world?: number
        }
        Update: {
          connected_to?: string[] | null
          description?: string | null
          grid_x?: number
          grid_y?: number
          icon?: string
          id?: string
          level_req?: number
          name?: string
          type?: string
          world?: number
        }
        Relationships: []
      }
      shop_items: {
        Row: {
          atk: number
          class_req: string | null
          crit_chance: number
          def: number
          description: string | null
          hp_bonus: number
          icon: string
          id: string
          level_req: number
          mp_bonus: number
          name: string
          price: number
          rarity: string
          set_name: string | null
          shop_name: string
          spd: number
          subclass_req: string | null
          type: string
          world: number
        }
        Insert: {
          atk?: number
          class_req?: string | null
          crit_chance?: number
          def?: number
          description?: string | null
          hp_bonus?: number
          icon?: string
          id?: string
          level_req?: number
          mp_bonus?: number
          name: string
          price?: number
          rarity?: string
          set_name?: string | null
          shop_name?: string
          spd?: number
          subclass_req?: string | null
          type: string
          world?: number
        }
        Update: {
          atk?: number
          class_req?: string | null
          crit_chance?: number
          def?: number
          description?: string | null
          hp_bonus?: number
          icon?: string
          id?: string
          level_req?: number
          mp_bonus?: number
          name?: string
          price?: number
          rarity?: string
          set_name?: string | null
          shop_name?: string
          spd?: number
          subclass_req?: string | null
          type?: string
          world?: number
        }
        Relationships: []
      }
      team_combat: {
        Row: {
          created_at: string
          current_actor_id: string | null
          enemies: Json
          finished: boolean
          id: string
          location_id: string | null
          log: Json
          max_waves: number
          members_state: Json
          result: string | null
          rewards: Json | null
          team_id: string
          turn: number
          updated_at: string
          wave: number
        }
        Insert: {
          created_at?: string
          current_actor_id?: string | null
          enemies?: Json
          finished?: boolean
          id?: string
          location_id?: string | null
          log?: Json
          max_waves?: number
          members_state?: Json
          result?: string | null
          rewards?: Json | null
          team_id: string
          turn?: number
          updated_at?: string
          wave?: number
        }
        Update: {
          created_at?: string
          current_actor_id?: string | null
          enemies?: Json
          finished?: boolean
          id?: string
          location_id?: string | null
          log?: Json
          max_waves?: number
          members_state?: Json
          result?: string | null
          rewards?: Json | null
          team_id?: string
          turn?: number
          updated_at?: string
          wave?: number
        }
        Relationships: []
      }
      team_members: {
        Row: {
          character_id: string
          id: string
          joined_at: string
          ready: boolean
          team_id: string
          user_id: string
        }
        Insert: {
          character_id: string
          id?: string
          joined_at?: string
          ready?: boolean
          team_id: string
          user_id: string
        }
        Update: {
          character_id?: string
          id?: string
          joined_at?: string
          ready?: boolean
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          leader_id: string
          max_size: number
          name: string
          status: string
          target_location_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          leader_id: string
          max_size?: number
          name: string
          status?: string
          target_location_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          leader_id?: string
          max_size?: number
          name?: string
          status?: string
          target_location_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_target_location_id_fkey"
            columns: ["target_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
