const SupabaseModel = require('./supabaseModel');

class StudentProfile extends SupabaseModel {
  constructor() {
    super('student_profiles');
  }

  async create(data) {
    return super.create({
      userId: data.userId,
      varkScores: {
        visual: 0,
        auditory: 0,
        reading: 0,
        kinesthetic: 0,
      },
      learningStyle: null,
      currentDifficulty: 1,
      bookmarks: [],
      notes: [],
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      totalTimeSpent: 0,
      masteryScores: {},
    });
  }
}

module.exports = new StudentProfile();
