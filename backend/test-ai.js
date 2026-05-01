import 'dotenv/config';
import { generateResult } from './services/ai.service.js';

async function test() {
  console.log('Testing Gemini API...');
  try {
    const result = await generateResult('create a login page');
    console.log('\nRAW RESULT:\n', result);
  } catch (err) {
    console.error('ERROR:', err);
  }
}

test();
