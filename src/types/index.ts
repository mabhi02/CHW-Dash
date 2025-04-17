export interface Session {
  id: number;
  session_id: string;
  chat_name: string;
  timestamp: string;
  message_type: 'user' | 'assistant';
  phase: 'initial' | 'followup' | 'exam' | 'complete';
  content: string;
  metadata?: any;
}

export interface SessionSummary {
  id: number;
  session_id: string;
  timestamp: string;
  initial_complaint: string;
  diagnosis: string;
  treatment: string;
  chunks_used: number;
}

export interface RagChunk {
  id: number;
  session_id: string;
  timestamp: string;
  phase: string;
  chunk_type: string;
  chunk_id: string;
  source: string;
  text: string;
  relevance_score: number;
}

export interface MatrixEvaluation {
  id: number;
  session_id: string;
  timestamp: string;
  phase: string;
  question: string;
  confidence: number;
  optimist_weight: number;
  pessimist_weight: number;
  selected_agent: string;
}

export interface ExportOptions {
  format: 'csv' | 'json';
  sessions: string[] | 'all';
}