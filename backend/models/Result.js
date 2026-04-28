const SupabaseModel = require('./supabaseModel');
class Result extends SupabaseModel { constructor() { super('results'); } }
module.exports = new Result();
