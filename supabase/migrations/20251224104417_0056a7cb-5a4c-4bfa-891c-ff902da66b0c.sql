-- Create groups table
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group members table
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Add group_id to messages table for group messages
ALTER TABLE public.messages
ADD COLUMN group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Function to check if user is member of a group
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id AND group_id = _group_id
  )
$$;

-- Groups policies
CREATE POLICY "Users can view groups they are members of"
ON public.groups FOR SELECT
USING (public.is_group_member(auth.uid(), id));

CREATE POLICY "Authenticated users can create groups"
ON public.groups FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Group members policies
CREATE POLICY "Members can view group members"
ON public.group_members FOR SELECT
USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Group creator can add members"
ON public.group_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = group_id AND created_by = auth.uid()
  )
  OR auth.uid() = user_id
);

CREATE POLICY "Members can leave group"
ON public.group_members FOR DELETE
USING (auth.uid() = user_id);

-- Update messages policy to include group messages
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
CREATE POLICY "Users can view their messages"
ON public.messages FOR SELECT
USING (
  (auth.uid() = sender_id OR auth.uid() = receiver_id)
  OR (group_id IS NOT NULL AND public.is_group_member(auth.uid(), group_id))
);

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND (
    (receiver_id IS NOT NULL AND group_id IS NULL)
    OR (group_id IS NOT NULL AND receiver_id IS NULL AND public.is_group_member(auth.uid(), group_id))
  )
);

-- Enable realtime for groups
ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;