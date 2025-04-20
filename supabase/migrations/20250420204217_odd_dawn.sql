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
    - Add policies if they don't exist:
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

-- Create policies if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'inscriptions' 
        AND policyname = 'Anyone can read inscriptions'
    ) THEN
        CREATE POLICY "Anyone can read inscriptions"
            ON public.inscriptions
            FOR SELECT
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'inscriptions' 
        AND policyname = 'Anyone can insert inscriptions'
    ) THEN
        CREATE POLICY "Anyone can insert inscriptions"
            ON public.inscriptions
            FOR INSERT
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'inscriptions' 
        AND policyname = 'Anyone can delete their own inscriptions'
    ) THEN
        CREATE POLICY "Anyone can delete their own inscriptions"
            ON public.inscriptions
            FOR DELETE
            USING (true);
    END IF;
END $$;