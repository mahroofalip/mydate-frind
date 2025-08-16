-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.app_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT app_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user1 uuid,
  user2 uuid,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT chats_pkey PRIMARY KEY (id),
  CONSTRAINT chats_user1_fkey FOREIGN KEY (user1) REFERENCES public.profiles(id),
  CONSTRAINT chats_user2_fkey FOREIGN KEY (user2) REFERENCES public.profiles(id)
);
CREATE TABLE public.contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contacts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ignores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ignored_user_id uuid NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT ignores_pkey PRIMARY KEY (id),
  CONSTRAINT ignores_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT ignores_ignored_user_id_fkey FOREIGN KEY (ignored_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sender uuid,
  receiver uuid,
  liked_at timestamp without time zone DEFAULT now(),
  CONSTRAINT likes_pkey PRIMARY KEY (id),
  CONSTRAINT likes_receiver_fkey FOREIGN KEY (receiver) REFERENCES public.profiles(id),
  CONSTRAINT likes_sender_fkey FOREIGN KEY (sender) REFERENCES public.profiles(id)
);
CREATE TABLE public.matches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user1 uuid,
  user2 uuid,
  matched_at timestamp without time zone DEFAULT now(),
  CONSTRAINT matches_pkey PRIMARY KEY (id),
  CONSTRAINT matches_user1_fkey FOREIGN KEY (user1) REFERENCES public.profiles(id),
  CONSTRAINT matches_user2_fkey FOREIGN KEY (user2) REFERENCES public.profiles(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_id uuid,
  sender uuid,
  content text,
  type text DEFAULT 'text'::text,
  media_url text,
  status text DEFAULT 'sent'::text,
  created_at timestamp without time zone DEFAULT now(),
  is_admin_message boolean DEFAULT false,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id),
  CONSTRAINT messages_sender_fkey FOREIGN KEY (sender) REFERENCES public.profiles(id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id text NOT NULL,
  amount_inr integer NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text])),
  razorpay_payment_id text,
  razorpay_order_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  reference_id text UNIQUE,
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT payments_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text,
  bio text,
  gender text,
  location text,
  occupation text,
  education text,
  interests text,
  looking_for text,
  selfie_url text,
  extra_images text,
  created_at timestamp without time zone DEFAULT now(),
  age text,
  last_login_at timestamp with time zone,
  last_logout_at timestamp with time zone,
  session_expires_at timestamp with time zone,
  is_premium boolean NOT NULL DEFAULT false,
  premium_expires_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now(),
  deletion_requested_at timestamp with time zone,
  deletion_feedback text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.subscription_plans (
  id text NOT NULL UNIQUE CHECK (id = ANY (ARRAY['monthly'::text, 'quarterly'::text, 'yearly'::text])),
  name text NOT NULL,
  price_inr integer NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  duration_days integer NOT NULL DEFAULT 30,
  CONSTRAINT subscription_plans_pkey PRIMARY KEY (id)
);
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan_id text NOT NULL,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'canceled'::text, 'expired'::text])),
  start_date timestamp with time zone NOT NULL DEFAULT now(),
  end_date timestamp with time zone NOT NULL,
  payment_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id),
  CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id),
  CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.webhook_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT webhook_logs_pkey PRIMARY KEY (id)
);