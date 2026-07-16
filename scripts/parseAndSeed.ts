import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

import Question from '../src/models/Question.js';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env.local');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  await Question.deleteMany({});
  console.log('Cleared existing questions');

  const filePath = path.join(__dirname, '../docs/questions.md');
  const text = fs.readFileSync(filePath, 'utf-8');

  const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
  
  let currentSection = '';
  let currentQuestionText = '';
  let currentOptions: string[] = [];
  let currentAnswer = '';

  const questions = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for section
    if (line.match(/^\d+\.\s+[A-Z\s&/]+$/)) {
      currentSection = line;
      continue;
    }

    if (line === 'FOUNDATION KNOWLEDGE QUIZ') continue;

    // Check for question start (e.g. "1. What does HTML stand for?")
    if (line.match(/^\d+\.\s+/) && !line.match(/^\d+\.\s+[A-Z\s&/]+$/)) {
      if (currentQuestionText) {
        if (!currentAnswer) {
          console.error('MISSING ANSWER FOR:', currentQuestionText);
        }
        questions.push({
          section: currentSection,
          questionText: currentQuestionText,
          options: [...currentOptions],
          correctAnswer: currentAnswer
        });
      }
      currentQuestionText = line;
      currentOptions = [];
      currentAnswer = '';
      continue;
    }

    // Check for option (e.g. "A) ...")
    if (line.match(/^[A-D]\)\s+/)) {
      currentOptions.push(line);
      continue;
    }

    // Check for answer
    if (line.startsWith('Answer: ')) {
      currentAnswer = line.replace('Answer: ', '');
      continue;
    }
  }

  if (currentQuestionText) {
    if (!currentAnswer) {
      console.error('MISSING ANSWER FOR:', currentQuestionText);
    }
    questions.push({
      section: currentSection,
      questionText: currentQuestionText,
      options: [...currentOptions],
      correctAnswer: currentAnswer
    });
  }

  for (const q of questions) {
    await Question.create(q);
  }

  console.log(`Inserted ${questions.length} questions`);
  process.exit(0);
}

seed().catch(console.error);
