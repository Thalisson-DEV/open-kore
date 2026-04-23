/**
 * Estima quantas linhas visuais o texto ocupa,
 * considerando word wrap na largura disponível.
 */
export function estimateWrappedLines(text: string, availableWidth: number): number {
  if (!text || availableWidth <= 0) return 1

  // Descontar prefixo "> " e padding (2 chars de paddingX = 4 cols total + borda)
  const usableWidth = Math.max(availableWidth - 6, 20)

  return text.split('\n').reduce((total, line) => {
    if (line.length === 0) return total + 1
    return total + Math.ceil(line.length / usableWidth)
  }, 0)
}
