/** Formata um valor numérico (ou Decimal do Prisma) como moeda brasileira: R$ 1.234,56 */
export function formatarMoeda(valor: number | string): string {
  const numero = typeof valor === "string" ? Number(valor) : valor;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numero);
}

/** Formata uma data no padrão brasileiro: dd/mm/aaaa */
export function formatarData(data: Date | string): string {
  const dataObj = typeof data === "string" ? new Date(data) : data;
  return new Intl.DateTimeFormat("pt-BR").format(dataObj);
}

/** Formata data e hora no padrão brasileiro: dd/mm/aaaa às HH:mm */
export function formatarDataHora(data: Date | string): string {
  const dataObj = typeof data === "string" ? new Date(data) : data;
  const dataFormatada = new Intl.DateTimeFormat("pt-BR").format(dataObj);
  const horaFormatada = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(dataObj);
  return `${dataFormatada} às ${horaFormatada}`;
}

/** Converte um número (ou Decimal do Prisma) para number puro, com segurança. */
export function paraNumero(valor: number | string): number {
  return typeof valor === "string" ? Number(valor) : valor;
}

/**
 * Transforma um texto em pedaço seguro de nome de arquivo:
 * tira acento, troca o resto por "_" e limpa as pontas.
 * Ex.: "Nápoli Riviera" -> "Napoli_Riviera"
 *
 * Como sobram só letras, números e "_", o resultado pode ir direto para o
 * cabeçalho Content-Disposition sem risco de quebrar com aspas ou acento.
 */
export function paraNomeDeArquivo(texto: string): string {
  return texto
    .normalize("NFD") // separa a letra do acento
    .replace(/[̀-ͯ]/g, "") // remove os acentos
    .replace(/[^a-zA-Z0-9]+/g, "_") // qualquer outro caractere vira _
    .replace(/_+/g, "_") // não deixa _ repetido
    .replace(/^_|_$/g, ""); // tira _ das pontas
}
