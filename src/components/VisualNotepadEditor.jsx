import { useRef, useState, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link as LinkIcon,
  Code,
  Eye,
  RemoveFormatting,
  Heading2,
  Heading3,
} from "lucide-react";

/**
 * Converts simple markdown to HTML so legacy markdown blog articles
 * render nicely in the visual notepad editor when opened for edit.
 */
function convertMarkdownToHtml(text) {
  if (!text) return "";
  // If already contains HTML markup, leave as-is
  if (/<[a-z][\s\S]*>/i.test(text)) {
    return text;
  }

  const blocks = text.split(/\n\s*\n/);
  return blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";

      if (trimmed.startsWith("### ")) {
        return `<h3>${trimmed.slice(4)}</h3>`;
      }
      if (trimmed.startsWith("## ")) {
        return `<h2>${trimmed.slice(3)}</h2>`;
      }
      if (trimmed.startsWith("# ")) {
        return `<h1>${trimmed.slice(2)}</h1>`;
      }
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const items = trimmed
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .map((l) => `<li>${l.replace(/^[-*]\s+/, "")}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }
      if (/^\d+\.\s+/.test(trimmed)) {
        const items = trimmed
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .map((l) => `<li>${l.replace(/^\d+\.\s+/, "")}</li>`)
          .join("");
        return `<ol>${items}</ol>`;
      }

      return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
    })
    .filter(Boolean)
    .join("")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");
}

export default function VisualNotepadEditor({
  value = "",
  onChange,
  placeholder = "Write blog content here...",
  minHeight = "240px",
}) {
  const editorRef = useRef(null);
  const [isCodeView, setIsCodeView] = useState(false);
  const isFocusedRef = useRef(false);

  // Initialize/sync HTML content
  const formattedInitial = convertMarkdownToHtml(value);

  useEffect(() => {
    if (!editorRef.current) return;
    if (!isFocusedRef.current || editorRef.current.innerHTML === "") {
      const currentHtml = editorRef.current.innerHTML;
      if (currentHtml !== value && currentHtml !== formattedInitial) {
        editorRef.current.innerHTML = formattedInitial;
      }
    }
  }, [value, formattedInitial, isCodeView]);

  const handleEditorInput = () => {
    if (!editorRef.current) return;
    let html = editorRef.current.innerHTML;
    if (html === "<br>" || html === "<p><br></p>") {
      html = "";
    }
    if (onChange) {
      onChange(html);
    }
  };

  const executeCommand = (command, value = undefined) => {
    if (isCodeView) return;
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleEditorInput();
  };

  const handleCreateLink = () => {
    if (isCodeView) return;
    const url = window.prompt("Enter link URL (e.g. https://...):", "https://");
    if (url && url.trim() && url !== "https://") {
      executeCommand("createLink", url.trim());
    }
  };

  const handleHeading = (tag) => {
    if (isCodeView) return;
    executeCommand("formatBlock", tag);
  };

  return (
    <div className="w-full">
      {/* Top Header Row with Mode Badge */}
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Article Body / Content *
        </label>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
            {isCodeView ? "HTML Code Mode" : "Visual Notepad Mode"}
          </span>
        </div>
      </div>

      {/* Editor Container with Border */}
      <div className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all bg-white">
        {/* Formatting Toolbar */}
        <div className="border-b border-slate-200 bg-slate-50/90 px-3 py-2 flex flex-wrap items-center justify-between gap-1 text-slate-600 select-none">
          <div className="flex items-center flex-wrap gap-1">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleHeading("<h2>");
              }}
              title="Heading 2 (Section Title)"
              className="px-2 py-1 text-xs font-bold hover:bg-slate-200 hover:text-slate-900 rounded transition-colors flex items-center gap-0.5"
            >
              <Heading2 className="w-3.5 h-3.5" />
              <span>H2</span>
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleHeading("<h3>");
              }}
              title="Heading 3 (Sub-heading)"
              className="px-2 py-1 text-xs font-bold hover:bg-slate-200 hover:text-slate-900 rounded transition-colors flex items-center gap-0.5"
            >
              <Heading3 className="w-3.5 h-3.5" />
              <span>H3</span>
            </button>

            <div className="w-px h-4 bg-slate-300 mx-1" />

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand("bold");
              }}
              title="Bold (Ctrl+B)"
              className="p-1.5 hover:bg-slate-200 hover:text-slate-900 rounded transition-colors"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand("italic");
              }}
              title="Italic (Ctrl+I)"
              className="p-1.5 hover:bg-slate-200 hover:text-slate-900 rounded transition-colors"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand("underline");
              }}
              title="Underline (Ctrl+U)"
              className="p-1.5 hover:bg-slate-200 hover:text-slate-900 rounded transition-colors"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand("removeFormat");
              }}
              title="Clear Formatting"
              className="p-1.5 hover:bg-slate-200 hover:text-slate-900 rounded transition-colors"
            >
              <RemoveFormatting className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-4 bg-slate-300 mx-1" />

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand("insertUnorderedList");
              }}
              title="Bullet List"
              className="p-1.5 hover:bg-slate-200 hover:text-slate-900 rounded transition-colors"
            >
              <List className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand("insertOrderedList");
              }}
              title="Numbered List"
              className="p-1.5 hover:bg-slate-200 hover:text-slate-900 rounded transition-colors"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleCreateLink();
              }}
              title="Insert Link"
              className="p-1.5 hover:bg-slate-200 hover:text-slate-900 rounded transition-colors"
            >
              <LinkIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Toggle Visual / Code Mode Button */}
          <button
            type="button"
            onClick={() => setIsCodeView(!isCodeView)}
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              isCodeView
                ? "bg-blue-100 text-blue-700 font-bold"
                : "hover:bg-slate-200 text-slate-600"
            }`}
            title={
              isCodeView
                ? "Switch back to Visual Notepad Mode"
                : "Switch to HTML Code View"
            }
          >
            {isCodeView ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Visual Notepad</span>
              </>
            ) : (
              <>
                <Code className="w-3.5 h-3.5" />
                <span>HTML Code</span>
              </>
            )}
          </button>
        </div>

        {/* Visual Notepad Editable Area */}
        {!isCodeView ? (
          <div
            ref={editorRef}
            contentEditable
            onFocus={() => {
              isFocusedRef.current = true;
            }}
            onBlur={() => {
              isFocusedRef.current = false;
              handleEditorInput();
            }}
            onInput={handleEditorInput}
            data-placeholder={placeholder}
            style={{ minHeight, lineHeight: "1.85" }}
            className="visual-notepad-editor w-full px-4 py-3.5 text-sm text-slate-800 bg-white max-h-[460px] overflow-y-auto focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:border-b [&_h2]:border-slate-100 [&_h2]:pb-1 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:mt-3 [&_h3]:mb-1.5 [&_p]:mb-2.5 [&_ul]:!list-disc [&_ul]:!pl-6 [&_ul]:!my-2 [&_ol]:!list-decimal [&_ol]:!pl-6 [&_ol]:!my-2 [&_li]:!list-item [&_li]:!mb-1 [&_a]:text-blue-600 [&_a]:underline"
          />
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange && onChange(e.target.value)}
            style={{ minHeight }}
            placeholder="<div>Enter raw HTML code here...</div>"
            className="w-full px-4 py-3 font-mono text-xs text-slate-800 bg-slate-50/70 max-h-[460px] overflow-y-auto focus:outline-none"
          />
        )}
      </div>
      <p className="text-[11px] text-slate-400 mt-1 italic">
        Tip: Type naturally like in a notepad. Use toolbar buttons to add headings, bold text, lists, and links.
      </p>
    </div>
  );
}
