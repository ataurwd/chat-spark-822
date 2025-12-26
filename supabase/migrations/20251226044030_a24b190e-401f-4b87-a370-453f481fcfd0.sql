-- Update the UPDATE policy to allow users to edit their own messages
DROP POLICY IF EXISTS "Users can mark messages as seen" ON public.messages;

CREATE POLICY "Users can update their messages"
ON public.messages
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = receiver_id) OR (auth.uid() = sender_id)
)
WITH CHECK (
  (auth.uid() = receiver_id) OR (auth.uid() = sender_id)
);

-- Add DELETE policy for users to delete their own messages
CREATE POLICY "Users can delete their messages"
ON public.messages
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);