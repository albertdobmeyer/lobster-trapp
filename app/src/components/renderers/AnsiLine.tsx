import { parseAnsi, type AnsiSpan } from "./ansi";

interface AnsiLineProps {
  text: string;
}

function spanStyle(span: AnsiSpan): React.CSSProperties | undefined {
  const style: React.CSSProperties = {};
  let hasStyle = false;

  if (span.fg) {
    style.color = span.fg;
    hasStyle = true;
  }
  if (span.bg) {
    style.backgroundColor = span.bg;
    hasStyle = true;
  }
  if (span.bold) {
    style.fontWeight = "bold";
    hasStyle = true;
  }
  if (span.dim) {
    style.opacity = 0.6;
    hasStyle = true;
  }
  if (span.italic) {
    style.fontStyle = "italic";
    hasStyle = true;
  }
  if (span.underline) {
    style.textDecoration = "underline";
    hasStyle = true;
  }

  return hasStyle ? style : undefined;
}

/** Renders a single line of text with ANSI color codes as styled spans. */
export default function AnsiLine({ text }: AnsiLineProps) {
  const spans = parseAnsi(text);

  // Fast path: single unstyled span
  if (spans.length === 1 && !spans[0].fg && !spans[0].bg && !spans[0].bold) {
    return <>{spans[0].text}</>;
  }

  return (
    <>
      {spans.map((span, i) => {
        const style = spanStyle(span);
        return style ? (
          <span key={i} style={style}>
            {span.text}
          </span>
        ) : (
          <span key={i}>{span.text}</span>
        );
      })}
    </>
  );
}
