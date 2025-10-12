-- Migration to add 'accepted' column to follows table for private profile functionality
-- This enables follow requests for private profiles

ALTER TABLE public.follows 
ADD COLUMN accepted boolean NOT NULL DEFAULT true;

-- Create index for better performance when querying pending requests
CREATE INDEX idx_follows_accepted ON public.follows(accepted);
CREATE INDEX idx_follows_following_accepted ON public.follows(following_id, accepted);
CREATE INDEX idx_follows_follower_accepted ON public.follows(follower_id, accepted);

-- Add comment to document the column purpose
COMMENT ON COLUMN public.follows.accepted IS 'Whether the follow request has been accepted. Defaults to true for public profiles, false for private profiles requiring approval.';