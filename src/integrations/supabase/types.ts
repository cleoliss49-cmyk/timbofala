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
      admin_users: {
        Row: {
          can_delete_posts: boolean
          can_delete_users: boolean
          can_manage_admins: boolean
          can_pin_posts: boolean
          created_at: string
          created_by: string | null
          email: string
          id: string
          role: Database["public"]["Enums"]["admin_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          can_delete_posts?: boolean
          can_delete_users?: boolean
          can_manage_admins?: boolean
          can_pin_posts?: boolean
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          can_delete_posts?: boolean
          can_delete_users?: boolean
          can_manage_admins?: boolean
          can_pin_posts?: boolean
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      auction_bids: {
        Row: {
          amount: number
          auction_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          amount: number
          auction_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          auction_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auction_bids_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      auctions: {
        Row: {
          bid_increment_percent: number
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          min_bid: number
          post_id: string
          status: string
          title: string
          updated_at: string
          winner_id: string | null
          winning_bid: number | null
        }
        Insert: {
          bid_increment_percent?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          min_bid: number
          post_id: string
          status?: string
          title: string
          updated_at?: string
          winner_id?: string | null
          winning_bid?: number | null
        }
        Update: {
          bid_increment_percent?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          min_bid?: number
          post_id?: string
          status?: string
          title?: string
          updated_at?: string
          winner_id?: string | null
          winning_bid?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "auctions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      business_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      business_coupons: {
        Row: {
          business_id: string
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_order_value: number | null
          starts_at: string | null
          updated_at: string
          uses_count: number
        }
        Insert: {
          business_id: string
          code: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_value?: number | null
          starts_at?: string | null
          updated_at?: string
          uses_count?: number
        }
        Update: {
          business_id?: string
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_value?: number | null
          starts_at?: string | null
          updated_at?: string
          uses_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_coupons_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_delivery_zones: {
        Row: {
          business_id: string
          city: string
          created_at: string
          delivery_fee: number
          id: string
          is_active: boolean
          neighborhood: string
        }
        Insert: {
          business_id: string
          city?: string
          created_at?: string
          delivery_fee?: number
          id?: string
          is_active?: boolean
          neighborhood: string
        }
        Update: {
          business_id?: string
          city?: string
          created_at?: string
          delivery_fee?: number
          id?: string
          is_active?: boolean
          neighborhood?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_delivery_zones_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          product_name: string
          product_price: number
          quantity: number
          subtotal: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          product_name: string
          product_price: number
          quantity: number
          subtotal: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          product_price?: number
          quantity?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "business_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "business_products"
            referencedColumns: ["id"]
          },
        ]
      }
      business_orders: {
        Row: {
          business_id: string
          coupon_id: string | null
          created_at: string
          customer_id: string
          customer_neighborhood: string | null
          customer_notes: string | null
          customer_phone: string | null
          delivery_address: string | null
          delivery_fee: number | null
          delivery_number: string | null
          delivery_reference: string | null
          delivery_street: string | null
          discount_amount: number | null
          id: string
          order_number: string
          payment_method: string | null
          payment_status: string | null
          pix_code: string | null
          receipt_uploaded_at: string | null
          receipt_url: string | null
          rejection_reason: string | null
          status: string
          subtotal: number
          total: number
          updated_at: string
          wants_delivery: boolean
        }
        Insert: {
          business_id: string
          coupon_id?: string | null
          created_at?: string
          customer_id: string
          customer_neighborhood?: string | null
          customer_notes?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_fee?: number | null
          delivery_number?: string | null
          delivery_reference?: string | null
          delivery_street?: string | null
          discount_amount?: number | null
          id?: string
          order_number: string
          payment_method?: string | null
          payment_status?: string | null
          pix_code?: string | null
          receipt_uploaded_at?: string | null
          receipt_url?: string | null
          rejection_reason?: string | null
          status?: string
          subtotal: number
          total: number
          updated_at?: string
          wants_delivery?: boolean
        }
        Update: {
          business_id?: string
          coupon_id?: string | null
          created_at?: string
          customer_id?: string
          customer_neighborhood?: string | null
          customer_notes?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_fee?: number | null
          delivery_number?: string | null
          delivery_reference?: string | null
          delivery_street?: string | null
          discount_amount?: number | null
          id?: string
          order_number?: string
          payment_method?: string | null
          payment_status?: string | null
          pix_code?: string | null
          receipt_uploaded_at?: string | null
          receipt_url?: string | null
          rejection_reason?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          wants_delivery?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "business_orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "business_coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      business_product_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          product_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          product_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          product_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "business_product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "business_products"
            referencedColumns: ["id"]
          },
        ]
      }
      business_products: {
        Row: {
          allows_delivery: boolean
          business_id: string
          category: string
          created_at: string
          description: string | null
          dimensions: string | null
          id: string
          image_url: string | null
          is_available: boolean
          name: string
          price: number
          promotional_price: number | null
          sku: string | null
          sort_order: number | null
          stock_quantity: number | null
          updated_at: string
          weight: string | null
        }
        Insert: {
          allows_delivery?: boolean
          business_id: string
          category?: string
          created_at?: string
          description?: string | null
          dimensions?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name: string
          price: number
          promotional_price?: number | null
          sku?: string | null
          sort_order?: number | null
          stock_quantity?: number | null
          updated_at?: string
          weight?: string | null
        }
        Update: {
          allows_delivery?: boolean
          business_id?: string
          category?: string
          created_at?: string
          description?: string | null
          dimensions?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name?: string
          price?: number
          promotional_price?: number | null
          sku?: string | null
          sort_order?: number | null
          stock_quantity?: number | null
          updated_at?: string
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profiles: {
        Row: {
          accepted_platform_terms: boolean | null
          accepted_platform_terms_at: string | null
          accepts_card: boolean | null
          accepts_cash: boolean | null
          accepts_pix: boolean | null
          address: string | null
          business_name: string
          category: string
          city: string
          cover_url: string | null
          created_at: string
          delivery_fee: number | null
          description: string | null
          email: string | null
          estimated_prep_time_minutes: number | null
          facebook: string | null
          id: string
          instagram: string | null
          is_active: boolean
          is_verified: boolean
          logo_url: string | null
          min_order_value: number | null
          neighborhood: string | null
          offers_delivery: boolean
          opening_hours: Json | null
          phone: string | null
          pix_holder_name: string | null
          pix_key: string | null
          pix_key_type: string | null
          slug: string
          updated_at: string
          user_id: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          accepted_platform_terms?: boolean | null
          accepted_platform_terms_at?: string | null
          accepts_card?: boolean | null
          accepts_cash?: boolean | null
          accepts_pix?: boolean | null
          address?: string | null
          business_name: string
          category?: string
          city?: string
          cover_url?: string | null
          created_at?: string
          delivery_fee?: number | null
          description?: string | null
          email?: string | null
          estimated_prep_time_minutes?: number | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean
          is_verified?: boolean
          logo_url?: string | null
          min_order_value?: number | null
          neighborhood?: string | null
          offers_delivery?: boolean
          opening_hours?: Json | null
          phone?: string | null
          pix_holder_name?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          slug: string
          updated_at?: string
          user_id: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          accepted_platform_terms?: boolean | null
          accepted_platform_terms_at?: string | null
          accepts_card?: boolean | null
          accepts_cash?: boolean | null
          accepts_pix?: boolean | null
          address?: string | null
          business_name?: string
          category?: string
          city?: string
          cover_url?: string | null
          created_at?: string
          delivery_fee?: number | null
          description?: string | null
          email?: string | null
          estimated_prep_time_minutes?: number | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          is_active?: boolean
          is_verified?: boolean
          logo_url?: string | null
          min_order_value?: number | null
          neighborhood?: string | null
          offers_delivery?: boolean
          opening_hours?: Json | null
          phone?: string | null
          pix_holder_name?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          slug?: string
          updated_at?: string
          user_id?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      business_reviews: {
        Row: {
          business_id: string
          comment: string | null
          created_at: string
          id: string
          order_id: string | null
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          comment?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "business_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      call_sessions: {
        Row: {
          call_type: string
          caller_id: string
          created_at: string
          ended_at: string | null
          id: string
          receiver_id: string
          started_at: string | null
          status: string
        }
        Insert: {
          call_type?: string
          caller_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          receiver_id: string
          started_at?: string | null
          status?: string
        }
        Update: {
          call_type?: string
          caller_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          receiver_id?: string
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
          wants_delivery: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
          wants_delivery?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
          wants_delivery?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "business_products"
            referencedColumns: ["id"]
          },
        ]
      }
      classified_favorites: {
        Row: {
          classified_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          classified_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          classified_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classified_favorites_classified_id_fkey"
            columns: ["classified_id"]
            isOneToOne: false
            referencedRelation: "classifieds"
            referencedColumns: ["id"]
          },
        ]
      }
      classified_images: {
        Row: {
          classified_id: string
          created_at: string
          id: string
          image_url: string
          sort_order: number | null
        }
        Insert: {
          classified_id: string
          created_at?: string
          id?: string
          image_url: string
          sort_order?: number | null
        }
        Update: {
          classified_id?: string
          created_at?: string
          id?: string
          image_url?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "classified_images_classified_id_fkey"
            columns: ["classified_id"]
            isOneToOne: false
            referencedRelation: "classifieds"
            referencedColumns: ["id"]
          },
        ]
      }
      classifieds: {
        Row: {
          category: string
          contact_email: string | null
          contact_phone: string | null
          contact_whatsapp: string | null
          created_at: string
          description: string
          expires_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_urgent: boolean
          location: string | null
          neighborhood: string | null
          price: number | null
          price_type: string | null
          subcategory: string | null
          title: string
          updated_at: string
          user_id: string
          views_count: number
        }
        Insert: {
          category?: string
          contact_email?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          description: string
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_urgent?: boolean
          location?: string | null
          neighborhood?: string | null
          price?: number | null
          price_type?: string | null
          subcategory?: string | null
          title: string
          updated_at?: string
          user_id: string
          views_count?: number
        }
        Update: {
          category?: string
          contact_email?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          description?: string
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_urgent?: boolean
          location?: string | null
          neighborhood?: string | null
          price?: number | null
          price_type?: string | null
          subcategory?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          views_count?: number
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_usage: {
        Row: {
          coupon_id: string
          id: string
          order_id: string | null
          used_at: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          id?: string
          order_id?: string | null
          used_at?: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          id?: string
          order_id?: string | null
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "business_coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "business_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendees: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string
          created_at: string
          description: string | null
          end_date: string | null
          event_date: string
          id: string
          image_url: string | null
          is_free: boolean
          location: string
          max_attendees: number | null
          price: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_date: string
          id?: string
          image_url?: string | null
          is_free?: boolean
          location: string
          max_attendees?: number | null
          price?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_date?: string
          id?: string
          image_url?: string | null
          is_free?: boolean
          location?: string
          max_attendees?: number | null
          price?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mentions: {
        Row: {
          created_at: string
          id: string
          mentioned_user_id: string
          post_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mentioned_user_id: string
          post_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mentioned_user_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          message: string | null
          post_id: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          post_id?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          post_id?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      order_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_from_business: boolean
          order_id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_from_business?: boolean
          order_id: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_from_business?: boolean
          order_id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "business_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      paquera_likes: {
        Row: {
          created_at: string
          id: string
          liked_id: string
          liker_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          liked_id: string
          liker_id: string
        }
        Update: {
          created_at?: string
          id?: string
          liked_id?: string
          liker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paquera_likes_liked_id_fkey"
            columns: ["liked_id"]
            isOneToOne: false
            referencedRelation: "paquera_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paquera_likes_liker_id_fkey"
            columns: ["liker_id"]
            isOneToOne: false
            referencedRelation: "paquera_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      paquera_matches: {
        Row: {
          created_at: string
          id: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paquera_matches_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "paquera_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paquera_matches_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "paquera_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      paquera_profiles: {
        Row: {
          accepted_terms: boolean | null
          accepted_terms_at: string | null
          age_range_max: number | null
          age_range_min: number | null
          bio: string | null
          city: string
          created_at: string
          gender: string
          hobbies: string[] | null
          id: string
          is_active: boolean | null
          looking_for_gender: string
          photo_url: string
          sexual_orientation: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_terms?: boolean | null
          accepted_terms_at?: string | null
          age_range_max?: number | null
          age_range_min?: number | null
          bio?: string | null
          city: string
          created_at?: string
          gender: string
          hobbies?: string[] | null
          id?: string
          is_active?: boolean | null
          looking_for_gender: string
          photo_url: string
          sexual_orientation: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_terms?: boolean | null
          accepted_terms_at?: string | null
          age_range_max?: number | null
          age_range_min?: number | null
          bio?: string | null
          city?: string
          created_at?: string
          gender?: string
          hobbies?: string[] | null
          id?: string
          is_active?: boolean | null
          looking_for_gender?: string
          photo_url?: string
          sexual_orientation?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pinned_post_impressions: {
        Row: {
          id: string
          last_seen_at: string
          pinned_post_id: string
          user_id: string
        }
        Insert: {
          id?: string
          last_seen_at?: string
          pinned_post_id: string
          user_id: string
        }
        Update: {
          id?: string
          last_seen_at?: string
          pinned_post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pinned_post_impressions_pinned_post_id_fkey"
            columns: ["pinned_post_id"]
            isOneToOne: false
            referencedRelation: "pinned_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      pinned_posts: {
        Row: {
          created_at: string
          duration_hours: number
          ends_at: string
          id: string
          impressions: number
          pin_location: string
          pinned_by: string
          post_id: string
          starts_at: string
        }
        Insert: {
          created_at?: string
          duration_hours?: number
          ends_at: string
          id?: string
          impressions?: number
          pin_location?: string
          pinned_by: string
          post_id: string
          starts_at?: string
        }
        Update: {
          created_at?: string
          duration_hours?: number
          ends_at?: string
          id?: string
          impressions?: number
          pin_location?: string
          pinned_by?: string
          post_id?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pinned_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_commissions: {
        Row: {
          admin_notes: string | null
          business_id: string
          commission_amount: number
          commission_rate: number
          confirmed_by: string | null
          created_at: string
          id: string
          month_year: string
          paid_at: string | null
          receipt_uploaded_at: string | null
          receipt_url: string | null
          status: string
          total_sales: number
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          business_id: string
          commission_amount?: number
          commission_rate?: number
          confirmed_by?: string | null
          created_at?: string
          id?: string
          month_year: string
          paid_at?: string | null
          receipt_uploaded_at?: string | null
          receipt_url?: string | null
          status?: string
          total_sales?: number
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          business_id?: string
          commission_amount?: number
          commission_rate?: number
          confirmed_by?: string | null
          created_at?: string
          id?: string
          month_year?: string
          paid_at?: string | null
          receipt_uploaded_at?: string | null
          receipt_url?: string | null
          status?: string
          total_sales?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_commissions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_options: {
        Row: {
          created_at: string
          id: string
          option_text: string
          poll_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_text: string
          poll_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_text?: string
          poll_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          post_id: string
          question: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          post_id: string
          question: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          post_id?: string
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "polls_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string | null
          created_at: string
          feeling: string | null
          id: string
          image_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          feeling?: string | null
          id?: string
          image_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          feeling?: string | null
          id?: string
          image_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_comments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_favorites: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_likes: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_likes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "business_products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          condition: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_sold: boolean
          location: string | null
          price: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          condition?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_sold?: boolean
          location?: string | null
          price: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          condition?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_sold?: boolean
          location?: string | null
          price?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accepted_terms: boolean
          accepted_terms_at: string | null
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          city: string
          cover_url: string | null
          created_at: string
          education: string | null
          facebook_url: string | null
          full_name: string
          gender: string | null
          id: string
          instagram_url: string | null
          kwai_url: string | null
          languages: string[] | null
          neighborhood: string
          profession: string | null
          relationship_status: string | null
          sexual_orientation: string | null
          show_birth_date: boolean | null
          show_education: boolean | null
          show_languages: boolean | null
          show_profession: boolean | null
          show_relationship_status: boolean | null
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string
          username: string
        }
        Insert: {
          accepted_terms?: boolean
          accepted_terms_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          city?: string
          cover_url?: string | null
          created_at?: string
          education?: string | null
          facebook_url?: string | null
          full_name: string
          gender?: string | null
          id: string
          instagram_url?: string | null
          kwai_url?: string | null
          languages?: string[] | null
          neighborhood: string
          profession?: string | null
          relationship_status?: string | null
          sexual_orientation?: string | null
          show_birth_date?: boolean | null
          show_education?: boolean | null
          show_languages?: boolean | null
          show_profession?: boolean | null
          show_relationship_status?: boolean | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          accepted_terms?: boolean
          accepted_terms_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          city?: string
          cover_url?: string | null
          created_at?: string
          education?: string | null
          facebook_url?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          instagram_url?: string | null
          kwai_url?: string | null
          languages?: string[] | null
          neighborhood?: string
          profession?: string | null
          relationship_status?: string | null
          sexual_orientation?: string | null
          show_birth_date?: boolean | null
          show_education?: boolean | null
          show_languages?: boolean | null
          show_profession?: boolean | null
          show_relationship_status?: boolean | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          action_taken: string | null
          created_at: string
          description: string | null
          id: string
          reason: string
          reported_post_id: string | null
          reported_user_id: string | null
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reported_post_id?: string | null
          reported_user_id?: string | null
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reported_post_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_post_id_fkey"
            columns: ["reported_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_posts: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          caption: string | null
          created_at: string
          expires_at: string
          id: string
          media_type: string
          media_url: string
          user_id: string
          views_count: number
        }
        Insert: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url: string
          user_id: string
          views_count?: number
        }
        Update: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url?: string
          user_id?: string
          views_count?: number
        }
        Relationships: []
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          story_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bans: {
        Row: {
          banned_at: string
          banned_by: string
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          reason: string | null
          user_id: string
        }
        Insert: {
          banned_at?: string
          banned_by: string
          created_at?: string
          expires_at: string
          id?: string
          is_active?: boolean
          reason?: string | null
          user_id: string
        }
        Update: {
          banned_at?: string
          banned_by?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          allow_messages_from_all: boolean
          allow_tagging: boolean
          created_at: string
          email_notifications: boolean
          id: string
          is_profile_public: boolean
          notify_auctions: boolean
          notify_comments: boolean
          notify_events: boolean
          notify_follows: boolean
          notify_likes: boolean
          notify_mentions: boolean
          notify_messages: boolean
          push_notifications: boolean
          show_activity_status: boolean
          show_last_seen: boolean
          show_online_status: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_messages_from_all?: boolean
          allow_tagging?: boolean
          created_at?: string
          email_notifications?: boolean
          id?: string
          is_profile_public?: boolean
          notify_auctions?: boolean
          notify_comments?: boolean
          notify_events?: boolean
          notify_follows?: boolean
          notify_likes?: boolean
          notify_mentions?: boolean
          notify_messages?: boolean
          push_notifications?: boolean
          show_activity_status?: boolean
          show_last_seen?: boolean
          show_online_status?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_messages_from_all?: boolean
          allow_tagging?: boolean
          created_at?: string
          email_notifications?: boolean
          id?: string
          is_profile_public?: boolean
          notify_auctions?: boolean
          notify_comments?: boolean
          notify_events?: boolean
          notify_follows?: boolean
          notify_likes?: boolean
          notify_mentions?: boolean
          notify_messages?: boolean
          push_notifications?: boolean
          show_activity_status?: boolean
          show_last_seen?: boolean
          show_online_status?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_stories: { Args: never; Returns: undefined }
      get_user_ban_info: {
        Args: { _user_id: string }
        Returns: {
          expires_at: string
          reason: string
        }[]
      }
      has_business_profile: { Args: { _user_id: string }; Returns: boolean }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      is_user_banned: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      admin_role: "super_admin" | "moderator" | "viewer"
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
    Enums: {
      admin_role: ["super_admin", "moderator", "viewer"],
    },
  },
} as const
