export interface Session {
  id: number;
  chat_name: string;
  initial_responses: any[];
  followup_responses: any[];
  exam_responses: any[];
  created_at?: string; // Optional as it might not exist in current data
  updated_at?: string; // Optional as it might not exist in current data
}