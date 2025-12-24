-- Drop and recreate the groups insert policy
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;

CREATE POLICY "Authenticated users can create groups"
ON public.groups FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Also need to allow the creator to add themselves as a member
DROP POLICY IF EXISTS "Group creator can add members" ON public.group_members;

CREATE POLICY "Group members can add members"
ON public.group_members FOR INSERT
TO authenticated
WITH CHECK (
  -- Creator can add anyone to their group
  EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = group_id AND created_by = auth.uid()
  )
  -- Or user is adding themselves (for initial join)
  OR auth.uid() = user_id
);