require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function makeAdmin() {
  console.log("Setting all users to admin in user_memory...");
  const { data, error } = await supabase
    .from('user_memory')
    .update({ is_admin: true })
    .not('user_id', 'is', null)
    .select();

  if (error) {
    console.error('Error updating users:', error);
  } else {
    console.log(`Successfully made ${data.length} user(s) admin!`);
  }
}

makeAdmin();
