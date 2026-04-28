-- AMEP Supabase (PostgreSQL) Initial Schema Setup
-- Run these in your Supabase SQL Editor

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'student',
  grade TEXT,
  children UUID[] DEFAULT '{}',
  "parentId" UUID REFERENCES users(id),
  avatar TEXT DEFAULT '',
  "isActive" BOOLEAN DEFAULT true,
  "lastLogin" TIMESTAMP WITH TIME ZONE,
  "learningStyle" TEXT,
  "onboardingComplete" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Student Profiles
CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
  "varkScores" JSONB DEFAULT '{"visual":0, "auditory":0, "reading":0, "kinesthetic":0}',
  "learningStyle" TEXT,
  "currentDifficulty" INTEGER DEFAULT 1,
  bookmarks JSONB DEFAULT '[]',
  notes JSONB DEFAULT '[]',
  "currentStreak" INTEGER DEFAULT 0,
  "longestStreak" INTEGER DEFAULT 0,
  "lastActiveDate" TIMESTAMP WITH TIME ZONE,
  "totalTimeSpent" INTEGER DEFAULT 0,
  "masteryScores" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Topics
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  grade TEXT,
  difficulty INTEGER DEFAULT 1,
  "estimatedTime" INTEGER,
  tags TEXT[],
  "order" INTEGER DEFAULT 0,
  content JSONB DEFAULT '{}', -- Maps learningStyle -> content
  "isPublished" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Quizzes
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "topicId" UUID REFERENCES topics(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  subject TEXT,
  grade TEXT,
  difficulty INTEGER DEFAULT 1,
  "timeLimit" INTEGER DEFAULT 30,
  "passingScore" INTEGER DEFAULT 60,
  questions JSONB DEFAULT '[]',
  "isPublished" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Results
CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId" UUID REFERENCES users(id) ON DELETE CASCADE,
  "quizId" UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  "topicId" UUID REFERENCES topics(id) ON DELETE SET NULL,
  subject TEXT,
  score INTEGER,
  "correctAnswers" INTEGER,
  "totalQuestions" INTEGER,
  "timeTaken" INTEGER,
  "attemptNumber" INTEGER,
  "difficultyLevel" INTEGER,
  answers JSONB DEFAULT '[]',
  passed BOOLEAN,
  "masteryScore" INTEGER,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Progress
CREATE TABLE IF NOT EXISTS progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId" UUID REFERENCES users(id) ON DELETE CASCADE,
  "topicId" UUID REFERENCES topics(id) ON DELETE CASCADE,
  subject TEXT,
  status TEXT DEFAULT 'not_started',
  "completionPercentage" INTEGER DEFAULT 0,
  "timeSpent" INTEGER DEFAULT 0,
  "masteryScore" INTEGER DEFAULT 0,
  "startedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "completedAt" TIMESTAMP WITH TIME ZONE,
  "lastAccessedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "revisitCount" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "recipientId" UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT,
  "isRead" BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
