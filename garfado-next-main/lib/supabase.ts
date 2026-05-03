import { createClient } from '@supabase/supabase-js'

const SB_URL = 'https://psrlilbclyffmgadgbfg.supabase.co'
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzcmxpbGJjbHlmZm1nYWRnYmZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMzI2NjAsImV4cCI6MjA5MTcwODY2MH0.3gsNRvNscf6NmAbR1OuOtTq2VlqSYLhgOLKU-92YNBU'

export const supabase = createClient(SB_URL, SB_KEY)
