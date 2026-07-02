import { useMemo, useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import rehypeSanitize, { defaultSchema } from "rehype-sanitize"

function looksLikeHtml(content: string) {
  const trimmed = content.trim()
  return /<(\/?[a-z][a-z0-9]*(?:\s[^>]*)?>|!DOCTYPE\s+html)/i.test(trimmed)
}

function extractRenderableHtml(content: string) {
  const trimmed = content.trim()

  // 1. ```html ... ``` 代码块
  const htmlFence = trimmed.match(/^```html\s*([\s\S]*?)\s*```$/i)
  if (htmlFence) return htmlFence[1]

  // 2. ``` ... ``` 通用代码块，内部看起来像 HTML
  const genericFence = trimmed.match(/^```\s*([\s\S]*?)\s*```$/)
  if (genericFence && looksLikeHtml(genericFence[1])) return genericFence[1]

  // 3. 单行/多行反引号包裹，内部看起来像 HTML
  const inlineCode = trimmed.match(/^`([\s\S]*?)`$/)
  if (inlineCode && looksLikeHtml(inlineCode[1])) return inlineCode[1]

  // 4. 文本中嵌入的 ```html ... ``` 或 ``` ... ``` 代码块
  const embeddedHtmlFence = trimmed.match(/```html\s*([\s\S]*?)\s*```/i)
  if (embeddedHtmlFence) return embeddedHtmlFence[1]

  const embeddedGenericFence = trimmed.match(/```\s*([\s\S]*?)\s*```/)
  if (embeddedGenericFence && looksLikeHtml(embeddedGenericFence[1])) return embeddedGenericFence[1]

  // 5. 文本中嵌入的单行/多行反引号包裹 HTML
  const embeddedInlineCode = trimmed.match(/`([\s\S]*?)`/)
  if (embeddedInlineCode && looksLikeHtml(embeddedInlineCode[1])) return embeddedInlineCode[1]

  return undefined
}

type Segment =
  | { type: "text"; content: string }
  | { type: "think"; content: string; closed: boolean }

function splitThinkSegments(content: string): Segment[] {
  const segments: Segment[] = []
  const tagRegex = /<\/?think>/gi
  let cursor = 0
  let openStart = -1
  let match: RegExpExecArray | null

  while ((match = tagRegex.exec(content)) !== null) {
    const tag = match[0].toLowerCase()
    if (tag === "<think>") {
      if (openStart >= 0) continue
      if (match.index > cursor) {
        segments.push({ type: "text", content: content.slice(cursor, match.index) })
      }
      openStart = tagRegex.lastIndex
      cursor = tagRegex.lastIndex
    } else if (openStart >= 0) {
      segments.push({ type: "think", content: content.slice(openStart, match.index), closed: true })
      cursor = tagRegex.lastIndex
      openStart = -1
    }
  }

  if (openStart >= 0) {
    segments.push({ type: "think", content: content.slice(openStart), closed: false })
  } else if (cursor < content.length) {
    segments.push({ type: "text", content: content.slice(cursor) })
  }

  return segments.length > 0 ? segments : [{ type: "text", content }]
}

// 自定义 rehype-sanitize schema：允许更多标签和属性用于 HTML 渲染
// 基于 defaultSchema 扩展，保留其安全规则（如协议白名单、clobber 保护等）
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    "span", "p", "br", "hr", "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li", "dl", "dt", "dd",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
    "pre", "code", "strong", "em", "b", "i", "u", "s", "strike",
    "img", "figure", "figcaption",
    "details", "summary",
    "svg", "path", "circle", "rect", "line", "polyline", "polygon", "text",
    "g", "defs", "use", "clipPath", "mask",
    "style",
  ],
  attributes: {
    ...(defaultSchema.attributes || {}),
    "*": ["className", "style", "id", "title", "dir", "lang", "role", "aria*"],
    a: ["href", "target", "rel", ...(defaultSchema.attributes?.a || [])],
    img: ["src", "alt", "width", "height", "loading", ...(defaultSchema.attributes?.img || [])],
    table: ["border", "cellpadding", "cellspacing", ...(defaultSchema.attributes?.table || [])],
    th: ["colspan", "rowspan", "scope", "align", ...(defaultSchema.attributes?.th || [])],
    td: ["colspan", "rowspan", "align", ...(defaultSchema.attributes?.td || [])],
    details: ["open", ...(defaultSchema.attributes?.details || [])],
    svg: [
      "xmlns", "viewBox", "width", "height", "fill", "stroke", "strokeWidth",
      "strokeLinecap", "strokeLinejoin", "className", "style",
    ],
    path: ["d", "fill", "stroke", "strokeWidth", "className"],
    circle: ["cx", "cy", "r", "fill", "stroke", "strokeWidth"],
    rect: ["x", "y", "width", "height", "fill", "stroke", "strokeWidth", "rx", "ry"],
    line: ["x1", "y1", "x2", "y2", "stroke", "strokeWidth"],
    polyline: ["points", "fill", "stroke", "strokeWidth"],
    polygon: ["points", "fill", "stroke", "strokeWidth"],
    text: ["x", "y", "fill", "fontSize", "fontFamily", "textAnchor"],
    g: ["transform", "className", "style"],
    use: ["href", "x", "y", "width", "height"],
    style: ["type"],
  },
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="rich-message-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noreferrer" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

