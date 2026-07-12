-- Migration for Notification Delete RLS Policy
-- Fixes the silent failure where delete attempts were ignored due to lack of DELETE policy.

DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE TO authenticated USING (user_id = auth.uid());
