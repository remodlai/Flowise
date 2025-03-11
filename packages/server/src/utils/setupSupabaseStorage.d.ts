/**
 * Supabase Storage Setup Utility
 *
 * This file provides functionality to initialize and configure Supabase Storage buckets
 * with appropriate Row Level Security (RLS) policies. It creates the necessary buckets
 * if they don't exist and sets up access control policies for different user roles.
 */
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
export declare const setupSupabaseStorage: () => Promise<boolean>;
