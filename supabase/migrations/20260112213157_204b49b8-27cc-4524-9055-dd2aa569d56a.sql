-- Step 1: Create a security definer function to safely check admin status
-- This bypasses RLS to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE user_id = check_user_id),
    false
  )
$$;

-- Step 2: Drop all problematic RLS policies on profiles table
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Step 3: Drop problematic RLS policies on user_letters table
DROP POLICY IF EXISTS "Users can view their own letters" ON public.user_letters;
DROP POLICY IF EXISTS "Users can create their own letters" ON public.user_letters;
DROP POLICY IF EXISTS "Users can update their own letters" ON public.user_letters;
DROP POLICY IF EXISTS "Users can delete their own letters" ON public.user_letters;
DROP POLICY IF EXISTS "Admins can view all letters" ON public.user_letters;

-- Step 4: Drop problematic RLS policies on blog_posts table
DROP POLICY IF EXISTS "Anyone can view published posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can manage all posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can create posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can update posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can delete posts" ON public.blog_posts;

-- Step 5: Drop problematic RLS policies on analytics_events table
DROP POLICY IF EXISTS "Admins can view all analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.analytics_events;

-- Step 6: Drop problematic RLS policies on blog_categories table
DROP POLICY IF EXISTS "Anyone can view categories" ON public.blog_categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.blog_categories;

-- Step 7: Drop problematic RLS policies on blog_tags table
DROP POLICY IF EXISTS "Anyone can view tags" ON public.blog_tags;
DROP POLICY IF EXISTS "Admins can manage tags" ON public.blog_tags;

-- Step 8: Recreate profiles table policies using the safe function
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

-- Step 9: Recreate user_letters table policies using the safe function
CREATE POLICY "Users can view their own letters" ON public.user_letters
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own letters" ON public.user_letters
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own letters" ON public.user_letters
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own letters" ON public.user_letters
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all letters" ON public.user_letters
FOR SELECT USING (public.is_admin(auth.uid()));

-- Step 10: Recreate blog_posts table policies using the safe function
CREATE POLICY "Anyone can view published posts" ON public.blog_posts
FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can view all posts" ON public.blog_posts
FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create posts" ON public.blog_posts
FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update posts" ON public.blog_posts
FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete posts" ON public.blog_posts
FOR DELETE USING (public.is_admin(auth.uid()));

-- Step 11: Recreate analytics_events table policies using the safe function
CREATE POLICY "Admins can view all analytics" ON public.analytics_events
FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can insert analytics" ON public.analytics_events
FOR INSERT WITH CHECK (true);

-- Step 12: Recreate blog_categories table policies using the safe function
CREATE POLICY "Anyone can view categories" ON public.blog_categories
FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON public.blog_categories
FOR ALL USING (public.is_admin(auth.uid()));

-- Step 13: Recreate blog_tags table policies using the safe function
CREATE POLICY "Anyone can view tags" ON public.blog_tags
FOR SELECT USING (true);

CREATE POLICY "Admins can manage tags" ON public.blog_tags
FOR ALL USING (public.is_admin(auth.uid()));