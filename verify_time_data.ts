import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';

// Load env vars
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTimeData() {
    console.log('--- Verifying Time Data ---');
    const now = new Date(); // Today is Feb 16, 2026 local time according to system prompt
    // We want to simulate the app's logic for February 2026

    // Hardcode Feb 2026 for testing as per user screenshot
    const testDate = new Date('2026-02-16T12:00:00');

    const start = format(startOfMonth(testDate), 'yyyy-MM-dd');
    const end = format(endOfMonth(testDate), 'yyyy-MM-dd');

    console.log(`Checking period: ${start} to ${end}`);

    // 1. Fetch entries using simple select
    const { data: allEntries, error: allureError } = await supabase
        .from('time_entries')
        .select('*');

    if (allureError) {
        console.error('Error fetching ALL entries:', allureError);
    } else {
        console.log(`Total entries in DB: ${allEntries?.length}`);
        if (allEntries?.length > 0) {
            console.log('Sample entry dates:', allEntries.map(e => e.date).slice(0, 5));
        }
    }

    // 2. Fetch using App Logic (GTE/LTE)
    const { data: monthEntries, error: monthError } = await supabase
        .from('time_entries')
        .select('*')
        .gte('date', start)
        .lte('date', end);

    if (monthError) {
        console.error('Error fetching MONTH entries:', monthError);
    } else {
        console.log(`Entries in ${start} - ${end}: ${monthEntries?.length}`);
        if (monthEntries?.length === 0) {
            console.warn('!!! No entries found for this month, but user claimed to add one today !!!');
        } else {
            console.log('Entries found:', monthEntries);
        }
    }

    // 3. User Check (if auth is involved)
    // We are using service key or anon key? usually anon. RLS might hide data if we are not logged in.
    // Setting up a dummy session is hard in script without password.
    // BUT: The user says "18 hours" are visible in reporting.
    // Let's check Reporting Logic for 2026

    const { data: yearEntries, error: yearError } = await supabase
        .from('time_entries')
        .select('*')
        .gte('date', '2026-01-01')
        .lte('date', '2026-12-31');

    if (yearError) {
        console.error('Error fetching YEAR entries:', yearError);
    } else {
        console.log(`Entries in 2026: ${yearEntries?.length}`);
        yearEntries?.forEach(e => {
            console.log(` - ID: ${e.id}, Date: ${e.date}, Duration: ${e.duration}, Type: ${e.type}`);
        });
    }
}

verifyTimeData();
