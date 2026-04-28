const SupabaseModel = require('./supabaseModel');
class Progress extends SupabaseModel { constructor() { super('progress'); } }
module.exports = new Progress();
