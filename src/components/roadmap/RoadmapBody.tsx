/**
 * Renders an item's plain-text body: blank lines separate paragraphs, and lines
 * starting "- " become a bulleted list. Plain text keeps admin editing simple
 * and means nothing a user typed is ever rendered as HTML.
 */
export function RoadmapBody({ text }: { text: string }) {
  const blocks = text.trim().split(/\n\s*\n/).filter(Boolean);
  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-300">
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines.map((l, j) => (
                <li key={j}>{l.slice(2)}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{lines.join(" ")}</p>;
      })}
    </div>
  );
}
