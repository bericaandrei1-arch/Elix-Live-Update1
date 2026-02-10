
-- 1. Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS following_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0;

-- 2. Create function to handle follower counts
CREATE OR REPLACE FUNCTION public.handle_new_follower()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment followers_count for the user being followed
  UPDATE public.profiles
  SET followers_count = followers_count + 1
  WHERE user_id = NEW.following_id;

  -- Increment following_count for the user who is following
  UPDATE public.profiles
  SET following_count = following_count + 1
  WHERE user_id = NEW.follower_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_unfollower()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrement followers_count for the user being unfollowed
  UPDATE public.profiles
  SET followers_count = GREATEST(0, followers_count - 1)
  WHERE user_id = OLD.following_id;

  -- Decrement following_count for the user who was following
  UPDATE public.profiles
  SET following_count = GREATEST(0, following_count - 1)
  WHERE user_id = OLD.follower_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create triggers for followers
DROP TRIGGER IF EXISTS on_follow_added ON public.followers;
CREATE TRIGGER on_follow_added
AFTER INSERT ON public.followers
FOR EACH ROW EXECUTE FUNCTION public.handle_new_follower();

DROP TRIGGER IF EXISTS on_follow_removed ON public.followers;
CREATE TRIGGER on_follow_removed
AFTER DELETE ON public.followers
FOR EACH ROW EXECUTE FUNCTION public.handle_unfollower();


-- 4. Create function to handle like counts (Total likes received by a user)
CREATE OR REPLACE FUNCTION public.handle_new_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Find the author of the video and increment their total likes
  UPDATE public.profiles
  SET likes_count = likes_count + 1
  WHERE user_id = (SELECT user_id FROM public.videos WHERE id = NEW.video_id);

  -- Also increment the likes count on the video itself
  UPDATE public.videos
  SET likes = likes + 1
  WHERE id = NEW.video_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_unlike()
RETURNS TRIGGER AS $$
BEGIN
  -- Find the author of the video and decrement their total likes
  UPDATE public.profiles
  SET likes_count = GREATEST(0, likes_count - 1)
  WHERE user_id = (SELECT user_id FROM public.videos WHERE id = OLD.video_id);

  -- Also decrement the likes count on the video itself
  UPDATE public.videos
  SET likes = GREATEST(0, likes - 1)
  WHERE id = OLD.video_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create triggers for likes
DROP TRIGGER IF EXISTS on_like_added ON public.likes;
CREATE TRIGGER on_like_added
AFTER INSERT ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.handle_new_like();

DROP TRIGGER IF EXISTS on_like_removed ON public.likes;
CREATE TRIGGER on_like_removed
AFTER DELETE ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.handle_unlike();
