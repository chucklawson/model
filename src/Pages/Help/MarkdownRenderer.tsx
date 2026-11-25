import { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface MarkdownRendererProps {
  content: string;
  searchTerm?: string;
  currentMatchIndex?: number;
  onMatchCount?: (count: number) => void;
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const SKIP_TAGS = new Set(['CODE', 'PRE', 'SCRIPT', 'STYLE']);

function isInsideSkipTag(node: Node): boolean {
  let el = node.parentElement;
  while (el) {
    if (SKIP_TAGS.has(el.tagName)) return true;
    el = el.parentElement;
  }
  return false;
}

export default function MarkdownRenderer({
  content,
  searchTerm = '',
  currentMatchIndex = 0,
  onMatchCount,
}: MarkdownRendererProps) {
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const container = articleRef.current;
    if (!container) return;

    // --- Cleanup: remove existing highlights ---
    const parentsToNormalize = new Set<Node>();
    container.querySelectorAll('mark[data-search]').forEach(el => {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent || ''), el);
        parentsToNormalize.add(parent);
      }
    });
    // Normalize each affected parent once to merge split text nodes
    parentsToNormalize.forEach(p => p.normalize());

    if (!searchTerm.trim()) {
      onMatchCount?.(0);
      return;
    }

    // --- Collect all matching text positions ---
    const regex = new RegExp(escapeRegex(searchTerm), 'gi');
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const allMatches: Array<{ node: Text; start: number; end: number }> = [];

    let node: Node | null;
    while ((node = walker.nextNode())) {
      const textNode = node as Text;
      if (isInsideSkipTag(textNode)) continue;
      const text = textNode.textContent || '';
      regex.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(text)) !== null) {
        allMatches.push({ node: textNode, start: m.index, end: m.index + m[0].length });
      }
    }

    const total = allMatches.length;
    onMatchCount?.(total);

    // --- Apply highlights in REVERSE document order ---
    // Reverse processing ensures that earlier splitText calls don't invalidate
    // the offsets stored for earlier matches in the same text node.
    for (let i = total - 1; i >= 0; i--) {
      const { node: textNode, start, end } = allMatches[i];
      if (!textNode.isConnected) continue;

      // splitText(end) shortens textNode to [0..end] and returns [end..]
      textNode.splitText(end);
      // splitText(start) shortens textNode to [0..start] and returns [start..end]
      const matched = textNode.splitText(start);

      const mark = document.createElement('mark');
      mark.dataset.search = String(i);
      mark.className = 'bg-yellow-300 text-slate-900 rounded-sm px-0.5';

      if (matched.parentNode) {
        matched.parentNode.replaceChild(mark, matched);
        mark.appendChild(matched);
      }
    }
  }, [searchTerm, content]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to and visually distinguish the current match
  useEffect(() => {
    const container = articleRef.current;
    if (!container || !searchTerm.trim()) return;

    const marks = container.querySelectorAll<HTMLElement>('mark[data-search]');
    marks.forEach((m, i) => {
      if (i === currentMatchIndex) {
        m.className = 'bg-orange-400 text-white rounded-sm px-0.5';
        m.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        m.className = 'bg-yellow-300 text-slate-900 rounded-sm px-0.5';
      }
    });
  }, [currentMatchIndex, searchTerm]);

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 min-h-[600px]">
      <article ref={articleRef} className="prose prose-lg max-w-none
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
            a: ({ node: _node, ...props }) => {
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
            img: ({ node: _node, ...props }) => (
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
