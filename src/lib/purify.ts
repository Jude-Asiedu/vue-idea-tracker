import DOMPurify from 'dompurify'

const ALLOWED_TAGS = [
  'p', 'ul', 'ol', 'li', 'strong', 'em', 'a',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'code', 'pre', 'blockquote', 'br', 'hr',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
]

const ALLOWED_ATTR = ['href', 'target', 'rel']

// Single sanitize entry-point for all v-html bindings.
// Always pass user-generated or markdown-rendered HTML through here.
export function sanitize(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR })
}
