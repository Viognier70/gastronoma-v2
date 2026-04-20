import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mkyncggbzfdnawkjwqhm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1reW5jZ2diemZkbmF3a2p3cWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2OTE5MzUsImV4cCI6MjA5MjI2NzkzNX0.MZQfWhfNETgut9t24IGnC-oyeqiqivRkQdFMsofEIsA'

export const supabase = createClient(supabaseUrl, supabaseKey)