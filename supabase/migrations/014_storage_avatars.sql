-- Create "avatars" storage bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Set up security policies for "avatars" bucket
DO $$ 
BEGIN
  BEGIN
    create policy "Avatar images are publicly accessible." on storage.objects for select using ( bucket_id = 'avatars' );
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    create policy "Anyone can upload an avatar." on storage.objects for insert with check ( bucket_id = 'avatars' );
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    create policy "Users can update their own avatar." on storage.objects for update using ( auth.uid() = owner ) with check ( bucket_id = 'avatars' );
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    create policy "Users can delete their own avatar." on storage.objects for delete using ( auth.uid() = owner );
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
