import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 min-h-[600px]">
      <article className="prose prose-lg max-w-none
                          prose-headings:text-slate-800
                          prose-h1:text-4xl prose-h1:font-bold prose-h1:mb-6
                          prose-h1:bg-gradient-to-r prose-h1:from-purple-600 prose-h1:to-blue-600
                          prose-h1:bg-clip-text prose-h1:text-transparent
                          prose-h2:text-3xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-slate-700
                          prose-h3:text-2xl prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-slate-600
                          prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-4
                          prose-a:text-purple-600 prose-a:no-underline hover:prose-a:text-purple-800 hover:prose-a:underline
                          prose-strong:text-slate-900 prose-strong:font-semibold
                          prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                          prose-code:before:content-[''] prose-code:after:content-['']
                          prose-pre:bg-slate-900 prose-pre:text-slate-100
                          prose-ul:my-4 prose-li:text-slate-700
                          prose-ol:my-4 prose-ol:text-slate-700
                          prose-table:border-collapse prose-table:w-full
                          prose-th:bg-purple-100 prose-th:border prose-th:border-slate-300 prose-th:p-2
                          prose-td:border prose-td:border-slate-300 prose-td:p-2
                          prose-blockquote:border-l-4 prose-blockquote:border-purple-500 prose-blockquote:pl-4 prose-blockquote:italic">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            // Make external links open in new tab
            a: ({ node, ...props }) => {
              const href = props.href || '';
              const isExternal = href.startsWith('http://') || href.startsWith('https://');
              return (
                <a
                  {...props}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                />
              );
            },
            // Responsive images
            img: ({ node, ...props }) => (
              <img
                {...props}
                className="max-w-full h-auto rounded-lg shadow-md border border-slate-200"
                loading="lazy"
              />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </article>
    </div>
  );
}
