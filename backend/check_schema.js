require('dotenv').config();
const supabase = require('./config/supabase');

(async () => {
  // Check existing columns
  const { data, error } = await supabase.from('results').select('*').limit(1);
  if (error) {
    console.log('Query Error:', error.message);
  } else {
    console.log('Existing columns:', data.length > 0 ? Object.keys(data[0]) : 'table is empty');
  }

  // Try adding missing columns
  console.log('\nAdding missing columns to results table...');
  
  // Add dayNumber column
  const r1 = await supabase.rpc('execute_sql', { query: 'ALTER TABLE results ADD COLUMN IF NOT EXISTS "dayNumber" INTEGER' });
  console.log('dayNumber:', r1.error ? r1.error.message : 'OK');

  // Add topic column  
  const r2 = await supabase.rpc('execute_sql', { query: 'ALTER TABLE results ADD COLUMN IF NOT EXISTS topic TEXT' });
  console.log('topic:', r2.error ? r2.error.message : 'OK');

  // Add courseId column
  const r3 = await supabase.rpc('execute_sql', { query: 'ALTER TABLE results ADD COLUMN IF NOT EXISTS "courseId" TEXT' });
  console.log('courseId:', r3.error ? r3.error.message : 'OK');

  // Add quizScore column
  const r4 = await supabase.rpc('execute_sql', { query: 'ALTER TABLE results ADD COLUMN IF NOT EXISTS "quizScore" INTEGER' });
  console.log('quizScore:', r4.error ? r4.error.message : 'OK');

  // Make quizId nullable (drop FK constraint if exists)
  const r5 = await supabase.rpc('execute_sql', { query: 'ALTER TABLE results ALTER COLUMN "quizId" DROP NOT NULL' });
  console.log('quizId nullable:', r5.error ? r5.error.message : 'OK');

  process.exit(0);
})();
