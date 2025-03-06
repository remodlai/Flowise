import { config } from 'dotenv'
import path from 'path'
import { exec } from 'child_process'

// Load environment variables from .env file
config({ path: path.resolve(__dirname, '../../.env') })

// Check if required environment variables are set
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in the .env file')
    process.exit(1)
}

console.log('Running credential migration script...')

// Run the migration script
exec('npx ts-node src/scripts/migrateCredentials.ts', (error, stdout, stderr) => {
    if (error) {
        console.error(`Error: ${error.message}`)
        return
    }
    if (stderr) {
        console.error(`Stderr: ${stderr}`)
        return
    }
    console.log(stdout)
}) 