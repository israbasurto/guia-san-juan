'use client';
import ReactMarkdown from 'react-markdown';

// Render seguro de Markdown (§5.1): react-markdown NO interpreta HTML crudo ni
// URLs peligrosas por defecto (sin rehype-raw). Además restringimos los elementos
// permitidos y forzamos enlaces externos seguros.
const PERMITIDOS = [
  'p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li',
  'strong', 'em', 'a', 'blockquote', 'code', 'pre', 'hr', 'br',
];

function Enlace({ href, children }) {
  const externo = /^https?:\/\//i.test(href || '');
  return (
    <a href={href} {...(externo ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {})}>
      {children}
    </a>
  );
}

export default function Markdown({ children }) {
  return (
    <div className="md">
      <ReactMarkdown allowedElements={PERMITIDOS} unwrapDisallowed components={{ a: Enlace }}>
        {children || ''}
      </ReactMarkdown>
    </div>
  );
}
