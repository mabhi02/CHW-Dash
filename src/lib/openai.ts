import { Configuration, OpenAIApi } from 'openai';

// Initialize OpenAI API with environment variable
const configuration = new Configuration({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
});

const openai = new Configuration({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
}) ? new OpenAIApi(configuration) : null;

/**
 * Analyze a chunk of text and find the best PDF page and highlight query
 */
export async function analyzePdfChunk(chunkText: string, pdfName: string): Promise<{
  page: number;
  highlightText: string;
}> {
  try {
    if (!openai) {
      console.warn('OpenAI API not configured');
      return { page: 1, highlightText: chunkText.substring(0, 30) };
    }

    const prompt = `
I have a PDF document called "${pdfName}" which is a WHO Guide on managing diarrhea and pneumonia in children.
I found this text chunk from it, but I need to determine which page number it's likely from and what specific text would be best to search for highlighting:

"""
${chunkText}
"""

Return only a JSON object with:
1. A page number estimate (just a number, your best guess between 1-80)
2. A short, distinct phrase (5-10 words) from this chunk that would be good for highlighting and searching

Format: { "page": number, "highlightText": "phrase for highlighting" }
`;

    const response = await openai.createCompletion({
      model: "gpt-3.5-turbo-instruct",
      prompt,
      temperature: 0.3,
      max_tokens: 150,
    });

    const text = response.data.choices[0]?.text?.trim() || '';
    
    try {
      // Try to parse the JSON response
      const result = JSON.parse(text);
      return {
        page: result.page || 1,
        highlightText: result.highlightText || chunkText.substring(0, 30)
      };
    } catch (e) {
      // Fallback if JSON parsing fails
      console.error("Failed to parse OpenAI response:", e);
      return {
        page: 1,
        highlightText: chunkText.substring(0, 30)
      };
    }
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return {
      page: 1,
      highlightText: chunkText.substring(0, 30)
    };
  }
} 