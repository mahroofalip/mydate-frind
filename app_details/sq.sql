-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.chats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user1 uuid,
  user2 uuid,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT chats_pkey PRIMARY KEY (id),
  CONSTRAINT chats_user1_fkey FOREIGN KEY (user1) REFERENCES public.profiles(id),
  CONSTRAINT chats_user2_fkey FOREIGN KEY (user2) REFERENCES public.profiles(id)
);
CREATE TABLE public.likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sender uuid,
  receiver uuid,
  liked_at timestamp without time zone DEFAULT now(),
  CONSTRAINT likes_pkey PRIMARY KEY (id),
  CONSTRAINT likes_sender_fkey FOREIGN KEY (sender) REFERENCES public.profiles(id),
  CONSTRAINT likes_receiver_fkey FOREIGN KEY (receiver) REFERENCES public.profiles(id)
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
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_sender_fkey FOREIGN KEY (sender) REFERENCES public.profiles(id),
  CONSTRAINT messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id)
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
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);