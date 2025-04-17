import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Session, SessionSummary, RagChunk, MatrixEvaluation } from '@/types';

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Query the correct tables as shown in the database
    const summariesPromise = pool.query(
      'SELECT * FROM session_summaries ORDER BY timestamp ASC'
    );
    
    const chunksPromise = pool.query(
      'SELECT * FROM rag_chunks ORDER BY timestamp ASC'
    );
    
    const matrixPromise = pool.query(
      'SELECT * FROM matrix_evaluations ORDER BY timestamp ASC'
    );
    
    // Run all queries in parallel
    const [summariesResult, chunksResult, matrixResult] = 
      await Promise.all([summariesPromise, chunksPromise, matrixPromise]);
    
    // Convert session summaries to conversations format
    const conversations: Session[] = summariesResult.rows.map((summary: SessionSummary) => ({
      id: summary.id,
      session_id: summary.session_id,
      chat_name: summary.initial_complaint.substring(0, 30),
      timestamp: summary.timestamp,
      message_type: 'user',
      phase: 'initial',
      content: summary.initial_complaint,
      metadata: { diagnosis: summary.diagnosis, treatment: summary.treatment }
    }));
    
    // Get unique session IDs
    const sessionIds = new Set<string>();
    summariesResult.rows.forEach((row: any) => {
      sessionIds.add(row.session_id);
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Return the data with metadata
    return NextResponse.json({
      data: {
        conversations,
        summaries: summariesResult.rows as SessionSummary[],
        chunks: chunksResult.rows as RagChunk[],
        matrix: matrixResult.rows as MatrixEvaluation[],
        sessionIds: Array.from(sessionIds)
      },
      meta: {
        conversations: conversations.length,
        summaries: summariesResult.rowCount,
        chunks: chunksResult.rowCount,
        matrix: matrixResult.rowCount,
        uniqueSessions: sessionIds.size,
        responseTime
      }
    });
  } catch (error) {
    console.error('Error executing query:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}

// Add endpoint for exporting data
export async function POST(request: Request) {
  try {
    const { format, sessions } = await request.json();
    
    // Build query based on requested sessions
    let whereClause = '';
    let queryParams: string[] = [];
    
    if (sessions !== 'all') {
      whereClause = 'WHERE session_id IN (' + sessions.map((_: any, idx: number) => '$' + (idx + 1)).join(',') + ')';
      queryParams = sessions;
    }
    
    // Query all tables for the requested sessions
    const summariesPromise = pool.query(
      `SELECT * FROM session_summaries ${whereClause} ORDER BY timestamp ASC`,
      queryParams.length ? queryParams : undefined
    );
    
    const chunksPromise = pool.query(
      `SELECT * FROM rag_chunks ${whereClause} ORDER BY timestamp ASC`,
      queryParams.length ? queryParams : undefined
    );
    
    const matrixPromise = pool.query(
      `SELECT * FROM matrix_evaluations ${whereClause} ORDER BY timestamp ASC`,
      queryParams.length ? queryParams : undefined
    );
    
    // Run all queries in parallel
    const [summariesResult, chunksResult, matrixResult] = 
      await Promise.all([summariesPromise, chunksPromise, matrixPromise]);
    
    // Convert session summaries to conversations format
    const conversations = summariesResult.rows.map((summary: any) => ({
      id: summary.id,
      session_id: summary.session_id,
      chat_name: summary.initial_complaint.substring(0, 30),
      timestamp: summary.timestamp,
      message_type: 'user',
      phase: 'initial',
      content: summary.initial_complaint,
      metadata: { diagnosis: summary.diagnosis, treatment: summary.treatment }
    }));
    
    const exportData = {
      conversations,
      summaries: summariesResult.rows,
      chunks: chunksResult.rows,
      matrix: matrixResult.rows
    };
    
    return NextResponse.json({
      data: exportData,
      format: format
    });
  } catch (error) {
    console.error('Error executing export query:', error);
    return NextResponse.json(
      { error: 'Export failed', details: error },
      { status: 500 }
    );
  }
}