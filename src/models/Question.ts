import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IQuestion extends Document {
  section: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
}

const QuestionSchema: Schema = new Schema({
  section: { type: String, required: true },
  questionText: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswer: { type: String, required: true },
});

const Question: Model<IQuestion> = mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);

export default Question;
