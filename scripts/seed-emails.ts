import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ValidEmail from '../src/models/ValidEmail';

dotenv.config({ path: '.env.local' });

async function seedEmails() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
    }

    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const filePath = path.join(process.cwd(), 'students_emails.md');
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Split by new line, remove empty lines and trim spaces
    const emails = fileContent
      .split('\n')
      .map(email => email.trim())
      .filter(email => email.length > 0);

    // Remove duplicates
    const uniqueEmails = [...new Set(emails)];
    console.log(`Found ${uniqueEmails.length} unique emails to insert.`);

    // Clear existing to avoid unique constraint errors during testing, or simply upsert
    await ValidEmail.deleteMany({});
    console.log('Cleared existing ValidEmail collection');

    const emailDocs = uniqueEmails.map(email => ({ email }));
    await ValidEmail.insertMany(emailDocs);

    console.log(`Successfully seeded ${emailDocs.length} emails into the ValidEmail collection.`);
  } catch (error) {
    console.error('Error seeding emails:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedEmails();
