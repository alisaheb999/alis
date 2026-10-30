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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      affiliate_withdrawals: {
        Row: {
          account_number: string
          admin_note: string | null
          affiliate_id: string
          amount_bdt: number
          created_at: string
          id: string
          payment_method: string
          status: string
          trx_id: string | null
          updated_at: string
        }
        Insert: {
          account_number: string
          admin_note?: string | null
          affiliate_id: string
          amount_bdt: number
          created_at?: string
          id?: string
          payment_method: string
          status?: string
          trx_id?: string | null
          updated_at?: string
        }
        Update: {
          account_number?: string
          admin_note?: string | null
          affiliate_id?: string
          amount_bdt?: number
          created_at?: string
          id?: string
          payment_method?: string
          status?: string
          trx_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_withdrawals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          balance_bdt: number
          commission_percent: number
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          status: string
          total_earned_bdt: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_bdt?: number
          commission_percent?: number
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          status?: string
          total_earned_bdt?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_bdt?: number
          commission_percent?: number
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          status?: string
          total_earned_bdt?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_identity_sections: {
        Row: {
          body: string
          created_at: string
          enabled: boolean
          id: string
          layer: number
          notes: string | null
          ordinal: number
          revision: number
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          enabled?: boolean
          id?: string
          layer?: number
          notes?: string | null
          ordinal?: number
          revision?: number
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          enabled?: boolean
          id?: string
          layer?: number
          notes?: string | null
          ordinal?: number
          revision?: number
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          access_level: Database["public"]["Enums"]["asset_access"]
          bucket: string
          checksum: string | null
          created_at: string
          file_path: string
          id: string
          meta_data: Json
          published: boolean
          size_bytes: number | null
          slug: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["asset_access"]
          bucket?: string
          checksum?: string | null
          created_at?: string
          file_path: string
          id?: string
          meta_data?: Json
          published?: boolean
          size_bytes?: number | null
          slug?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          access_level?: Database["public"]["Enums"]["asset_access"]
          bucket?: string
          checksum?: string | null
          created_at?: string
          file_path?: string
          id?: string
          meta_data?: Json
          published?: boolean
          size_bytes?: number | null
          slug?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      canboso_products: {
        Row: {
          cost: number
          currency: string
          description: string
          id: string
          name: string
          product_type: string
          requirements: Json
          selling_price_bdt: number | null
          stock: number | null
          synced_at: string
          visible: boolean
        }
        Insert: {
          cost?: number
          currency?: string
          description?: string
          id: string
          name: string
          product_type?: string
          requirements?: Json
          selling_price_bdt?: number | null
          stock?: number | null
          synced_at?: string
          visible?: boolean
        }
        Update: {
          cost?: number
          currency?: string
          description?: string
          id?: string
          name?: string
          product_type?: string
          requirements?: Json
          selling_price_bdt?: number | null
          stock?: number | null
          synced_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      caption_jobs: {
        Row: {
          attempts: number
          client_key: string | null
          completed_at: string | null
          created_at: string
          device_id: string | null
          duration_hint: number | null
          error_code: string | null
          error_message: string | null
          expires_at: string
          id: string
          idempotency_key: string | null
          language: string | null
          lease_expires_at: string | null
          max_attempts: number
          media_mime: string
          media_name: string
          media_object_key: string
          media_size: number
          progress: number
          result_srt: string | null
          stage: string
          status: string
          updated_at: string
          worker_id: string | null
        }
        Insert: {
          attempts?: number
          client_key?: string | null
          completed_at?: string | null
          created_at?: string
          device_id?: string | null
          duration_hint?: number | null
          error_code?: string | null
          error_message?: string | null
          expires_at?: string
          id?: string
          idempotency_key?: string | null
          language?: string | null
          lease_expires_at?: string | null
          max_attempts?: number
          media_mime?: string
          media_name?: string
          media_object_key: string
          media_size?: number
          progress?: number
          result_srt?: string | null
          stage?: string
          status?: string
          updated_at?: string
          worker_id?: string | null
        }
        Update: {
          attempts?: number
          client_key?: string | null
          completed_at?: string | null
          created_at?: string
          device_id?: string | null
          duration_hint?: number | null
          error_code?: string | null
          error_message?: string | null
          expires_at?: string
          id?: string
          idempotency_key?: string | null
          language?: string | null
          lease_expires_at?: string | null
          max_attempts?: number
          media_mime?: string
          media_name?: string
          media_object_key?: string
          media_size?: number
          progress?: number
          result_srt?: string | null
          stage?: string
          status?: string
          updated_at?: string
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "caption_jobs_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "caption_workers"
            referencedColumns: ["id"]
          },
        ]
      }
      caption_workers: {
        Row: {
          capabilities: Json
          created_at: string
          id: string
          last_seen_at: string
          max_jobs: number
          name: string
          status: string
        }
        Insert: {
          capabilities?: Json
          created_at?: string
          id?: string
          last_seen_at?: string
          max_jobs?: number
          name?: string
          status?: string
        }
        Update: {
          capabilities?: Json
          created_at?: string
          id?: string
          last_seen_at?: string
          max_jobs?: number
          name?: string
          status?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean
          affiliate_id: string | null
          code: string
          created_at: string
          description: string | null
          expires_at: string | null
          flat_off: number
          id: string
          is_public: boolean
          max_redemptions: number
          percent_off: number
          plans: string[]
          redeemed_count: number
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          affiliate_id?: string | null
          code: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          flat_off?: number
          id?: string
          is_public?: boolean
          max_redemptions?: number
          percent_off?: number
          plans?: string[]
          redeemed_count?: number
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          affiliate_id?: string | null
          code?: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          flat_off?: number
          id?: string
          is_public?: boolean
          max_redemptions?: number
          percent_off?: number
          plans?: string[]
          redeemed_count?: number
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupons_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_snapshots: {
        Row: {
          created_at: string
          file_path: string
          id: string
          note: string | null
          project: string
          size_bytes: number
        }
        Insert: {
          created_at?: string
          file_path: string
          id?: string
          note?: string | null
          project: string
          size_bytes?: number
        }
        Update: {
          created_at?: string
          file_path?: string
          id?: string
          note?: string | null
          project?: string
          size_bytes?: number
        }
        Relationships: []
      }
      digital_delivery_secrets: {
        Row: {
          created_at: string
          order_id: string
          payload: string
        }
        Insert: {
          created_at?: string
          order_id: string
          payload: string
        }
        Update: {
          created_at?: string
          order_id?: string
          payload?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_delivery_secrets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "digital_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_key_inventory: {
        Row: {
          assigned_at: string | null
          created_at: string
          id: string
          license_key: string
          order_id: string | null
          product_slug: string
        }
        Insert: {
          assigned_at?: string | null
          created_at?: string
          id?: string
          license_key: string
          order_id?: string | null
          product_slug: string
        }
        Update: {
          assigned_at?: string | null
          created_at?: string
          id?: string
          license_key?: string
          order_id?: string | null
          product_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_key_inventory_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "digital_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_orders: {
        Row: {
          amount_bdt: number
          buyer_email: string
          buyer_name: string
          buyer_whatsapp: string
          canboso_product_id: string | null
          created_at: string
          delivery_access_hash: string | null
          delivery_error: string | null
          delivery_payload: string | null
          delivery_status: string
          id: string
          ip_hash: string | null
          payment_method: string
          payment_verification_source: string | null
          payment_verified_at: string | null
          product_name: string
          product_slug: string
          public_code: string
          quantity: number
          sender_number: string
          status: string
          supplier_cost: number | null
          supplier_currency: string | null
          supplier_order_code: string | null
          supplier_product_id: number | null
          trx_id: string
          updated_at: string
        }
        Insert: {
          amount_bdt: number
          buyer_email: string
          buyer_name: string
          buyer_whatsapp: string
          canboso_product_id?: string | null
          created_at?: string
          delivery_access_hash?: string | null
          delivery_error?: string | null
          delivery_payload?: string | null
          delivery_status?: string
          id?: string
          ip_hash?: string | null
          payment_method: string
          payment_verification_source?: string | null
          payment_verified_at?: string | null
          product_name: string
          product_slug: string
          public_code: string
          quantity?: number
          sender_number: string
          status?: string
          supplier_cost?: number | null
          supplier_currency?: string | null
          supplier_order_code?: string | null
          supplier_product_id?: number | null
          trx_id: string
          updated_at?: string
        }
        Update: {
          amount_bdt?: number
          buyer_email?: string
          buyer_name?: string
          buyer_whatsapp?: string
          canboso_product_id?: string | null
          created_at?: string
          delivery_access_hash?: string | null
          delivery_error?: string | null
          delivery_payload?: string | null
          delivery_status?: string
          id?: string
          ip_hash?: string | null
          payment_method?: string
          payment_verification_source?: string | null
          payment_verified_at?: string | null
          product_name?: string
          product_slug?: string
          public_code?: string
          quantity?: number
          sender_number?: string
          status?: string
          supplier_cost?: number | null
          supplier_currency?: string | null
          supplier_order_code?: string | null
          supplier_product_id?: number | null
          trx_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      digital_reviews: {
        Row: {
          approved: boolean
          body: string
          created_at: string
          display_name: string
          id: string
          order_id: string
          product_slug: string
          rating: number
          reply: string | null
          screenshot: string | null
        }
        Insert: {
          approved?: boolean
          body: string
          created_at?: string
          display_name: string
          id?: string
          order_id: string
          product_slug: string
          rating: number
          reply?: string | null
          screenshot?: string | null
        }
        Update: {
          approved?: boolean
          body?: string
          created_at?: string
          display_name?: string
          id?: string
          order_id?: string
          product_slug?: string
          rating?: number
          reply?: string | null
          screenshot?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "digital_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "digital_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      download_events: {
        Row: {
          country: string | null
          created_at: string
          id: string
          item: string | null
          license_fingerprint: string | null
          package: string
          panel_version: string | null
          tier: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          item?: string | null
          license_fingerprint?: string | null
          package: string
          panel_version?: string | null
          tier?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          item?: string | null
          license_fingerprint?: string | null
          package?: string
          panel_version?: string | null
          tier?: string
        }
        Relationships: []
      }
      extension_errors: {
        Row: {
          created_at: string
          host_chrome: number | null
          id: string
          license_key: string | null
          message: string | null
          metadata: Json | null
          panel: string | null
          profile: string | null
          stack: string | null
          variant: string | null
        }
        Insert: {
          created_at?: string
          host_chrome?: number | null
          id?: string
          license_key?: string | null
          message?: string | null
          metadata?: Json | null
          panel?: string | null
          profile?: string | null
          stack?: string | null
          variant?: string | null
        }
        Update: {
          created_at?: string
          host_chrome?: number | null
          id?: string
          license_key?: string | null
          message?: string | null
          metadata?: Json | null
          panel?: string | null
          profile?: string | null
          stack?: string | null
          variant?: string | null
        }
        Relationships: []
      }
      extension_logs: {
        Row: {
          app_version: string | null
          created_at: string
          details: Json
          device_fingerprint: string | null
          event: string
          id: string
          ip_address: string | null
          license_id: string | null
          license_key: string | null
          status: string
          user_agent: string | null
        }
        Insert: {
          app_version?: string | null
          created_at?: string
          details?: Json
          device_fingerprint?: string | null
          event: string
          id?: string
          ip_address?: string | null
          license_id?: string | null
          license_key?: string | null
          status?: string
          user_agent?: string | null
        }
        Update: {
          app_version?: string | null
          created_at?: string
          details?: Json
          device_fingerprint?: string | null
          event?: string
          id?: string
          ip_address?: string | null
          license_id?: string | null
          license_key?: string | null
          status?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extension_logs_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      extension_releases: {
        Row: {
          cep_folder: string
          changelog: string | null
          created_at: string
          host_app: string
          id: string
          is_free: boolean
          name: string
          product_key: string
          published: boolean
          sha256: string | null
          size_bytes: number | null
          storage_path: string
          thumbnail_url: string | null
          updated_at: string
          version: string
        }
        Insert: {
          cep_folder: string
          changelog?: string | null
          created_at?: string
          host_app?: string
          id?: string
          is_free?: boolean
          name: string
          product_key: string
          published?: boolean
          sha256?: string | null
          size_bytes?: number | null
          storage_path: string
          thumbnail_url?: string | null
          updated_at?: string
          version: string
        }
        Update: {
          cep_folder?: string
          changelog?: string | null
          created_at?: string
          host_app?: string
          id?: string
          is_free?: boolean
          name?: string
          product_key?: string
          published?: boolean
          sha256?: string | null
          size_bytes?: number | null
          storage_path?: string
          thumbnail_url?: string | null
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      extension_settings: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          is_public: boolean
          key: string
          min_version: string | null
          module: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          is_public?: boolean
          key: string
          min_version?: string | null
          module?: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          is_public?: boolean
          key?: string
          min_version?: string | null
          module?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      free_resources: {
        Row: {
          created_at: string
          description: string
          download_url: string
          id: string
          image_url: string | null
          is_published: boolean
          slug: string | null
          sort_order: number
          title: string
          tutorial_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          download_url: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          slug?: string | null
          sort_order?: number
          title: string
          tutorial_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          download_url?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          slug?: string | null
          sort_order?: number
          title?: string
          tutorial_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      gear_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      gear_orders: {
        Row: {
          address: string
          cost_bdt: number
          courier: string | null
          created_at: string
          customer_name: string
          customer_phone: string
          delivery_charge_bdt: number
          delivery_zone: string
          discount_bdt: number
          district: string
          id: string
          items: Json
          note: string | null
          payment_method: string
          payment_status: string
          public_code: string
          status: string
          subtotal_bdt: number
          thana: string
          total_bdt: number
          tracking_code: string | null
          trx_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string
          cost_bdt?: number
          courier?: string | null
          created_at?: string
          customer_name: string
          customer_phone: string
          delivery_charge_bdt?: number
          delivery_zone?: string
          discount_bdt?: number
          district?: string
          id?: string
          items?: Json
          note?: string | null
          payment_method?: string
          payment_status?: string
          public_code?: string
          status?: string
          subtotal_bdt?: number
          thana?: string
          total_bdt?: number
          tracking_code?: string | null
          trx_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          cost_bdt?: number
          courier?: string | null
          created_at?: string
          customer_name?: string
          customer_phone?: string
          delivery_charge_bdt?: number
          delivery_zone?: string
          discount_bdt?: number
          district?: string
          id?: string
          items?: Json
          note?: string | null
          payment_method?: string
          payment_status?: string
          public_code?: string
          status?: string
          subtotal_bdt?: number
          thana?: string
          total_bdt?: number
          tracking_code?: string | null
          trx_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      gear_products: {
        Row: {
          box_contents: Json
          brand: string
          category_id: string | null
          compare_price_bdt: number | null
          compatibility: string
          created_at: string
          delivery_info: string
          description: string
          extra_cost_bdt: number | null
          features: Json
          id: string
          image_paths: string[]
          last_verified_at: string | null
          name: string
          procurement_cost_bdt: number | null
          related_slugs: string[]
          return_info: string
          sale_price_bdt: number | null
          short_description: string
          slug: string
          sort_order: number
          source_price_bdt: number | null
          source_url: string | null
          specs: Json
          status: string
          stock_qty: number
          stock_status: string
          updated_at: string
          variants: Json
          warranty_info: string
        }
        Insert: {
          box_contents?: Json
          brand?: string
          category_id?: string | null
          compare_price_bdt?: number | null
          compatibility?: string
          created_at?: string
          delivery_info?: string
          description?: string
          extra_cost_bdt?: number | null
          features?: Json
          id?: string
          image_paths?: string[]
          last_verified_at?: string | null
          name: string
          procurement_cost_bdt?: number | null
          related_slugs?: string[]
          return_info?: string
          sale_price_bdt?: number | null
          short_description?: string
          slug: string
          sort_order?: number
          source_price_bdt?: number | null
          source_url?: string | null
          specs?: Json
          status?: string
          stock_qty?: number
          stock_status?: string
          updated_at?: string
          variants?: Json
          warranty_info?: string
        }
        Update: {
          box_contents?: Json
          brand?: string
          category_id?: string | null
          compare_price_bdt?: number | null
          compatibility?: string
          created_at?: string
          delivery_info?: string
          description?: string
          extra_cost_bdt?: number | null
          features?: Json
          id?: string
          image_paths?: string[]
          last_verified_at?: string | null
          name?: string
          procurement_cost_bdt?: number | null
          related_slugs?: string[]
          return_info?: string
          sale_price_bdt?: number | null
          short_description?: string
          slug?: string
          sort_order?: number
          source_price_bdt?: number | null
          source_url?: string | null
          specs?: Json
          status?: string
          stock_qty?: number
          stock_status?: string
          updated_at?: string
          variants?: Json
          warranty_info?: string
        }
        Relationships: [
          {
            foreignKeyName: "gear_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "gear_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      giveaway_campaigns: {
        Row: {
          active: boolean
          claim_url: string | null
          created_at: string
          id: string
          prizes: Json
          rules: string
          spins_per_user: number
          title: string
          updated_at: string
          win_message: string
        }
        Insert: {
          active?: boolean
          claim_url?: string | null
          created_at?: string
          id?: string
          prizes?: Json
          rules?: string
          spins_per_user?: number
          title?: string
          updated_at?: string
          win_message?: string
        }
        Update: {
          active?: boolean
          claim_url?: string | null
          created_at?: string
          id?: string
          prizes?: Json
          rules?: string
          spins_per_user?: number
          title?: string
          updated_at?: string
          win_message?: string
        }
        Relationships: []
      }
      giveaway_entries: {
        Row: {
          campaign_id: string
          claim_code: string | null
          created_at: string
          id: string
          is_win: boolean
          prize_label: string
          visitor_id: string
        }
        Insert: {
          campaign_id: string
          claim_code?: string | null
          created_at?: string
          id?: string
          is_win: boolean
          prize_label: string
          visitor_id: string
        }
        Update: {
          campaign_id?: string
          claim_code?: string | null
          created_at?: string
          id?: string
          is_win?: boolean
          prize_label?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "giveaway_entries_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "giveaway_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      giveaway_spins: {
        Row: {
          campaign_id: string
          claim_code: string | null
          created_at: string
          email: string | null
          id: string
          is_win: boolean
          prize_label: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          claim_code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_win?: boolean
          prize_label: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          claim_code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_win?: boolean
          prize_label?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "giveaway_spins_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "giveaway_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      license_activations: {
        Row: {
          app_version: string | null
          created_at: string
          device_fingerprint: string
          hostname: string | null
          id: string
          last_seen_at: string
          license_id: string
          offline_token_issued_at: string | null
          platform: string | null
          revoked: boolean
        }
        Insert: {
          app_version?: string | null
          created_at?: string
          device_fingerprint: string
          hostname?: string | null
          id?: string
          last_seen_at?: string
          license_id: string
          offline_token_issued_at?: string | null
          platform?: string | null
          revoked?: boolean
        }
        Update: {
          app_version?: string | null
          created_at?: string
          device_fingerprint?: string
          hostname?: string | null
          id?: string
          last_seen_at?: string
          license_id?: string
          offline_token_issued_at?: string | null
          platform?: string | null
          revoked?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "license_activations_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      license_device_changes: {
        Row: {
          created_at: string
          device_fingerprint: string | null
          id: string
          license_id: string
          source: string
        }
        Insert: {
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          license_id: string
          source?: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          license_id?: string
          source?: string
        }
        Relationships: []
      }
      license_logs: {
        Row: {
          action: string
          created_at: string
          details: Json
          error_code: string | null
          id: string
          ip_address: string | null
          license_id: string | null
          license_key: string | null
          machine_id: string | null
          result: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json
          error_code?: string | null
          id?: string
          ip_address?: string | null
          license_id?: string | null
          license_key?: string | null
          machine_id?: string | null
          result: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json
          error_code?: string | null
          id?: string
          ip_address?: string | null
          license_id?: string | null
          license_key?: string | null
          machine_id?: string | null
          result?: string
        }
        Relationships: []
      }
      licenses: {
        Row: {
          activated_at: string | null
          activation_count: number
          created_at: string
          device_change_reset_at: string | null
          device_fingerprint: string | null
          domain: string | null
          email: string | null
          expires_at: string | null
          id: string
          last_seen_at: string | null
          license_key: string
          max_activations: number
          notes: string | null
          plan: string
          product_key: string | null
          products: string[]
          status: Database["public"]["Enums"]["license_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          activated_at?: string | null
          activation_count?: number
          created_at?: string
          device_change_reset_at?: string | null
          device_fingerprint?: string | null
          domain?: string | null
          email?: string | null
          expires_at?: string | null
          id?: string
          last_seen_at?: string | null
          license_key: string
          max_activations?: number
          notes?: string | null
          plan?: string
          product_key?: string | null
          products?: string[]
          status?: Database["public"]["Enums"]["license_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          activated_at?: string | null
          activation_count?: number
          created_at?: string
          device_change_reset_at?: string | null
          device_fingerprint?: string | null
          domain?: string | null
          email?: string | null
          expires_at?: string | null
          id?: string
          last_seen_at?: string | null
          license_key?: string
          max_activations?: number
          notes?: string | null
          plan?: string
          product_key?: string | null
          products?: string[]
          status?: Database["public"]["Enums"]["license_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number
          created_at: string
          currency: string
          customer_name: string | null
          cycle: string
          device_limit: number
          email: string | null
          id: string
          invoice_id: string | null
          license_key: string | null
          metadata: Json
          paid_at: string | null
          payment_method: string | null
          plan: string
          provider: string
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          customer_name?: string | null
          cycle?: string
          device_limit?: number
          email?: string | null
          id?: string
          invoice_id?: string | null
          license_key?: string | null
          metadata?: Json
          paid_at?: string | null
          payment_method?: string | null
          plan: string
          provider?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          customer_name?: string | null
          cycle?: string
          device_limit?: number
          email?: string | null
          id?: string
          invoice_id?: string | null
          license_key?: string | null
          metadata?: Json
          paid_at?: string | null
          payment_method?: string | null
          plan?: string
          provider?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          day: string
          id: string
          path: string
          updated_at: string
          views: number
        }
        Insert: {
          created_at?: string
          day?: string
          id?: string
          path: string
          updated_at?: string
          views?: number
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          path?: string
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
      panel_reports: {
        Row: {
          admin_note: string | null
          app_version: string | null
          contact: string | null
          created_at: string
          device_fingerprint: string | null
          id: string
          license_key: string | null
          message: string
          panel: string
          severity: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          app_version?: string | null
          contact?: string | null
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          license_key?: string | null
          message: string
          panel?: string
          severity?: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          app_version?: string | null
          contact?: string | null
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          license_key?: string | null
          message?: string
          panel?: string
          severity?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          customer_name: string | null
          email: string | null
          id: string
          license_key: string | null
          method: string
          notes: string | null
          paid_at: string | null
          plan: string
          provider_ref: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          customer_name?: string | null
          email?: string | null
          id?: string
          license_key?: string | null
          method?: string
          notes?: string | null
          paid_at?: string | null
          plan?: string
          provider_ref?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          customer_name?: string | null
          email?: string | null
          id?: string
          license_key?: string | null
          method?: string
          notes?: string | null
          paid_at?: string | null
          plan?: string
          provider_ref?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      preset_downloads: {
        Row: {
          created_at: string
          device_fingerprint: string | null
          id: string
          license_key: string
          panel: string
          preset_slug: string
        }
        Insert: {
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          license_key: string
          panel?: string
          preset_slug: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          license_key?: string
          panel?: string
          preset_slug?: string
        }
        Relationships: []
      }
      preset_fix_queue: {
        Row: {
          admin_note: string | null
          agent_note: string | null
          created_at: string
          down_votes: number
          fixed_in_version: string | null
          id: string
          panel: string
          preset_kind: string
          preset_name: string
          status: string
          up_votes: number
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          agent_note?: string | null
          created_at?: string
          down_votes?: number
          fixed_in_version?: string | null
          id?: string
          panel?: string
          preset_kind: string
          preset_name: string
          status?: string
          up_votes?: number
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          agent_note?: string | null
          created_at?: string
          down_votes?: number
          fixed_in_version?: string | null
          id?: string
          panel?: string
          preset_kind?: string
          preset_name?: string
          status?: string
          up_votes?: number
          updated_at?: string
        }
        Relationships: []
      }
      preset_votes: {
        Row: {
          app_version: string | null
          created_at: string
          device_fingerprint: string
          id: string
          license_key: string | null
          panel: string
          preset_kind: string
          preset_name: string
          updated_at: string
          vote: string
        }
        Insert: {
          app_version?: string | null
          created_at?: string
          device_fingerprint: string
          id?: string
          license_key?: string | null
          panel?: string
          preset_kind?: string
          preset_name: string
          updated_at?: string
          vote: string
        }
        Update: {
          app_version?: string | null
          created_at?: string
          device_fingerprint?: string
          id?: string
          license_key?: string | null
          panel?: string
          preset_kind?: string
          preset_name?: string
          updated_at?: string
          vote?: string
        }
        Relationships: []
      }
      pricing_plans: {
        Row: {
          badge: string | null
          created_at: string
          currency: string
          description_bn: string
          description_en: string
          device_limit: number
          id: string
          name_bn: string
          name_en: string
          plan_key: string
          price_monthly: number
          price_yearly: number
          sort_order: number
          tokens_monthly: number
          updated_at: string
          visible: boolean
        }
        Insert: {
          badge?: string | null
          created_at?: string
          currency?: string
          description_bn?: string
          description_en?: string
          device_limit?: number
          id?: string
          name_bn?: string
          name_en: string
          plan_key: string
          price_monthly?: number
          price_yearly?: number
          sort_order?: number
          tokens_monthly?: number
          updated_at?: string
          visible?: boolean
        }
        Update: {
          badge?: string | null
          created_at?: string
          currency?: string
          description_bn?: string
          description_en?: string
          device_limit?: number
          id?: string
          name_bn?: string
          name_en?: string
          plan_key?: string
          price_monthly?: number
          price_yearly?: number
          sort_order?: number
          tokens_monthly?: number
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      prompt_runs: {
        Row: {
          app_version: string | null
          category: string
          created_at: string
          detected_category: string | null
          device_fingerprint: string | null
          expanded_length: number
          id: string
          latency_ms: number | null
          license_key: string | null
          meta_data: Json
          model: string | null
          ok: boolean
          provider: string | null
          rating: number | null
          raw_length: number
        }
        Insert: {
          app_version?: string | null
          category?: string
          created_at?: string
          detected_category?: string | null
          device_fingerprint?: string | null
          expanded_length?: number
          id?: string
          latency_ms?: number | null
          license_key?: string | null
          meta_data?: Json
          model?: string | null
          ok?: boolean
          provider?: string | null
          rating?: number | null
          raw_length?: number
        }
        Update: {
          app_version?: string | null
          category?: string
          created_at?: string
          detected_category?: string | null
          device_fingerprint?: string | null
          expanded_length?: number
          id?: string
          latency_ms?: number | null
          license_key?: string | null
          meta_data?: Json
          model?: string | null
          ok?: boolean
          provider?: string | null
          rating?: number | null
          raw_length?: number
        }
        Relationships: []
      }
      prompt_templates: {
        Row: {
          body: string
          category: string
          created_at: string
          enabled: boolean
          id: string
          kind: string
          quality_score: number
          title: string
          updated_at: string
          version: number
          weight: number
        }
        Insert: {
          body: string
          category: string
          created_at?: string
          enabled?: boolean
          id?: string
          kind?: string
          quality_score?: number
          title?: string
          updated_at?: string
          version?: number
          weight?: number
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          enabled?: boolean
          id?: string
          kind?: string
          quality_score?: number
          title?: string
          updated_at?: string
          version?: number
          weight?: number
        }
        Relationships: []
      }
      public_offers: {
        Row: {
          active: boolean
          created_at: string
          discount: number
          id: string
          plan: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          discount?: number
          id?: string
          plan: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          discount?: number
          id?: string
          plan?: string
          updated_at?: string
        }
        Relationships: []
      }
      referral_commissions: {
        Row: {
          affiliate_id: string
          commission_bdt: number
          coupon_code: string
          created_at: string
          id: string
          order_amount_bdt: number
          order_id: string
          plan: string | null
          status: string
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          commission_bdt: number
          coupon_code: string
          created_at?: string
          id?: string
          order_amount_bdt: number
          order_id: string
          plan?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          commission_bdt?: number
          coupon_code?: string
          created_at?: string
          id?: string
          order_amount_bdt?: number
          order_id?: string
          plan?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      relay_devices: {
        Row: {
          android_version: string | null
          app_version: string | null
          created_at: string
          device_name: string
          device_uuid: string
          heartbeat_seconds: number
          id: string
          last_seen_at: string | null
          status: string
          token_hash: string
        }
        Insert: {
          android_version?: string | null
          app_version?: string | null
          created_at?: string
          device_name: string
          device_uuid: string
          heartbeat_seconds?: number
          id?: string
          last_seen_at?: string | null
          status?: string
          token_hash: string
        }
        Update: {
          android_version?: string | null
          app_version?: string | null
          created_at?: string
          device_name?: string
          device_uuid?: string
          heartbeat_seconds?: number
          id?: string
          last_seen_at?: string | null
          status?: string
          token_hash?: string
        }
        Relationships: []
      }
      relay_pair_attempts: {
        Row: {
          attempts: number
          scope_hash: string
          window_start: string
        }
        Insert: {
          attempts?: number
          scope_hash: string
          window_start: string
        }
        Update: {
          attempts?: number
          scope_hash?: string
          window_start?: string
        }
        Relationships: []
      }
      relay_pairing_codes: {
        Row: {
          code_hash: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          used_at: string | null
        }
        Insert: {
          code_hash: string
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          used_at?: string | null
        }
        Update: {
          code_hash?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          used_at?: string | null
        }
        Relationships: []
      }
      relay_transactions: {
        Row: {
          amount: number
          created_at: string
          device_id: string
          id: string
          match_status: string
          matched_order_id: string | null
          provider: string
          raw_text: string | null
          received_at: string | null
          sender: string | null
          trx_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          device_id: string
          id?: string
          match_status?: string
          matched_order_id?: string | null
          provider: string
          raw_text?: string | null
          received_at?: string | null
          sender?: string | null
          trx_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          device_id?: string
          id?: string
          match_status?: string
          matched_order_id?: string | null
          provider?: string
          raw_text?: string | null
          received_at?: string | null
          sender?: string | null
          trx_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relay_transactions_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "relay_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      security_blocks: {
        Row: {
          auto: boolean
          blocked_at: string
          created_at: string
          device_fingerprint: string | null
          id: string
          ip_address: string | null
          license_id: string | null
          license_key: string | null
          reason: string
          signal_count: number
          unblocked_at: string | null
        }
        Insert: {
          auto?: boolean
          blocked_at?: string
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          ip_address?: string | null
          license_id?: string | null
          license_key?: string | null
          reason: string
          signal_count?: number
          unblocked_at?: string | null
        }
        Update: {
          auto?: boolean
          blocked_at?: string
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          ip_address?: string | null
          license_id?: string | null
          license_key?: string | null
          reason?: string
          signal_count?: number
          unblocked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_blocks_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      shopbot_products: {
        Row: {
          category_name: string
          created_at: string
          description: string
          description_bn: string | null
          id: number
          image_url: string | null
          in_stock: boolean
          max_qty: number
          min_qty: number
          name: string
          price_override_bdt: number | null
          stock_count: number
          synced_at: string
          title_bn: string | null
          usd_price: number
          visible: boolean
        }
        Insert: {
          category_name?: string
          created_at?: string
          description?: string
          description_bn?: string | null
          id: number
          image_url?: string | null
          in_stock?: boolean
          max_qty?: number
          min_qty?: number
          name: string
          price_override_bdt?: number | null
          stock_count?: number
          synced_at?: string
          title_bn?: string | null
          usd_price?: number
          visible?: boolean
        }
        Update: {
          category_name?: string
          created_at?: string
          description?: string
          description_bn?: string | null
          id?: number
          image_url?: string | null
          in_stock?: boolean
          max_qty?: number
          min_qty?: number
          name?: string
          price_override_bdt?: number | null
          stock_count?: number
          synced_at?: string
          title_bn?: string | null
          usd_price?: number
          visible?: boolean
        }
        Relationships: []
      }
      text_styles: {
        Row: {
          created_at: string
          ffx_path: string
          id: string
          name: string
          preview_path: string | null
          published: boolean
          slug: string
          sort_order: number
          tags: string[]
          tier: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ffx_path: string
          id?: string
          name: string
          preview_path?: string | null
          published?: boolean
          slug: string
          sort_order?: number
          tags?: string[]
          tier?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ffx_path?: string
          id?: string
          name?: string
          preview_path?: string | null
          published?: boolean
          slug?: string
          sort_order?: number
          tags?: string[]
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      usage_counters: {
        Row: {
          created_at: string
          id: string
          license_id: string | null
          metric: string
          period: string
          plan: string | null
          scope_key: string
          updated_at: string
          used: number
        }
        Insert: {
          created_at?: string
          id?: string
          license_id?: string | null
          metric: string
          period: string
          plan?: string | null
          scope_key: string
          updated_at?: string
          used?: number
        }
        Update: {
          created_at?: string
          id?: string
          license_id?: string | null
          metric?: string
          period?: string
          plan?: string | null
          scope_key?: string
          updated_at?: string
          used?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vault_assets: {
        Row: {
          category: string
          description: string | null
          file_name: string
          id: string
          kind: string
          mime_type: string | null
          preview_url: string | null
          size_bytes: number
          source_created_at: string | null
          synced_at: string
          tags: string[]
          title: string
        }
        Insert: {
          category?: string
          description?: string | null
          file_name?: string
          id: string
          kind?: string
          mime_type?: string | null
          preview_url?: string | null
          size_bytes?: number
          source_created_at?: string | null
          synced_at?: string
          tags?: string[]
          title?: string
        }
        Update: {
          category?: string
          description?: string | null
          file_name?: string
          id?: string
          kind?: string
          mime_type?: string | null
          preview_url?: string | null
          size_bytes?: number
          source_created_at?: string | null
          synced_at?: string
          tags?: string[]
          title?: string
        }
        Relationships: []
      }
      vault_sync_state: {
        Row: {
          budget_day: string
          budget_used: number
          completed_at: string | null
          cursor_offset: number
          expected_total: number
          id: number
          updated_at: string
        }
        Insert: {
          budget_day?: string
          budget_used?: number
          completed_at?: string | null
          cursor_offset?: number
          expected_total?: number
          id?: number
          updated_at?: string
        }
        Update: {
          budget_day?: string
          budget_used?: number
          completed_at?: string | null
          cursor_offset?: number
          expected_total?: number
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      download_daily: {
        Row: {
          day: string | null
          downloads: number | null
          package: string | null
        }
        Relationships: []
      }
      download_totals: {
        Row: {
          downloads: number | null
          last_download_at: string | null
          package: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      affiliate_request_withdrawal: {
        Args: { p_account: string; p_amount: number; p_method: string }
        Returns: string
      }
      affiliate_settle_withdrawal: {
        Args: { p_id: string; p_note: string; p_status: string; p_trx: string }
        Returns: undefined
      }
      allocate_digital_key: { Args: { p_order: string }; Returns: boolean }
      asset_facets: {
        Args: never
        Returns: {
          asset_type: string
          category: string
          pack: string
          total: number
        }[]
      }
      claim_caption_job: {
        Args: { _lease_seconds?: number; _worker_id: string }
        Returns: {
          attempts: number
          client_key: string | null
          completed_at: string | null
          created_at: string
          device_id: string | null
          duration_hint: number | null
          error_code: string | null
          error_message: string | null
          expires_at: string
          id: string
          idempotency_key: string | null
          language: string | null
          lease_expires_at: string | null
          max_attempts: number
          media_mime: string
          media_name: string
          media_object_key: string
          media_size: number
          progress: number
          result_srt: string | null
          stage: string
          status: string
          updated_at: string
          worker_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "caption_jobs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      ghost_bump_page_view: { Args: { p_path: string }; Returns: undefined }
      ghost_consume_quota: {
        Args: {
          p_amount: number
          p_license: string
          p_limit: number
          p_metric: string
          p_period: string
          p_plan: string
          p_scope: string
        }
        Returns: {
          allowed: boolean
          limit_value: number
          used: number
        }[]
      }
      giveaway_enter: { Args: { p_visitor: string }; Returns: Json }
      giveaway_spin: {
        Args: { p_email: string; p_user: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      public_digital_reviews: {
        Args: { p_slug: string }
        Returns: {
          body: string
          created_at: string
          display_name: string
          id: string
          rating: number
          reply: string
          screenshot: string
        }[]
      }
      published_coupon_banners: {
        Args: never
        Returns: {
          code: string
          flat_off: number
          percent_off: number
          plans: string[]
        }[]
      }
      published_giveaway: {
        Args: never
        Returns: {
          id: string
          prize_labels: Json
          rules: string
          spins_per_user: number
          title: string
        }[]
      }
      relay_allow_pair_attempt: {
        Args: { p_scope_hash: string }
        Returns: boolean
      }
      relay_pair_device: {
        Args: {
          p_android_version: string
          p_app_version: string
          p_code_hash: string
          p_device_name: string
          p_device_uuid: string
          p_token_hash: string
        }
        Returns: string
      }
      text_activate_license: {
        Args: {
          p_app_version: string
          p_device_name: string
          p_key: string
          p_machine: string
          p_os_info: string
        }
        Returns: Json
      }
      text_deactivate_license: {
        Args: { p_license: string; p_machine: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      asset_access: "public" | "licensed" | "premium"
      license_status:
        | "inactive"
        | "active"
        | "suspended"
        | "revoked"
        | "expired"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      asset_access: ["public", "licensed", "premium"],
      license_status: ["inactive", "active", "suspended", "revoked", "expired"],
    },
  },
} as const
