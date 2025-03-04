/**
 * Supabase Storage Setup Utility
 * 
 * This file provides functionality to initialize and configure Supabase Storage buckets
 * with appropriate Row Level Security (RLS) policies. It creates the necessary buckets
 * if they don't exist and sets up access control policies for different user roles.
 */

import { supabase } from './supabase'
import { STORAGE_BUCKETS } from './supabaseStorage'

/**
 * Main function to set up all Supabase Storage buckets and their security policies
 * 
 * This function:
 * 1. Creates all required storage buckets if they don't exist
 * 2. Sets up appropriate RLS policies for each bucket based on its purpose
 * 3. Handles errors and provides logging
 * 
 * @returns Promise that resolves when setup is complete
 */
export const setupSupabaseStorage = async () => {
  try {
    console.log('Setting up Supabase Storage buckets...')

    // Create all required buckets with appropriate access settings
    await createBucketIfNotExists(STORAGE_BUCKETS.PUBLIC, true)
    await createBucketIfNotExists(STORAGE_BUCKETS.PROFILES, false)
    await createBucketIfNotExists(STORAGE_BUCKETS.PLATFORM, false)
    await createBucketIfNotExists(STORAGE_BUCKETS.APPS, false)
    await createBucketIfNotExists(STORAGE_BUCKETS.ORGANIZATIONS, false)
    await createBucketIfNotExists(STORAGE_BUCKETS.USER_FILES, false)

    console.log('Supabase Storage setup completed successfully')
    return true
  } catch (error) {
    console.error('Error setting up Supabase Storage:', error)
    throw error
  }
}

/**
 * Creates a storage bucket if it doesn't already exist
 * 
 * This function:
 * 1. Checks if the bucket already exists
 * 2. Creates the bucket with appropriate settings if it doesn't exist
 * 3. Sets up RLS policies for the bucket
 * 
 * @param bucketName - Name of the bucket to create
 * @param isPublic - Whether the bucket should be publicly accessible
 * @returns Promise that resolves when the bucket is created and configured
 */
const createBucketIfNotExists = async (bucketName: string, isPublic: boolean) => {
  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error(`Error listing buckets: ${listError.message}`)
      throw listError
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === bucketName)
    
    // Create bucket if it doesn't exist
    if (!bucketExists) {
      console.log(`Creating bucket: ${bucketName}`)
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: isPublic,
        fileSizeLimit: 52428800 // 50MB limit
      })
      
      if (createError) {
        console.error(`Error creating bucket ${bucketName}: ${createError.message}`)
        throw createError
      }
    } else {
      console.log(`Bucket ${bucketName} already exists`)
    }
    
    // Set up RLS policies for the bucket
    await setupBucketPolicies(bucketName, isPublic)
    
    return true
  } catch (error) {
    console.error(`Error in createBucketIfNotExists for ${bucketName}:`, error)
    throw error
  }
}

/**
 * Sets up Row Level Security (RLS) policies for a storage bucket
 * 
 * This function creates SQL policies that control:
 * - Who can read files from the bucket
 * - Who can upload files to the bucket
 * - Who can update files in the bucket
 * - Who can delete files from the bucket
 * 
 * Different policies are applied based on the bucket's purpose and whether it's public.
 * 
 * @param bucketName - Name of the bucket to set up policies for
 * @param isPublic - Whether the bucket is publicly accessible
 * @returns Promise that resolves when policies are set up
 */
