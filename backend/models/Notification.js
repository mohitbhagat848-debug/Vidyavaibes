const SupabaseModel = require('./supabaseModel');
class Notification extends SupabaseModel { constructor() { super('notifications'); } }
module.exports = new Notification();
