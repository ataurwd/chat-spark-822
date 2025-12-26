-- Fix groups INSERT policy (recreate as permissive, scoped to authenticated)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'groups'
      AND policyname = 'Authenticated users can create groups'
  ) THEN
    EXECUTE 'DROP POLICY "Authenticated users can create groups" ON public.groups';
  END IF;
END $$;

CREATE POLICY "Authenticated users can create groups"
ON public.groups
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Ensure group creators can always add themselves as members
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'group_members'
      AND policyname = 'Group members can add members'
  ) THEN
    EXECUTE 'DROP POLICY "Group members can add members" ON public.group_members';
  END IF;
END $$;

CREATE POLICY "Group members can add members"
ON public.group_members
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  (
    EXISTS (
      SELECT 1
      FROM public.groups
      WHERE public.groups.id = group_members.group_id
        AND public.groups.created_by = auth.uid()
    )
  )
  OR (auth.uid() = user_id)
);
