import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Candidate from '@/models/Candidate';
import TestSession from '@/models/TestSession';
import Question from '@/models/Question';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';
const TEST_DURATION_MINUTES = 25;
const PASSING_SCORE = 25;

const submitSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string(),
    selectedOption: z.string(),
  })),
});

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    // Auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const { candidateId, sessionId } = decoded;
    const body = await req.json();
    const parsed = submitSchema.parse(body);

    const session = await TestSession.findById(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Test session not found' }, { status: 404 });
    }
    if (session.submissionTime) {
      return NextResponse.json({ error: 'Test already submitted' }, { status: 400 });
    }

    const submissionTime = new Date();
    
    // Validate time
    const diffMinutes = (submissionTime.getTime() - session.startTime.getTime()) / 1000 / 60;
    
    // Allow a small grace period for network latency (e.g., 2 minutes)
    if (diffMinutes > TEST_DURATION_MINUTES + 2) {
      return NextResponse.json({ error: 'Submission time exceeded' }, { status: 403 });
    }

    // Grade test
    let score = 0;
    const allQuestions = await Question.find({});
    const questionMap = new Map();
    for (const q of allQuestions) {
      questionMap.set(q._id.toString(), q.correctAnswer);
    }

    const processedAnswers = [];
    for (const ans of parsed.answers) {
      const correct = questionMap.get(ans.questionId);
      if (correct === ans.selectedOption) {
        score += 1;
      }
      processedAnswers.push({
        questionId: ans.questionId,
        selectedOption: ans.selectedOption
      });
    }

    session.submissionTime = submissionTime;
    session.answers = processedAnswers;
    session.score = score;
    session.passed = score >= PASSING_SCORE;
    await session.save();

    await Candidate.findByIdAndUpdate(candidateId, { hasCompleted: true });

    return NextResponse.json({
      success: true,
      score: session.score,
      passed: session.passed,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors }, { status: 400 });
    }
    console.error('Submit Test Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
