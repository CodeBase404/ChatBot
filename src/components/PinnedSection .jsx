import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const PinnedSection = ({ pinned }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => setExpanded((prev) => !prev);

  return (
    pinned.length > 0 && (
      <div
        className="sticky -top-4 z-50 p-3 bg-yellow-100 text-black rounded cursor-pointer"
        onClick={toggleExpanded}
      >
        <h3 className="font-bold text-sm mb-1">📌 Pinned</h3>

        {!expanded ? (
          <div className="text-sm truncate">
            • {pinned[0]?.content}
            {pinned.length > 1 && (
              <span className="text-gray-600"> ...more</span>
            )}
          </div>
        ) : (
          <ul className="space-y-1 text-sm">
            {pinned.map((p) => (
              <li key={p.id}>
                •{" "}
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-lg mt-2"
                          {...props}
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      ) : (
                        <code
                          className="bg-gray-800 text-white px-1 py-0.5 rounded text-xs"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {p.content}
                </ReactMarkdown>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  );
};

export default PinnedSection;