/** 用 iframe 隔离渲染完整的 HTML 文档（含 style 标签），宽度自适应父容器 */
function IsolatedHtmlRender({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const doc = iframe.contentDocument
    if (!doc) return

    // 在写入 iframe 前预处理 HTML：移除/替换所有固定宽度限制
    const processedHtml = html.replace(
      /<style[^>]*>[\s\S]*?<\/style>/gi,
      (styleTag) => {
        // 保留 style 标签，但将其中的 max-width 和固定 width 替换为自适应值
        return styleTag
          .replace(/max-width\s*:\s*[^;{}]+/gi, 'max-width: 100%')
          .replace(/width\s*:\s*\d+(?:px|rem|em|cm|mm|in|pt|pc)[^;{}]*/gi, 'width: 100%')
      }
    )
    // 也处理内联 style 属性中的固定宽度
    .replace(/style="([^"]*)"/gi, (_match, styles) => {
      const newStyles = styles
        .replace(/max-width\s*:\s*[^;]+/gi, 'max-width: 100%')
        .replace(/width\s*:\s*\d+(?:px|rem|em|cm|mm|in|pt|pc)[^;]*/gi, 'width: 100%')
      return `style="${newStyles}"`
    })

    doc.open()
    doc.write(processedHtml)
    doc.close()

    // 同步 iframe 高度
    const syncHeight = () => {
      const body = doc.body
      const htmlEl = doc.documentElement
      if (body && htmlEl) {
        const height = Math.max(body.scrollHeight, htmlEl.scrollHeight)
        iframe.style.height = `${height + 16}px`
      }
    }

    // 注入脚本：覆盖模型可能写死的固定宽度，让内容自适应 iframe 宽度
    // 策略：1) 注入 !important CSS 覆盖常见选择器；2) JS 遍历所有元素强制设置 max-width: 100%
    const injectAdaptiveStyle = () => {
      const style = doc.createElement("style")
      style.textContent = `
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          overflow-x: hidden !important;
          width: 100% !important;
          min-width: 0 !important;
        }
        body {
          box-sizing: border-box !important;
        }
        /* 强制所有直接子元素填满宽度 */
        body > * {
          max-width: 100% !important;
          width: 100% !important;
          min-width: 0 !important;
          box-sizing: border-box !important;
        }
        /* 覆盖内联 style 中的固定宽度 */
        [style*="max-width"], [style*="width"] {
          max-width: 100% !important;
        }
        /* 覆盖常见类名 */
        .weather-card, .card, .container, .wrapper, .box, .panel, .main, .content,
        [class*="card"], [class*="container"], [class*="wrapper"], [class*="box"] {
          max-width: 100% !important;
          width: 100% !important;
        }
        /* 万能选择器兜底 */
        * {
          max-width: 100% !important;
        }
        img, video, svg, canvas, iframe, table {
          max-width: 100% !important;
          height: auto !important;
        }
        table {
          display: block !important;
          overflow-x: auto !important;
        }
        pre {
          white-space: pre-wrap !important;
          word-wrap: break-word !important;
          overflow-x: auto !important;
        }
      `
      doc.head.appendChild(style)

      // JS 兜底：遍历所有元素强制覆盖 max-width
      const allElements = doc.querySelectorAll("*")
      allElements.forEach((el) => {
        const htmlEl = el as HTMLElement
        if (htmlEl.style) {
          htmlEl.style.setProperty("max-width", "100%", "important")
          htmlEl.style.setProperty("width", "100%", "important")
        }
      })
    }

    // 等待样式和 DOM 稳定后再注入和计算
    const timer = setTimeout(() => {
      injectAdaptiveStyle()
      syncHeight()
    }, 0)

    const observer = new MutationObserver(syncHeight)
    observer.observe(doc.body, { childList: true, subtree: true, attributes: true })

    const images = doc.querySelectorAll("img")
    images.forEach(img => {
      img.addEventListener("load", syncHeight)
    })

    return () => {
      clearTimeout(timer)
      observer.disconnect()
      images.forEach(img => img.removeEventListener("load", syncHeight))
    }
  }, [html])

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-same-origin"
      style={{
        width: "100%",
        maxWidth: "100%",
        border: "none",
        minHeight: "60px",
        background: "transparent",
        display: "block",
      }}
      title="html-render"
    />
  )
}

function ThinkBlock({ content, closed }: { content: string; closed: boolean }) {
  return (
    <details className="rich-think-block" open={!closed}>
      <summary>{closed ? "思考完成" : "思考中..."}</summary>
      <div className="pt-2">
        <MarkdownContent content={content.trim()} />
      </div>
    </details>
  )
}

export function RichMessageContent({ content }: { content: string }) {
  const htmlFence = useMemo(() => extractRenderableHtml(content), [content])
  const [mode, setMode] = useState<"render" | "source">("render")

  if (htmlFence !== undefined) {
    return (
      <div className="space-y-2 w-full min-w-0">
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setMode(prev => prev === "render" ? "source" : "render")}
          >
            {mode === "render" ? "源码" : "渲染"}
          </Button>
        </div>
        {mode === "render" ? (
          <IsolatedHtmlRender html={htmlFence} />
        ) : (
          <pre className="max-h-80 overflow-auto rounded bg-background/80 p-2 text-xs whitespace-pre-wrap">{htmlFence}</pre>
        )}
      </div>
    )
  }

  const segments = splitThinkSegments(content)
  if (segments.some(segment => segment.type === "think")) {
    return (
      <div className="space-y-2">
        {segments.map((segment, index) => (
          segment.type === "think" ? (
            <ThinkBlock key={index} content={segment.content} closed={segment.closed} />
          ) : segment.content ? (
            <MarkdownContent key={index} content={segment.content} />
          ) : null
        ))}
      </div>
    )
  }

  return <MarkdownContent content={content} />
}
