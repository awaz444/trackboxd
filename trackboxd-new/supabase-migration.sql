-- Migration to integrate Supabase Auth with existing users table
-- Run this in your Supabase SQL editor

-- 1. Enable RLS (Row Level Security) on the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Create policies for the users table
-- Users can read their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid()::text = id);

-- Users can update their own data
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = id);

-- 3. Create a function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id,
        email,
        name,
        image_url,
        created_at,
        updated_at,
        last_login
    )
    VALUES (
        NEW.id::text,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NEW.raw_user_meta_data->>'image_url',
        NOW(),
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create a trigger to automatically create a public.users record when a new user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Create a function to handle user updates
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users
    SET
        email = NEW.email,
        name = COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        image_url = NEW.raw_user_meta_data->>'image_url',
        updated_at = NOW(),
        last_login = NOW()
    WHERE id = NEW.id::text;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create a trigger to update public.users when auth.users is updated
CREATE OR REPLACE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- 7. Create a function to sync username and other custom fields
CREATE OR REPLACE FUNCTION public.update_user_profile(
    user_id UUID,
    username TEXT DEFAULT NULL,
    spotify_url TEXT DEFAULT NULL,
    country TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.users
    SET
        username = COALESCE(update_user_profile.username, public.users.username),
        spotify_url = COALESCE(update_user_profile.spotify_url, public.users.spotify_url),
        country = COALESCE(update_user_profile.country, public.users.country),
        updated_at = NOW()
    WHERE id = user_id::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_profile TO authenticated;

-- 9. Create an index on name for faster lookups (name is used as username)
CREATE INDEX IF NOT EXISTS idx_users_name ON public.users(name);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 10. Add unique constraint on name field (since it's used as username)
ALTER TABLE public.users ADD CONSTRAINT users_name_unique UNIQUE (name);
