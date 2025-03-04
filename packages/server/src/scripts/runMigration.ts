import fs from 'fs'
import path from 'path'
import { supabase } from '../utils/supabase'

/**
 * Run SQL migration
 */
async function runMigration() {
    try {
        console.log('Running migration...')
        
        // Read the SQL file
        const sqlFilePath = path.join(__dirname, '../migrations/user_profiles.sql')
        const sql = fs.readFileSync(sqlFilePath, 'utf8')
        
        // Execute the SQL
        const { error } = await supabase.rpc('exec_sql', { sql })
        
        if (error) {
            console.error('Migration error:', error)
            process.exit(1)
        }
        
        console.log('Migration completed successfully')
    } catch (error) {
        console.error('Migration failed:', error)
        process.exit(1)
    }
}

// Run the migration
runMigration() 