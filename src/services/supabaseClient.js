import { createClient } from '@supabase/supabase-js'

//Here are my details URL and APIKEY
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY
//Create customer
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY,{
    auth:{
        persistSession: false,
        autoRefreshToken: false,
    }
})
