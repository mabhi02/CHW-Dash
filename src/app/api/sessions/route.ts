import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Session } from '@/types';

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Query the database
    const result = await pool.query('SELECT id, chat_name, initial_responses, followup_responses, exam_responses FROM sessions ORDER BY id ASC');
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Return the data with metadata
    return NextResponse.json({
      data: result.rows as Session[],
      meta: {
        count: result.rowCount,
        responseTime
      }
    });
  } catch (error) {
    console.error('Error executing query:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}