const SupabaseModel = require('./supabaseModel');
class Quiz extends SupabaseModel { constructor() { super('quizzes'); } }
module.exports = new Quiz();
