/**
 * AMEP — Basic Python 7-Day Course Data
 * Contains: day metadata, YouTube video IDs, quiz questions per day.
 */
// ── Progress Helpers ──────────────────────────────────────────────────────────
const PROGRESS_KEY = 'amep_python_progress';
const API_BASE = (window.AMEP_CONFIG?.API_URL) || 'http://127.0.0.1:5000/api';

function getCourseProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveDayProgress(day, quizScore, totalQuestions) {
  const progress = getCourseProgress();
  const pct = Math.round((quizScore / totalQuestions) * 100);
  progress[`day_${day}`] = {
    completed: true,
    quizScore,
    totalQuestions,
    scorePercent: pct,
    completedAt: new Date().toISOString()
  };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  updateAnalytics(progress);

  // Sync to backend (non-blocking)
  syncProgressToBackend(day, quizScore, totalQuestions, pct).catch(() => {});
}

function getDayProgress(day) {
  const progress = getCourseProgress();
  return progress[`day_${day}`] || null;
}

function getCompletedDays() {
  const progress = getCourseProgress();
  return Object.keys(progress).filter(k => progress[k].completed).length;
}

function getOverallScore() {
  const progress = getCourseProgress();
  const scores = Object.values(progress).map(d => d.scorePercent).filter(Boolean);
  if (!scores.length) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function updateAnalytics(progress) {
  const completed = Object.keys(progress).filter(k => progress[k].completed).length;
  const scores = Object.values(progress).map(d => d.scorePercent).filter(Boolean);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const analytics = JSON.parse(localStorage.getItem('amep_analytics') || '{}');
  analytics.python_course = {
    completedDays: completed,
    totalDays: 7,
    completionPercent: Math.round((completed / 7) * 100),
    averageQuizScore: avgScore,
    lastUpdated: new Date().toISOString(),
    dayScores: progress
  };
  localStorage.setItem('amep_analytics', JSON.stringify(analytics));
}

// ══════════════════════════════════════════════════════════════════════════════
// PYTHON_COURSE must be defined BEFORE the sync functions that reference it.
// ══════════════════════════════════════════════════════════════════════════════
const PYTHON_COURSE = {
  id: 'basic_python_7day',
  title: 'Basic Python',
  subtitle: '7-Day Crash Course',
  description: 'Learn Python from scratch in 7 days. Each day covers a key concept with a video lesson and a 5-question quiz to test your understanding.',
  totalDays: 7,
  icon: 'code',
  color: 'from-yellow-500 to-orange-500',
  badge: 'Beginner',

  days: [
    {
      day: 1,
      title: 'Variables & Data Types',
      description: 'Learn how to store data using variables and explore Python\'s core data types: int, float, str, and bool.',
      videoId: 'kqtD5dpn9C8', // Python Tutorial for Beginners - Corey Schafer
      duration: '48 min',
      topics: ['Variables & Assignment', 'int, float, str, bool', 'print() and input()', 'Type conversion'],
      quiz: [
        {
          q: 'Which of the following is a valid Python variable name?',
          options: ['1variable', '_my_var', 'my-variable', 'class'],
          answer: 1
        },
        {
          q: 'What does type(3.14) return?',
          options: ["<class 'int'>", "<class 'float'>", "<class 'str'>", "<class 'number'>"],
          answer: 1
        },
        {
          q: 'What is stored in x after: x = "Hello" + " " + "World"?',
          options: ['"HelloWorld"', '"Hello World"', 'Error', 'None'],
          answer: 1
        },
        {
          q: 'Which data type stores True or False values?',
          options: ['int', 'str', 'bool', 'float'],
          answer: 2
        },
        {
          q: 'How do you write a single-line comment in Python?',
          options: ['// comment', '/* comment */', '# comment', '-- comment'],
answer: 2
        }
      ]
    },
{
  day: 2,
    title: 'Control Flow: if/else & Loops',
      description: 'Master conditional logic and loops to make your programs dynamic and responsive.',
        videoId: 'DZwmZ8Usvnk', // Corey Schafer – Conditionals and Booleans
          duration: '42 min',
            topics: ['if / elif / else', 'Comparison operators', 'for loops & range()', 'while loops & break/continue'],
              quiz: [
                {
                  q: 'What is the output of: for i in range(3): print(i)?',
                  options: ['1 2 3', '0 1 2', '0 1 2 3', '1 2'],
                  answer: 1
                },
                {
                  q: 'Which statement exits a loop immediately?',
                  options: ['continue', 'exit', 'break', 'stop'],
                  answer: 2
                },
                {
                  q: 'What does "elif" stand for?',
                  options: ['else if', 'else again', 'else inner loop', 'extra if'],
                  answer: 0
                },
                {
                  q: 'What does "continue" do inside a loop?',
                  options: ['Exits the loop', 'Skips the rest of the current iteration', 'Restarts from the top', 'Pauses execution'],
                  answer: 1
                },
                {
                  q: 'What is the result of: x = 5; print("Yes") if x > 3 else print("No")?',
                  options: ['No', 'Error', 'Yes', 'Nothing'],
                  answer: 2
                }
              ]
},
{
  day: 3,
    title: 'Functions & Scope',
      description: 'Write reusable blocks of code using functions, and understand local vs global scope.',
        videoId: '9Os0o3wzS_I', // Corey Schafer – Functions
          duration: '39 min',
            topics: ['Defining functions with def', 'Parameters & return values', 'Default arguments & *args', 'Local vs global scope'],
              quiz: [
                {
                  q: 'What keyword is used to define a function in Python?',
                  options: ['function', 'def', 'fn', 'func'],
                  answer: 1
                },
                {
                  q: 'What does "return" do inside a function?',
                  options: ['Prints a value', 'Exits the program', 'Returns a value to the caller', 'Creates a variable'],
                  answer: 2
                },
                {
                  q: 'What is a default parameter?',
                  options: ['A required parameter', 'A parameter with a preset value', 'A global variable', 'None of these'],
                  answer: 1
                },
                {
                  q: 'What does *args allow a function to accept?',
                  options: ['Only keyword arguments', 'Any number of positional arguments', 'Only integers', 'A single list'],
                  answer: 1
                },
                {
                  q: 'A variable defined inside a function has what scope?',
                  options: ['Global', 'Local', 'Module', 'Universal'],
                  answer: 1
                }
              ]
},
{
  day: 4,
    title: 'Lists, Tuples & Strings',
      description: 'Work with Python\'s powerful sequence types and master string manipulation.',
        videoId: 'W8KRzm-HUcc', // Corey Schafer – Lists, Tuples, Sets
          duration: '55 min',
            topics: ['List creation & indexing', 'Slicing & list methods', 'Tuple immutability', 'String methods & formatting'],
              quiz: [
                {
                  q: 'How do you create a list in Python?',
                  options: ['(1, 2, 3)', '{1, 2, 3}', '[1, 2, 3]', '<1, 2, 3>'],
                  answer: 2
                },
                {
                  q: 'Which method adds an item to the end of a list?',
                  options: ['add()', 'insert()', 'push()', 'append()'],
                  answer: 3
                },
                {
                  q: 'What is the key difference between a list and a tuple?',
                  options: ['Tuples are faster', 'Lists are immutable', 'Tuples are immutable', 'No difference'],
                  answer: 2
                },
                {
                  q: 'What does "Hello"[1] return?',
                  options: ['"H"', '"e"', '"l"', '"o"'],
                  answer: 1
                },
                {
                  q: 'Which string method converts all characters to uppercase?',
                  options: ['toUpper()', 'upper()', 'capitalize()', 'UP()'],
                  answer: 1
                }
              ]
},
{
  day: 5,
    title: 'Dictionaries & Sets',
      description: 'Use key-value mappings with dictionaries and work with unique collections using sets.',
        videoId: 'daefaLgNkw0', // Corey Schafer – Dictionaries
          duration: '37 min',
            topics: ['Creating dictionaries', 'Accessing & modifying keys', 'Dict methods (get, items, keys)', 'Sets & set operations'],
              quiz: [
                {
                  q: 'How do you create a dictionary in Python?',
                  options: ['[key: value]', '(key, value)', '{key: value}', '<key: value>'],
                  answer: 2
                },
                {
                  q: 'How do you access a dictionary value by key?',
                  options: ['dict.value', 'dict[key]', 'dict.get_value(key)', 'dict->key'],
                  answer: 1
                },
                {
                  q: 'What does a Python set contain?',
                  options: ['Key-value pairs', 'Ordered duplicates', 'Unique unordered elements', 'Ordered unique elements'],
                  answer: 2
                },
                {
                  q: 'Which dictionary method removes a key and returns its value?',
                  options: ['remove()', 'delete()', 'pop()', 'discard()'],
                  answer: 2
                },
                {
                  q: 'Which set operation returns elements common to both sets?',
                  options: ['union()', 'difference()', 'intersection()', 'cross()'],
                  answer: 2
                }
              ]
},
{
  day: 6,
    title: 'File Handling & Modules',
      description: 'Read and write files, and organize your code into reusable modules.',
        videoId: 'Uh2ebFW8OYM', // Corey Schafer – File Objects
          duration: '29 min',
            topics: ['open(), read(), write()', 'with...as context manager', 'import statement', 'os, math, random modules'],
              quiz: [
                {
                  q: 'Which built-in function opens a file in Python?',
                  options: ['file()', 'read()', 'open()', 'load()'],
                  answer: 2
                },
                {
                  q: 'What file mode opens a file for reading only?',
                  options: ["'w'", "'r'", "'a'", "'x'"],
                  answer: 1
                },
                {
                  q: 'What keyword imports a module?',
                  options: ['require', 'include', 'import', 'use'],
                  answer: 2
                },
                {
                  q: 'What does "with open(...) as f:" ensure?',
                  options: ['File is always writable', 'File is closed automatically', 'File is encrypted', 'File is backed up'],
                  answer: 1
                },
                {
                  q: 'Which built-in module provides mathematical functions?',
                  options: ['numbers', 'calc', 'math', 'numpy'],
                  answer: 2
                }
              ]
},
{
  day: 7,
    title: 'OOP: Classes & Objects',
      description: 'Understand Object-Oriented Programming — the foundation of scalable Python applications.',
        videoId: 'ZDa-Z5JzLYM', // Corey Schafer – OOP Tutorial
          duration: '45 min',
            topics: ['Defining classes', '__init__ and self', 'Instance methods & attributes', 'Inheritance basics'],
              quiz: [
                {
                  q: 'What keyword defines a class in Python?',
                  options: ['object', 'class', 'struct', 'type'],
                  answer: 1
                },
                {
                  q: 'What is the special method called when an object is first created?',
                  options: ['__create__', '__new__', '__init__', '__start__'],
                  answer: 2
                },
                {
                  q: 'What does "self" refer to in a class method?',
                  options: ['A keyword like "this" in Java', 'Reference to the current instance', 'A global variable', 'The class name'],
                  answer: 1
                },
                {
                  q: 'What OOP concept allows a class to inherit from another?',
                  options: ['Composition', 'Polymorphism', 'Encapsulation', 'Inheritance'],
                  answer: 3
                },
                {
                  q: 'Which method is used to provide a string representation of an object?',
                  options: ['__repr__', '__string__', '__str__', 'Both __str__ and __repr__'],
                  answer: 3
                }
              ]
}
  ]
};

// ── Backend Sync ──────────────────────────────────────────────────────────────
// Persists course progress to the server so teacher dashboard shows real data.
async function syncProgressToBackend(day, quizScore, totalQuestions, scorePercent) {
  const token = localStorage.getItem('amep_token');
  if (!token) return;

  const dayData = PYTHON_COURSE.days[day - 1];
  if (!dayData) return;

  const estimatedMinutes = parseInt(dayData.duration) || 30;
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  // Post to our sync endpoint
  await fetch(`${API_BASE}/teacher/sync-progress`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      subject: 'Python',
      topic: dayData.title,
      dayNumber: day,
      score: scorePercent,
      quizScore,
      totalQuestions,
      passed: scorePercent >= 60,
      timeTaken: estimatedMinutes,
      courseId: PYTHON_COURSE.id,
    })
  });
}

// ── On-load: sync any un-synced localStorage progress to backend ──────────────
// Clear old sync flag so previously-failed progress gets re-synced after this fix.
(async function syncExistingProgress() {
  const token = localStorage.getItem('amep_token');
  if (!token) return;

  const progress = getCourseProgress();
  // Force re-sync: clear stale synced flags (they were set even when sync actually failed)
  const synced = {};

  for (const [key, val] of Object.entries(progress)) {
    if (synced[key]) continue; // already synced
    const dayNum = parseInt(key.replace('day_', ''));
    if (!dayNum || !val.completed) continue;

    try {
      await syncProgressToBackend(dayNum, val.quizScore, val.totalQuestions, val.scorePercent);
      synced[key] = true;
    } catch (e) {
      console.warn('[AMEP] Sync failed for', key, e.message);
    }
  }
  localStorage.setItem('amep_python_synced', JSON.stringify(synced));
})();

