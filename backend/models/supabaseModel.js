const supabase = require('../config/supabase');

/**
 * Basic helper functions to mimic Mongoose behavior in Supabase (PostgreSQL)
 */
class SupabaseModel {
  constructor(tableName) {
    this.table = tableName;
  }

  async create(data) {
    const { data: inserted, error } = await supabase
      .from(this.table)
      .insert([data])
      .select()
      .single();

    if (error) throw new Error(`[Supabase Error] ${error.message}`);
    
    // In SQL, Postgres traditionally uses 'id' instead of '_id'.
    // We'll normalize to '_id' to stay compatible with existing frontend code.
    return { ...inserted, _id: inserted.id || inserted._id };
  }

  async find(query = {}, options = {}) {
    let q = supabase.from(this.table).select('*');

    for (const key in query) {
      const val = query[key];
      if (typeof val === 'object' && val !== null && val.$in) {
        q = q.in(key, val.$in);
      } else {
        q = q.eq(key, val);
      }
    }

    if (options.sort) {
      for (const field in options.sort) {
        q = q.order(field, { ascending: options.sort[field] !== -1 });
      }
    }

    if (options.limit) q = q.limit(options.limit);

    const { data, error } = await q;
    if (error) throw new Error(`[Supabase Error] ${error.message}`);
    
    return (data || []).map(item => ({ ...item, _id: item.id || item._id }));
  }

  async findOne(query) {
    const results = await this.find(query, { limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  async findById(id) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(`[Supabase Error] ${error.message}`);
    return data ? { ...data, _id: data.id || data._id } : null;
  }

  async findByIdAndUpdate(id, data, options = {}) {
    const { data: updated, error } = await supabase
      .from(this.table)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`[Supabase Error] ${error.message}`);
    return { ...updated, _id: updated.id || updated._id };
  }

  async findOneAndUpdate(query, data, options = {}) {
    const existing = await this.findOne(query);
    if (existing) {
      return this.findByIdAndUpdate(existing._id, data, options);
    } else if (options.upsert) {
      return this.create({ ...query, ...data });
    }
    return null;
  }

  async countDocuments(query = {}) {
    let q = supabase.from(this.table).select('*', { count: 'exact', head: true });
    for (const key in query) {
        q = q.eq(key, query[key]);
    }
    const { count, error } = await q;
    if (error) throw new Error(`[Supabase Error] ${error.message}`);
    return count;
  }
  
  async addToSet(id, field, value) {
    // In SQL/Supabase, adding to an array column logic
    const existingDoc = await this.findById(id);
    if (!existingDoc) return null;
    
    const existingArray = existingDoc[field] || [];
    if (!existingArray.includes(value)) {
        return this.findByIdAndUpdate(id, { [field]: [...existingArray, value] });
    }
    return existingDoc;
  }
}

module.exports = SupabaseModel;
