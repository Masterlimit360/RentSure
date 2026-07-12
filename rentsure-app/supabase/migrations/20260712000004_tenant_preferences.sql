-- Migration: Tenant Preferences for Compatibility Score
-- Depends on: 20260712000000_init.sql

CREATE TABLE public.tenant_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  budget_max_per_year NUMERIC(12,2) CHECK (budget_max_per_year > 0),
  preferred_cities TEXT[] DEFAULT '{}',
  preferred_areas TEXT[] DEFAULT '{}',
  property_types TEXT[] DEFAULT '{}',
  min_bedrooms SMALLINT DEFAULT 0,
  required_amenities TEXT[] DEFAULT '{}',
  nice_to_have_amenities TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.tenant_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own preferences"
  ON public.tenant_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.tenant_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.tenant_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
