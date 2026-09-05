/**
 * Remove acentos de uma string usando Normalização Unicode (NFD) e converte para lowercase.
 * Ex: "  Eunápolis  " → "eunapolis"
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // Remove marcas de acentuação
    .toLowerCase()
    .trim()
}

/**
 * Calcula a distância de Levenshtein entre duas strings.
 * Usada para fuzzy matching de nomes de bairros.
 */
export function levenshteinDistance(a: string, b: string): number {
  const lenA = a.length
  const lenB = b.length

  // Casos rápidos
  if (lenA === 0) return lenB
  if (lenB === 0) return lenA

  // Matriz de programação dinâmica
  const matrix: number[][] = Array.from({ length: lenA + 1 }, (_, i) =>
    Array.from({ length: lenB + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )

  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deleção
        matrix[i][j - 1] + 1,      // inserção
        matrix[i - 1][j - 1] + custo // substituição
      )
    }
  }

  return matrix[lenA][lenB]
}

/**
 * Encontra o bairro existente mais similar ao nome fornecido.
 * Retorna o bairro e a distância, ou null se nenhum estiver dentro do limiar.
 */
export function findClosestMatch<T extends { nome: string }>(
  target: string,
  candidates: T[],
  maxDistance: number = 3
): { item: T; distance: number } | null {
  const normalizedTarget = normalizeText(target)
  let closest: { item: T; distance: number } | null = null

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeText(candidate.nome)
    const distance = levenshteinDistance(normalizedTarget, normalizedCandidate)

    if (distance <= maxDistance && (!closest || distance < closest.distance)) {
      closest = { item: candidate, distance }
    }
  }

  return closest
}
