-- Insert buckets into storage.buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('property-media', 'property-media', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-docs', 'verification-docs', false);

-- Set up Storage RLS Policies
-- property-media is public to read
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'property-media' );

-- Any authenticated user can upload to property-media (the app enforces property ownership before uploading)
CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'property-media' AND auth.role() = 'authenticated' );

-- verification-docs is private. Users can insert their own docs.
-- Here we assume the file path will be formatted like: userId/filename.ext
CREATE POLICY "Users can upload their own verification docs"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'verification-docs' AND auth.uid()::text = (storage.foldername(name))[1] );

-- Service role bypasses RLS automatically, so admin-verify and signed urls work without extra policies.
