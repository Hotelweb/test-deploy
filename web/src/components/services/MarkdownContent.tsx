import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownContentProps {
  content: string
  className?: string
}

/**
 * Render service descriptions written in Markdown.
 *
 * GitHub-flavoured markdown (tables, task lists, autolinks, strikethrough)
 * via `remark-gfm`. Links open in a new tab so guests don't lose the hotel
 * page when tapping out to a booking site or social profile.
 *
 * The styling here is intentionally self-contained — Tailwind v4 doesn't
 * ship `@tailwindcss/typography` by default in this project, so we map a
 * small set of elements explicitly. Looks good in narrow modal columns and
 * on phones.
 */
export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={`markdown-body text-[14px] text-text leading-relaxed ${className ?? ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-[20px] font-bold text-text mt-5 mb-2 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-[17px] font-bold text-text mt-4 mb-2 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-[15px] font-semibold text-text mt-3 mb-1.5 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-[14px] font-semibold text-text mt-3 mb-1 first:mt-0">{children}</h4>
          ),
          p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc pl-5 my-2 space-y-1 marker:text-text-light">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-2 space-y-1 marker:text-text-light">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary-dark"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => <strong className="font-semibold text-text">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/30 pl-3 my-3 text-text-muted italic">
              {children}
            </blockquote>
          ),
          code: ({ children, className: cls }) => {
            // Inline code (no language class) uses a soft pill, fenced blocks
            // use a darker treatment via the <pre> wrapper below.
            const isInline = !cls
            if (isInline) {
              return (
                <code className="px-1.5 py-0.5 rounded-md bg-gray-100 text-[13px] font-mono text-text">
                  {children}
                </code>
              )
            }
            return <code className={cls}>{children}</code>
          },
          pre: ({ children }) => (
            <pre className="my-3 p-3 rounded-xl bg-gray-900 text-gray-100 text-[12.5px] overflow-x-auto leading-relaxed">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto">
              <table className="min-w-full text-[13px] border border-border-light rounded-xl overflow-hidden">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-semibold text-text border-b border-border-light">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 border-b border-border-light text-text-muted">{children}</td>
          ),
          hr: () => <hr className="my-4 border-border-light" />,
          img: ({ src, alt }) => (
            <img
              src={src as string}
              alt={alt ?? ''}
              className="my-3 rounded-xl max-w-full h-auto border border-border-light"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