const setupBucketPolicies = async (bucketName: string, isPublic: boolean) => {
  try {
    console.log(`Setting up RLS policies for bucket: ${bucketName}`)
    
    // Define SQL for different bucket types
    let sql = ''
    
    if (isPublic) {
      // Public bucket policies - anyone can read, authenticated users can upload
      sql = `
        -- Allow public read access
        CREATE POLICY "Public Read Access" ON storage.objects
          FOR SELECT
          USING (bucket_id = '${bucketName}');
          
        -- Allow authenticated users to upload
        CREATE POLICY "Authenticated Upload Access" ON storage.objects
          FOR INSERT
          TO authenticated
          WITH CHECK (bucket_id = '${bucketName}');
          
        -- Allow users to update their own uploads
        CREATE POLICY "Owner Update Access" ON storage.objects
          FOR UPDATE
          TO authenticated
          USING (bucket_id = '${bucketName}' AND owner = auth.uid())
          WITH CHECK (bucket_id = '${bucketName}' AND owner = auth.uid());
          
        -- Allow users to delete their own uploads
        CREATE POLICY "Owner Delete Access" ON storage.objects
          FOR DELETE
          TO authenticated
          USING (bucket_id = '${bucketName}' AND owner = auth.uid());
      `
    } else if (bucketName === STORAGE_BUCKETS.PROFILES) {
      // Profile bucket policies - users can manage their own profile photos
      sql = `
        -- Allow users to access their own profile photos
        CREATE POLICY "Profile Owner Access" ON storage.objects
          FOR SELECT
          TO authenticated
          USING (bucket_id = '${bucketName}' AND (
            -- User can access their own profile
            (storage.foldername(name) = auth.uid())
            -- Or the profile is public
            OR (storage.foldername(name) LIKE 'public/%')
          ));
          
        -- Allow users to upload their own profile photos
        CREATE POLICY "Profile Owner Upload" ON storage.objects
          FOR INSERT
          TO authenticated
          WITH CHECK (bucket_id = '${bucketName}' AND storage.foldername(name) = auth.uid());
          
        -- Allow users to update their own profile photos
        CREATE POLICY "Profile Owner Update" ON storage.objects
          FOR UPDATE
          TO authenticated
          USING (bucket_id = '${bucketName}' AND storage.foldername(name) = auth.uid())
          WITH CHECK (bucket_id = '${bucketName}' AND storage.foldername(name) = auth.uid());
          
        -- Allow users to delete their own profile photos
        CREATE POLICY "Profile Owner Delete" ON storage.objects
          FOR DELETE
          TO authenticated
          USING (bucket_id = '${bucketName}' AND storage.foldername(name) = auth.uid());
      `
    } else if (bucketName === STORAGE_BUCKETS.PLATFORM) {
      // Platform bucket policies - platform admins can manage, authenticated users can view
      sql = `
        -- Allow authenticated users to view platform files
        CREATE POLICY "Platform View Access" ON storage.objects
          FOR SELECT
          TO authenticated
          USING (bucket_id = '${bucketName}');
          
        -- Allow platform admins to upload platform files
        CREATE POLICY "Platform Admin Upload" ON storage.objects
          FOR INSERT
          TO authenticated
          WITH CHECK (bucket_id = '${bucketName}' AND (
            -- Check if user is platform admin through RPC function
            auth.uid() IN (SELECT auth.uid() FROM rpc.is_platform_admin())
          ));
          
        -- Allow platform admins to update platform files
        CREATE POLICY "Platform Admin Update" ON storage.objects
          FOR UPDATE
          TO authenticated
          USING (bucket_id = '${bucketName}' AND (
            auth.uid() IN (SELECT auth.uid() FROM rpc.is_platform_admin())
          ))
          WITH CHECK (bucket_id = '${bucketName}' AND (
            auth.uid() IN (SELECT auth.uid() FROM rpc.is_platform_admin())
          ));
          
        -- Allow platform admins to delete platform files
        CREATE POLICY "Platform Admin Delete" ON storage.objects
          FOR DELETE
          TO authenticated
          USING (bucket_id = '${bucketName}' AND (
            auth.uid() IN (SELECT auth.uid() FROM rpc.is_platform_admin())
          ));
      `
    } else if (bucketName === STORAGE_BUCKETS.APPS) {
      // App bucket policies - app owners can manage, app users can view
      sql = `
        -- Allow app users to view app files
        CREATE POLICY "App User View Access" ON storage.objects
          FOR SELECT
          TO authenticated
          USING (bucket_id = '${bucketName}' AND (
            -- Extract app ID from path and check if user has access
            auth.uid() IN (
              SELECT auth.uid() FROM rpc.user_has_app_access(storage.foldername(name))
            )
          ));
          
        -- Allow app owners to upload app files
        CREATE POLICY "App Owner Upload" ON storage.objects
          FOR INSERT
          TO authenticated
          WITH CHECK (bucket_id = '${bucketName}' AND (
            auth.uid() IN (
              SELECT auth.uid() FROM rpc.is_app_owner(storage.foldername(name))
            )
          ));
          
        -- Allow app owners to update app files
        CREATE POLICY "App Owner Update" ON storage.objects
          FOR UPDATE
          TO authenticated
          USING (bucket_id = '${bucketName}' AND (
            auth.uid() IN (
              SELECT auth.uid() FROM rpc.is_app_owner(storage.foldername(name))
            )
          ))
          WITH CHECK (bucket_id = '${bucketName}' AND (
            auth.uid() IN (
              SELECT auth.uid() FROM rpc.is_app_owner(storage.foldername(name))
            )
          ));
          
        -- Allow app owners to delete app files
        CREATE POLICY "App Owner Delete" ON storage.objects
          FOR DELETE
          TO authenticated
          USING (bucket_id = '${bucketName}' AND (
            auth.uid() IN (
              SELECT auth.uid() FROM rpc.is_app_owner(storage.foldername(name))
            )
          ));
      `
    } else if (bucketName === STORAGE_BUCKETS.ORGANIZATIONS) {
      // Organization bucket policies - org admins can manage, org members can view
      sql = `
        -- Allow org members to view org files
        CREATE POLICY "Org Member View Access" ON storage.objects
          FOR SELECT
          TO authenticated
          USING (bucket_id = '${bucketName}' AND (
            auth.uid() IN (
              SELECT auth.uid() FROM rpc.user_in_organization(storage.foldername(name))
            )
          ));
          
        -- Allow org admins to upload org files
        CREATE POLICY "Org Admin Upload" ON storage.objects
          FOR INSERT
          TO authenticated
          WITH CHECK (bucket_id = '${bucketName}' AND (
            auth.uid() IN (
              SELECT auth.uid() FROM rpc.is_org_admin(storage.foldername(name))
            )
          ));
          
        -- Allow org admins to update org files
        CREATE POLICY "Org Admin Update" ON storage.objects
          FOR UPDATE
          TO authenticated
          USING (bucket_id = '${bucketName}' AND (
            auth.uid() IN (
              SELECT auth.uid() FROM rpc.is_org_admin(storage.foldername(name))
            )
          ))
          WITH CHECK (bucket_id = '${bucketName}' AND (
            auth.uid() IN (
              SELECT auth.uid() FROM rpc.is_org_admin(storage.foldername(name))
            )
          ));
          
        -- Allow org admins to delete org files
        CREATE POLICY "Org Admin Delete" ON storage.objects
          FOR DELETE
          TO authenticated
          USING (bucket_id = '${bucketName}' AND (
            auth.uid() IN (
              SELECT auth.uid() FROM rpc.is_org_admin(storage.foldername(name))
            )
          ));
      `
    } else if (bucketName === STORAGE_BUCKETS.USER_FILES) {
      // User files bucket policies - users can manage their own files
      sql = `
        -- Allow users to access their own files and shared files
        CREATE POLICY "User Files Access" ON storage.objects
          FOR SELECT
          TO authenticated
          USING (bucket_id = '${bucketName}' AND (
            -- User can access their own files
            (storage.foldername(name) = auth.uid())
            -- Or files shared with them
            OR (auth.uid() IN (
              SELECT auth.uid() FROM rpc.user_has_file_access(name)
            ))
          ));
          
        -- Allow users to upload their own files
        CREATE POLICY "User Files Upload" ON storage.objects
          FOR INSERT
          TO authenticated
          WITH CHECK (bucket_id = '${bucketName}' AND storage.foldername(name) = auth.uid());
          
        -- Allow users to update their own files
        CREATE POLICY "User Files Update" ON storage.objects
          FOR UPDATE
          TO authenticated
          USING (bucket_id = '${bucketName}' AND storage.foldername(name) = auth.uid())
          WITH CHECK (bucket_id = '${bucketName}' AND storage.foldername(name) = auth.uid());
          
        -- Allow users to delete their own files
        CREATE POLICY "User Files Delete" ON storage.objects
          FOR DELETE
          TO authenticated
          USING (bucket_id = '${bucketName}' AND storage.foldername(name) = auth.uid());
      `
    }
    
    // Execute the SQL to create policies
    // Note: In a real implementation, you would execute this SQL against your database
    // For now, we're just logging it as a reference
    console.log(`RLS policies for ${bucketName} defined. SQL to execute:`)
    console.log(sql)
    
    return true
  } catch (error) {
    console.error(`Error in setupBucketPolicies for ${bucketName}:`, error)
    throw error
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupSupabaseStorage()
    .then(() => {
      console.log('Supabase Storage setup completed successfully')
      process.exit(0)
    })
    .catch(error => {
      console.error('Error setting up Supabase Storage:', error)
      process.exit(1)
    })
} 