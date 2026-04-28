const SupabaseModel = require('./supabaseModel');
const bcrypt = require('bcryptjs');

class User extends SupabaseModel {
  constructor() {
    super('users'); // Table name
  }

  /**
   * Override create to include password hashing
   */
  async create(data) {
    const { password, ...otherData } = data;
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await super.create({
      ...otherData,
      password: hashedPassword,
      role: data.role || 'student',
      children: [],
      parentId: null,
      avatar: '',
      isActive: true,
      lastLogin: null,
      learningStyle: null,
      onboardingComplete: false,
    });
    return newUser;
  }

  /**
   * Instance helper for bcrypt comparison
   */
  async matchPassword(enteredPassword, storedHash) {
    return await bcrypt.compare(enteredPassword, storedHash);
  }

  /**
   * Same as findOne in base class
   */
  async findOne(query) {
    return super.findOne(query);
  }
}

module.exports = new User();
