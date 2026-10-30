function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inline(value: string): string {
  return escapeHtml(value)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

function isTableRow(line: string): boolean {
  return line.trim().startsWith('|') && line.trim().endsWith('|');
}

function isDividerRow(line: string): boolean {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());
}

function tableHtml(rows: string[]): string {
  const parsed = rows
    .filter((row) => !isDividerRow(row))
    .map((row) =>
      row
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((cell) => inline(cell.trim())),
    );
  if (!parsed.length) return '';
  const [head, ...body] = parsed;
  const headHtml = head.map((cell) => `<th>${cell}</th>`).join('');
  const bodyHtml = body
    .map((cells) => `<tr>${cells.map((cell) => `<td>${cell}</td>`).join('')}</tr>`)
    .join('');
  return `<table><thead><tr>${headHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`;
}

/** Render the markdown used in blog posts (headings, lists, links, tables). */
export function renderMarkdown(source: string): string {
  const withoutFrontmatter = source.replace(/^---[\s\S]*?---\s*/, '');
  const withoutGallery = withoutFrontmatter.split(/\n---\s*\n## Project Gallery/)[0];
  const lines = withoutGallery.replace(/\r/g, '').split('\n');
  const html: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith('### ')) {
      html.push(`<h3>${inline(trimmed.slice(4))}</h3>`);
      index += 1;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      html.push(`<h2>${inline(trimmed.slice(3))}</h2>`);
      index += 1;
      continue;
    }
    if (trimmed.startsWith('# ')) {
      html.push(`<h2>${inline(trimmed.slice(2))}</h2>`);
      index += 1;
      continue;
    }

    if (isTableRow(trimmed)) {
      const rows: string[] = [];
      while (index < lines.length && isTableRow(lines[index].trim())) {
        rows.push(lines[index].trim());
        index += 1;
      }
      html.push(tableHtml(rows));
      continue;
    }

    if (/^[-*] /.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*] /.test(lines[index].trim())) {
        items.push(`<li>${inline(lines[index].trim().replace(/^[-*] /, ''))}</li>`);
        index += 1;
      }
      html.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    if (/^\d+\. /.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\. /.test(lines[index].trim())) {
        items.push(`<li>${inline(lines[index].trim().replace(/^\d+\. /, ''))}</li>`);
        index += 1;
      }
      html.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    const paragraph: string[] = [trimmed];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().startsWith('#') &&
      !/^[-*] /.test(lines[index].trim()) &&
      !/^\d+\. /.test(lines[index].trim()) &&
      !isTableRow(lines[index].trim())
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    html.push(`<p>${inline(paragraph.join(' '))}</p>`);
  }

  return html.join('\n');
}
