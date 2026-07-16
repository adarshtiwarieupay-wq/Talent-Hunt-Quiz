import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Candidate from '@/models/Candidate';
import TestSession from '@/models/TestSession';
import Question from '@/models/Question';
import ValidEmail from '@/models/ValidEmail';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';
const TEST_DURATION_MINUTES = 25; // Configurable test duration

const startSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  contactNo: z.string().min(1, 'Contact number is required'),
  country: z.string().min(1, 'Country is required'),
});

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const parsed = startSchema.parse(body);

    // Check if email is in the allowed list
    const validEmailEntry = await ValidEmail.findOne({ email: parsed.email });
    if (!validEmailEntry) {
      return NextResponse.json({ error: 'Your email is not authorized to take this test. Please contact support if you believe this is a mistake.' }, { status: 403 });
    }

    // Upsert the candidate
    let candidate = await Candidate.findOne({ email: parsed.email });
    if (!candidate) {
      candidate = await Candidate.create({
        name: parsed.name,
        email: parsed.email,
        contactNo: parsed.contactNo,
        country: parsed.country,
        hasStarted: true,
        hasCompleted: false,
      });
    } else {
      if (candidate.hasCompleted) {
        return NextResponse.json({ error: 'You have already completed the test' }, { status: 403 });
      }
      candidate.hasStarted = true;
      await candidate.save();
    }

    // Check if session exists or create new one
    let session = await TestSession.findOne({ candidateId: candidate._id });
    if (!session) {
      session = await TestSession.create({
        candidateId: candidate._id,
        startTime: new Date(),
        answers: [],
      });
    } else {
      // Check if time ran out on existing session
      const now = new Date().getTime();
      const diffMinutes = (now - session.startTime.getTime()) / 1000 / 60;
      if (diffMinutes > TEST_DURATION_MINUTES + 1) { // 1 min grace period
        return NextResponse.json({ error: 'Test time has expired' }, { status: 403 });
      }
    }

    // Generate JWT
    const token = jwt.sign({ candidateId: candidate._id, sessionId: session._id }, JWT_SECRET, { expiresIn: '2h' });

    // Fetch questions without correct answers
    const questions = await Question.find({}, '-correctAnswer').lean();

    return NextResponse.json({
      token,
      questions,
      startTime: session.startTime,
      durationMinutes: TEST_DURATION_MINUTES,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      const zodErrors = (error as any).errors;
      zodErrors.forEach((err: any) => {
        if (err.path && err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      return NextResponse.json({ fieldErrors, error: 'Validation failed' }, { status: 400 });
    }
    console.error('Start Test Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
