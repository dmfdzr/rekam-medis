import "server-only"

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
}

function wrapLine(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return [value]
  }

  const words = value.split(" ")
  const lines: string[] = []
  let currentLine = ""

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word

    if (nextLine.length > maxLength && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = nextLine
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

function paginate(lines: string[]) {
  const wrappedLines = lines.flatMap((line) => wrapLine(line, 96))
  const pageLineLimit = 48
  const pages: string[][] = []

  for (let index = 0; index < wrappedLines.length; index += pageLineLimit) {
    pages.push(wrappedLines.slice(index, index + pageLineLimit))
  }

  return pages.length > 0 ? pages : [["Tidak ada data"]]
}

export function buildReportPdf(lines: string[]) {
  const pages = paginate(lines)
  const objects: string[] = []

  objects.push("<< /Type /Catalog /Pages 2 0 R >>")

  const pageObjectIds = pages.map((_, index) => 4 + index * 2)
  objects.push(`<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`)
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

  pages.forEach((pageLines, index) => {
    const pageObjectId = 4 + index * 2
    const contentObjectId = pageObjectId + 1
    const content = [
      "BT",
      "/F1 10 Tf",
      "14 TL",
      "42 800 Td",
      ...pageLines.map((line) => `(${escapePdfText(line)}) Tj T*`),
      "ET",
    ].join("\n")

    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectId} 0 R >>`)
    objects.push(`<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`)
  })

  const chunks = ["%PDF-1.4\n"]
  const offsets = [0]

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(chunks.join(""), "utf8"))
    chunks.push(`${index + 1} 0 obj\n${object}\nendobj\n`)
  })

  const xrefOffset = Buffer.byteLength(chunks.join(""), "utf8")
  chunks.push(`xref\n0 ${objects.length + 1}\n`)
  chunks.push("0000000000 65535 f \n")
  offsets.slice(1).forEach((offset) => {
    chunks.push(`${String(offset).padStart(10, "0")} 00000 n \n`)
  })
  chunks.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`)

  return Buffer.from(chunks.join(""), "utf8")
}
