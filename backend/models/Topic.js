const SupabaseModel = require('./supabaseModel');
class Topic extends SupabaseModel { constructor() { super('topics'); } }
module.exports = new Topic();
