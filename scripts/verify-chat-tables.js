import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log('🔍 Checking Chat Tables...');
    
    // Check conversations
    const { error: convError } = await supabase.from('conversations').select('id').limit(1);
    if (convError) {
        if (convError.code === '42P01') { // undefined_table
            console.error('❌ Table "conversations" DOES NOT exist.');
        } else {
            console.error('❌ Error checking "conversations":', convError.message);
        }
    } else {
        console.log('✅ Table "conversations" exists.');
    }

    // Check messages
    const { error: msgError } = await supabase.from('messages').select('id').limit(1);
    if (msgError) {
        if (msgError.code === '42P01') {
            console.error('❌ Table "messages" DOES NOT exist.');
        } else {
            console.error('❌ Error checking "messages":', msgError.message);
        }
    } else {
        console.log('✅ Table "messages" exists.');
    }

    if (convError || msgError) {
        console.log('\n⚠️  ACTION REQUIRED: Please run "supabase-chat-schema.sql" in your Supabase SQL Editor.');
        process.exit(1);
    } else {
        console.log('\n🎉 All chat tables are ready!');
        process.exit(0);
    }
}

checkTables();
