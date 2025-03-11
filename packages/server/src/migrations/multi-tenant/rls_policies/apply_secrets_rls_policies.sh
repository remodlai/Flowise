#!/bin/bash

# Apply RLS policies for secrets and application_credentials tables
echo "Applying RLS policies for secrets and application_credentials tables..."

# Get the directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Apply the SQL file
PGPASSWORD=Bagsisgod321! psql -h db.voksjtjrshonjadwjozt.supabase.co -p 5432 -d postgres -U postgres -f "$DIR/secrets_rls_policies.sql"

echo "RLS policies applied successfully!" 