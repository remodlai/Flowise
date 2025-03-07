# Troubleshooting and Best Practices

This document provides guidance on troubleshooting common issues and best practices for the AWS Secrets to Supabase migration.

## Common Issues and Solutions

### API Key Authentication Issues

#### Issue: API Key Not Recognized

**Symptoms:**
- Requests with API keys return "Invalid authentication token" errors
- API key validation fails even though the key exists

**Possible Causes:**
1. The API key is not stored in Supabase
2. The API key format is incorrect
3. The middleware order is incorrect

**Solutions:**
1. Verify the API key exists in the Supabase `secrets` table:
   ```sql
   SELECT * FROM secrets WHERE key_id = 'your-api-key';
   ```
2. Ensure the API key is being sent correctly in the Authorization header:
   ```
   Authorization: Bearer your-api-key
   ```
3. Check the middleware order in `index.ts` to ensure the API key authentication middleware runs before the Supabase authentication middleware:
   ```typescript
   // Correct order
   app.use(authenticateApiKey);
   app.use(authenticateUser);
   ```

#### Issue: API Key Creation Fails

**Symptoms:**
- Creating a new API key returns an error
- API key is not stored in Supabase

**Possible Causes:**
1. Supabase connection issues
2. Missing environment variables
3. Insufficient permissions

**Solutions:**
1. Check the Supabase connection:
   ```typescript
   const { data, error } = await supabase.from('secrets').select('count');
   console.log('Connection test:', data, error);
   ```
2. Verify the environment variables are set correctly:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-supabase-key
   ```
3. Ensure the service role key has sufficient permissions to write to the `secrets` table.

### Credential Management Issues

#### Issue: Credential Decryption Fails

**Symptoms:**
- Unable to decrypt credentials
- Error messages about invalid encryption format

**Possible Causes:**
1. Inconsistent encryption keys
2. Mixed storage types
3. Corrupted credential data

**Solutions:**
1. Ensure the `FLOWISE_SECRETKEY_OVERWRITE` environment variable is consistent across all environments:
   ```
   FLOWISE_SECRETKEY_OVERWRITE=your-master-encryption-key
   ```
2. Check if the credential is stored in Supabase or still using the old storage method:
   ```typescript
   // UUID format indicates Supabase storage
   const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
   const isSupabaseSecret = uuidRegex.test(encryptedData);
   ```
3. If the credential is corrupted, you may need to recreate it.

#### Issue: Credential Migration Fails

**Symptoms:**
- Migration script reports errors
- Some credentials fail to migrate

**Possible Causes:**
1. AWS Secrets Manager credentials cannot be accessed
2. Corrupted credential data
3. Database connection issues

**Solutions:**
1. For AWS Secrets Manager credentials, ensure AWS credentials are configured correctly:
   ```
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key
   ```
2. Skip corrupted credentials during migration and log them for manual review.
3. Check the database connection settings:
   ```typescript
   const appDataSource = new DataSource({
       type: process.env.DATABASE_TYPE as any || 'sqlite',
       database: process.env.DATABASE_PATH || path.join(process.cwd(), 'database.sqlite'),
       // ...
   });
   ```

### Supabase Connection Issues

#### Issue: Unable to Connect to Supabase

**Symptoms:**
- Errors about connection refused or timeout
- Authentication failures

**Possible Causes:**
1. Incorrect Supabase URL or key
2. Network connectivity issues
3. Supabase service outage

**Solutions:**
1. Verify the Supabase URL and key:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-supabase-key
   ```
2. Check network connectivity to Supabase:
   ```bash
   curl -I https://your-project.supabase.co
   ```
3. Check the Supabase status page for service outages.

#### Issue: RLS Policies Blocking Access

**Symptoms:**
- Authenticated requests return empty results or permission errors
- Some users can access data while others cannot

**Possible Causes:**
1. Incorrect RLS policies
2. Missing user roles or permissions
3. JWT token issues

**Solutions:**
1. Review the RLS policies on the `secrets` table:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'secrets';
   ```
2. Check if the user has the required roles or permissions:
   ```sql
   SELECT * FROM auth.users WHERE id = 'user-id';
   ```
3. Verify the JWT token is valid and contains the expected claims:
   ```typescript
   const { data: { user } } = await supabase.auth.getUser();
   console.log('User:', user);
   ```

## Best Practices

### Security Best Practices

1. **Use Strong Encryption Keys**
   - Generate a strong, random string for the master encryption key
   - Store the key securely, not in version control
   - Rotate the key periodically

2. **Implement Least Privilege Access**
   - Use RLS policies to restrict access to secrets
   - Grant permissions only to users who need them
   - Regularly audit access to sensitive data

3. **Secure API Key Handling**
   - Never expose API keys in client-side code
   - Set appropriate expiration times for API keys
   - Implement rate limiting for API key usage

4. **Audit and Logging**
   - Log all access to secrets
   - Implement alerts for suspicious activity
   - Regularly review access logs

### Performance Best Practices

1. **Optimize Database Queries**
   - Use indexes on frequently queried columns
   - Limit the amount of data returned in queries
   - Use pagination for large result sets

2. **Implement Caching**
   - Cache frequently accessed secrets
   - Use memory caching for API keys
   - Implement TTL (Time To Live) for cached items

3. **Batch Operations**
   - Use batch operations for multiple secrets
   - Implement bulk migration for large datasets
   - Use transactions for related operations

### Operational Best Practices

1. **Environment Management**
   - Use different Supabase projects for different environments
   - Implement a consistent naming convention
   - Document environment-specific configurations

2. **Backup and Recovery**
   - Regularly backup the Supabase database
   - Test recovery procedures
   - Document backup and recovery processes

3. **Monitoring and Alerting**
   - Implement monitoring for Supabase services
   - Set up alerts for critical errors
   - Monitor API key usage and credential access

4. **Documentation**
   - Document all aspects of the secrets management system
   - Keep documentation up-to-date
   - Include examples and troubleshooting guides

## Migration Best Practices

1. **Incremental Migration**
   - Migrate one secret type at a time
   - Test thoroughly after each migration
   - Implement fallback mechanisms

2. **Validation and Verification**
   - Validate all migrated secrets
   - Verify functionality with migrated secrets
   - Compare before and after states

3. **Rollback Planning**
   - Prepare a rollback plan
   - Test rollback procedures
   - Document rollback steps

4. **Communication**
   - Communicate migration plans to all stakeholders
   - Provide updates during the migration
   - Document the migration process and outcomes

## Maintenance Tasks

### Regular Maintenance

1. **Audit Secrets**
   - Regularly review all secrets
   - Remove unused or expired secrets
   - Update documentation

2. **Update RLS Policies**
   - Review and update RLS policies
   - Test policy changes
   - Document policy updates

3. **Monitor Performance**
   - Check query performance
   - Optimize slow queries
   - Monitor resource usage

### Periodic Reviews

1. **Security Review**
   - Conduct regular security reviews
   - Test for vulnerabilities
   - Update security measures

2. **Access Review**
   - Review user access to secrets
   - Remove unnecessary permissions
   - Update access documentation

3. **Code Review**
   - Review secrets management code
   - Update deprecated methods
   - Implement improvements

## Conclusion

By following these troubleshooting guidelines and best practices, you can ensure a successful migration from AWS Secrets Manager to Supabase and maintain a secure, performant, and reliable secrets management system. Regular maintenance and periodic reviews will help keep the system running smoothly and securely. 