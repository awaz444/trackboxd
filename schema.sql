-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.activity (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  action text NOT NULL CHECK (action = ANY (ARRAY['like'::text, 'review'::text, 'annotation'::text, 'follow'::text, 'playlist_create'::text])),
  created_at timestamp with time zone DEFAULT now(),
  target_id uuid,
  target_table text NOT NULL DEFAULT 'annotation'::text CHECK (target_table = ANY (ARRAY['annotation'::text, 'review'::text])),
  CONSTRAINT activity_pkey PRIMARY KEY (id),
  CONSTRAINT activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.annotations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  track_id text NOT NULL,
  timestamp double precision NOT NULL CHECK ("timestamp" >= 0::double precision),
  text text NOT NULL CHECK (char_length(text) >= 5),
  is_public boolean NOT NULL DEFAULT true,
  like_count integer DEFAULT 0 CHECK (like_count >= 0),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT annotations_pkey PRIMARY KEY (id),
  CONSTRAINT annotations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT annotations_track_id_fkey FOREIGN KEY (track_id) REFERENCES public.spotify_items(id)
);
CREATE TABLE public.follows (
  follower_id text NOT NULL,
  following_id text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  accepted boolean NOT NULL DEFAULT false,
  CONSTRAINT follows_pkey PRIMARY KEY (follower_id, following_id),
  CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.users(id),
  CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.users(id)
);
CREATE TABLE public.likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  target_type text NOT NULL CHECK (target_type = ANY (ARRAY['track'::text, 'album'::text, 'playlist'::text, 'review'::text, 'annotation'::text])),
  target_id text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT likes_pkey PRIMARY KEY (id),
  CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['like'::text, 'comment'::text, 'follow'::text, 'new_content'::text])),
  source_id text NOT NULL,
  target_id text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.profile_prompts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  prompt_text text NOT NULL CHECK (char_length(prompt_text) > 0),
  expected_type text NOT NULL CHECK (expected_type = ANY (ARRAY['track'::text, 'album'::text, 'playlist'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profile_prompts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  item_id text NOT NULL,
  rating numeric NOT NULL CHECK (rating >= 0.5 AND rating <= 5.0 AND (rating * 2::numeric) = floor(rating * 2::numeric)),
  text text NOT NULL,
  is_public boolean NOT NULL DEFAULT true,
  like_count integer DEFAULT 0 CHECK (like_count >= 0),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT reviews_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.spotify_items(id)
);
CREATE TABLE public.spotify_items (
  id text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['track'::text, 'album'::text, 'playlist'::text])),
  name text,
  artist text,
  album text,
  duration_ms integer,
  cover_url text,
  spotify_url text,
  like_count integer DEFAULT 0 CHECK (like_count >= 0),
  review_count integer DEFAULT 0 CHECK (review_count >= 0),
  annotation_count integer DEFAULT 0 CHECK (annotation_count >= 0),
  avg_rating numeric DEFAULT 0.00 CHECK (avg_rating >= 0::numeric AND avg_rating <= 5::numeric),
  created_at timestamp with time zone DEFAULT now(),
  last_updated timestamp with time zone DEFAULT now(),
  description text,
  CONSTRAINT spotify_items_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_favorite_tracks (
  user_id text NOT NULL,
  track_id text NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT user_favorite_tracks_pkey PRIMARY KEY (user_id, track_id),
  CONSTRAINT user_favorite_tracks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_favorite_tracks_track_id_fkey FOREIGN KEY (track_id) REFERENCES public.spotify_items(id)
);
CREATE TABLE public.user_profile_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  prompt_id uuid NOT NULL,
  spotify_item_id text NOT NULL,
  custom_text text CHECK (char_length(custom_text) <= 280),
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_profile_responses_pkey PRIMARY KEY (id),
  CONSTRAINT user_profile_responses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_profile_responses_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.profile_prompts(id),
  CONSTRAINT user_profile_responses_spotify_item_id_fkey FOREIGN KEY (spotify_item_id) REFERENCES public.spotify_items(id)
);
CREATE TABLE public.users (
  id text NOT NULL,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  image_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_login timestamp with time zone,
  spotify_url text,
  country text,
  username text UNIQUE,
  instagram_url text,
  profile_private boolean NOT NULL DEFAULT false,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);