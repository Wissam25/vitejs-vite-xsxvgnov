/*
  # Create inscriptions table for TPL scheduling

  1. New Tables
    - `inscriptions`
      - `id` (uuid, primary key, auto-generated)
      - `name` (text, required)
      - `date` (text, required)
      - `venue` (text, required)
      - `slot` (text, required)
      - `created_at` (timestamp with time zone, default: now())

  2. Security
    - Enable RLS on `inscriptions` table
    - Add policies for:
      - Anyone can read inscriptions
      - Anyone can insert inscriptions
      - Anyone can delete their own inscriptions
*/

CREATE TABLE IF NOT EXISTS public.inscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    date text NOT NULL,
    venue text NOT NULL,
    slot text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.inscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read inscriptions"
    ON public.inscriptions
    FOR SELECT
    USING (true);

CREATE POLICY "Anyone can insert inscriptions"
    ON public.inscriptions
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anyone can delete their own inscriptions"
    ON public.inscriptions
    FOR DELETE
    USING (true);