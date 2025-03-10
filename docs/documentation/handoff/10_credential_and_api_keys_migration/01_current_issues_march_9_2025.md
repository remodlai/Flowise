# Current issues with credentials and api key storage

### **History**

We are currently in the middle of fully migrating credentials and api key storage from the legacy locations:

1. JSON (local)
2. Local DB (sqlite)
3. AWS Secrets Manager (was optional - used in production)

To fully using our Supabase-based system.  We have completed the functional changes to ensure that encryption of all credentials and API keys use our [Platform Settings encryption key](../09_encryption_key_migration.md), that is now stored in Supabase, thus enabling a consistent key to use for all hashing and encryption
