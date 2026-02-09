// Shared helper for calling Google Gemini image generation API directly

export interface GoogleImageResult {
  base64Data: string;
  mimeType: string;
}

export interface GoogleImageError {
  category: 'RATE_LIMITED' | 'CREDIT_EXHAUSTED' | 'AI_ERROR';
  message: string;
  httpStatus: number;
}

/**
 * Call Google Gemini API directly for image generation.
 * Returns the base64 image data or throws a categorized error.
 */
export async function generateImageWithGoogle(
  prompt: string,
  apiKey: string
): Promise<GoogleImageResult> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[GOOGLE_IMAGE] API error:', response.status, errorText);
    
    const err = categorizeGoogleError(response.status, errorText);
    throw err;
  }

  const data = await response.json();
  
  // Extract image from Google's native response format
  const parts = data.candidates?.[0]?.content?.parts;
  if (!parts || !Array.isArray(parts)) {
    throw { category: 'AI_ERROR', message: 'No content parts in response', httpStatus: 500 } as GoogleImageError;
  }

  const imagePart = parts.find((p: any) => p.inlineData?.data);
  if (!imagePart) {
    throw { category: 'AI_ERROR', message: 'No image generated in response', httpStatus: 500 } as GoogleImageError;
  }

  return {
    base64Data: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType || 'image/png',
  };
}

function categorizeGoogleError(status: number, errorText: string): GoogleImageError {
  if (status === 429) {
    return { category: 'RATE_LIMITED', message: `RATE_LIMITED: Google API rate limit exceeded`, httpStatus: 429 };
  }
  if (status === 403) {
    // Check if it's quota exhaustion vs permission denied
    if (errorText.toLowerCase().includes('quota') || errorText.toLowerCase().includes('billing') || errorText.toLowerCase().includes('exceeded')) {
      return { category: 'CREDIT_EXHAUSTED', message: `CREDIT_EXHAUSTED: Google API quota exceeded`, httpStatus: 402 };
    }
    return { category: 'CREDIT_EXHAUSTED', message: `CREDIT_EXHAUSTED: Google API access denied (check API key)`, httpStatus: 402 };
  }
  return { category: 'AI_ERROR', message: `AI_ERROR: Google API returned ${status}`, httpStatus: 500 };
}

/**
 * Convert Google image result to a Uint8Array buffer for storage upload.
 */
export function imageResultToBuffer(result: GoogleImageResult): { buffer: Uint8Array; extension: string } {
  const buffer = Uint8Array.from(atob(result.base64Data), c => c.charCodeAt(0));
  const extension = result.mimeType.split('/')[1] || 'png';
  return { buffer, extension };
}

/**
 * Check if an error is a GoogleImageError with a bail-out category.
 */
export function isGoogleImageError(err: unknown): err is GoogleImageError {
  return typeof err === 'object' && err !== null && 'category' in err && 'httpStatus' in err;
}

/**
 * Check if the error should stop batch processing (rate limit or quota).
 */
export function shouldBailOut(err: unknown): boolean {
  if (!isGoogleImageError(err)) return false;
  return err.category === 'RATE_LIMITED' || err.category === 'CREDIT_EXHAUSTED';
}
