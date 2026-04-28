const supabase = require('../config/supabase');

/**
 * Basic helper functions to mimic Mongoose behavior in Supabase (PostgreSQL)
 */
class SupabaseModel {
  constructor(tableName) {
    this.table = tableName;
  }

  _wrap(data) {
    if (!data) return null;
    if (Array.isArray(data)) return data.map(d => this._wrap(d));
    return new Document(data, this);
  }

  _processUpdateData(data) {
    let finalUpdate = {};
    if (!Object.keys(data).some(k => k.startsWith('$'))) return data;

    if (data.$set) finalUpdate = { ...finalUpdate, ...data.$set };
    for (const key in data) {
      if (!key.startsWith('$')) finalUpdate[key] = data[key];
    }
    return finalUpdate;
  }

  async create(data) {
    const { data: inserted, error } = await supabase
      .from(this.table)
      .insert([data])
      .select()
      .single();

    if (error) {
      const err = new Error(`[Supabase Error] ${error.message}`);
      err.code = error.code;
      throw err;
    }
    return this._wrap(inserted);
  }

  find(query = {}, options = {}) {
    return new SupabaseQueryBuilder(this.table, query, options, this);
  }

  async findOne(query) {
    return this.find(query).limit(1).then(results => results.length > 0 ? results[0] : null);
  }

  async findById(id) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      const err = new Error(`[Supabase Error] ${error.message}`);
      err.code = error.code;
      throw err;
    }
    return this._wrap(data);
  }

  async findByIdAndUpdate(id, data, options = {}) {
    const updateData = this._processUpdateData(data);
    const { data: updated, error } = await supabase
      .from(this.table)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      const err = new Error(`[Supabase Error] ${error.message}`);
      err.code = error.code;
      throw err;
    }
    return this._wrap(updated);
  }

  async findOneAndUpdate(query, data, options = {}) {
    const existing = await this.findOne(query);
    if (existing) {
      return this.findByIdAndUpdate(existing._id, data, options);
    } else if (options.upsert) {
      const createData = { ...query, ...this._processUpdateData(data) };
      return this.create(createData);
    }
    return null;
  }

  async countDocuments(query = {}) {
    let q = supabase.from(this.table).select('*', { count: 'exact', head: true });
    for (const key in query) q = q.eq(key, query[key]);
    const { count, error } = await q;
    if (error) throw new Error(`[Supabase Error] ${error.message}`);
    return count;
  }

  async deleteOne(query) {
      const existing = await this.findOne(query);
      if (!existing) return null;
      const { error } = await supabase.from(this.table).delete().eq('id', existing._id);
      if (error) throw new Error(`[Supabase Error] ${error.message}`);
      return existing;
  }
}

class Document {
  constructor(data, model) {
    Object.assign(this, data);
    this._id = data.id || data._id;
    this._model = model;
  }

  async save() {
    const data = { ...this };
    delete data._id;
    delete data._model;
    delete data.id;
    return this._model.findByIdAndUpdate(this._id, data);
  }

  toObject() {
    const obj = { ...this };
    delete obj._model;
    return obj;
  }
}

class SupabaseQueryBuilder {
  constructor(table, query, options = {}, model) {
    this.table = table;
    this.query = query;
    this.options = { ...options };
    this.model = model;
  }

  sort(sortObj) { this.options.sort = sortObj; return this; }
  limit(num) { this.options.limit = num; return this; }
  skip(num) { this.options.skip = num; return this; }
  populate(field) { return this; } // Placeholder

  async then(resolve, reject) {
    try {
      let q = supabase.from(this.table).select('*');
      for (const key in this.query) {
        const val = this.query[key];
        if (typeof val === 'object' && val !== null) {
          if (val.$in) q = q.in(key, val.$in);
          else if (val.$gt) q = q.gt(key, val.$gt);
          else if (val.$lt) q = q.lt(key, val.$lt);
          else if (val.$gte) q = q.gte(key, val.$gte);
          else if (val.$lte) q = q.lte(key, val.$lte);
        } else {
          q = q.eq(key, val);
        }
      }
      if (this.options.sort) {
        for (const field in this.options.sort) {
          q = q.order(field, { ascending: this.options.sort[field] !== -1 });
        }
      }
      if (this.options.limit) {
        const from = this.options.skip || 0;
        const to = from + this.options.limit - 1;
        q = q.range(from, to);
      } else if (this.options.skip) {
        q = q.range(this.options.skip, 10000);
      }
      const { data, error } = await q;
      if (error) {
        const err = new Error(`[Supabase Error] ${error.message}`);
        err.code = error.code;
        throw err;
      }
      resolve(this.model._wrap(data || []));
    } catch (err) {
      if (reject) reject(err);
      else throw err;
    }
  }
}

module.exports = SupabaseModel;
