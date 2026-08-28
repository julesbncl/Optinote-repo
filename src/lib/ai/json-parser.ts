/**
 * Robust AI JSON Parser & Sanitizer for OptiNote
 * Safely parses responses from OpenAI GPT-4o even when text contains
 * mathematical formulas with unescaped backslashes (e.g. \frac, \sqrt, \pm, \Delta),
 * markdown code blocks, or trailing garbage.
 */
export function safeParseAIJson<T = Record<string, unknown>>(raw: string | null | undefined): T | null {
  if (!raw || typeof raw !== 'string') return null

  let cleaned = raw.trim()

  // 1. Remove markdown code fences if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7)
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3)
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3)
  }
  cleaned = cleaned.trim()

  // 2. Direct JSON.parse try
  try {
    return JSON.parse(cleaned) as T
  } catch {}

  // 3. Extract matching outermost { ... }
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = cleaned.substring(firstBrace, lastBrace + 1)
    try {
      return JSON.parse(candidate) as T
    } catch {}
    cleaned = candidate
  }

  // 4. Sanitize unescaped LaTeX backslashes inside JSON strings
  // In standard JSON, only \", \\, \/, \b, \f, \n, \r, \t, and \uXXXX are valid escape sequences.
  // LaTeX formulas frequently introduce \frac, \sqrt, \Delta, \alpha, \pm, \int, \sum, etc.
  try {
    const sanitized = cleaned
      // Fix \f (formfeed in JSON, but \frac or \forall in LaTeX)
      .replace(/\\frac\b/g, '\\\\frac')
      .replace(/\\forall\b/g, '\\\\forall')
      // Fix all other backslashes not followed by valid JSON escape chars
      .replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, '\\\\')

    return JSON.parse(sanitized) as T
  } catch {}

  // 5. Final fallback: normalize unescaped newlines/tabs inside strings
  try {
    const sanitized2 = cleaned
      .replace(/[\u0000-\u001F]+/g, (match) => {
        if (match === '\n') return '\\n'
        if (match === '\r') return '\\r'
        if (match === '\t') return '\\t'
        return ''
      })
      .replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, '\\\\')

    return JSON.parse(sanitized2) as T
  } catch (e) {
    console.warn('[safeParseAIJson] Failed to parse AI JSON:', e)
    return null
  }
}
