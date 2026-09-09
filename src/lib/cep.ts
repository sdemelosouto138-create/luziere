export type EnderecoCep = {
  rua: string;
  bairro: string;
  cidade: string;
  uf: string;
};

/** Mantém só os dígitos e limita a 8, que é o tamanho do CEP brasileiro. */
export function apenasDigitosCep(valor: string): string {
  return valor.replace(/\D/g, "").slice(0, 8);
}

/** Formata como 00000-000 enquanto a pessoa digita. */
export function formatarCep(valor: string): string {
  const digitos = apenasDigitosCep(valor);
  if (digitos.length <= 5) return digitos;
  return `${digitos.slice(0, 5)}-${digitos.slice(5)}`;
}

/**
 * Busca o endereço a partir do CEP.
 * Usa o ViaCEP e, se ele não responder, tenta a BrasilAPI.
 * Retorna null quando o CEP não existe ou nenhum serviço está disponível.
 */
export async function buscarEnderecoPorCep(cep: string): Promise<EnderecoCep | null> {
  const digitos = apenasDigitosCep(cep);
  if (digitos.length !== 8) return null;

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
    if (resposta.ok) {
      const dados = await resposta.json();
      // O ViaCEP responde { erro: true } quando o CEP não existe.
      if (dados?.erro) return null;
      return {
        rua: dados.logradouro ?? "",
        bairro: dados.bairro ?? "",
        cidade: dados.localidade ?? "",
        uf: dados.uf ?? "",
      };
    }
  } catch {
    // Serviço fora do ar: cai para a alternativa abaixo.
  }

  try {
    const resposta = await fetch(`https://brasilapi.com.br/api/cep/v2/${digitos}`);
    if (!resposta.ok) return null;
    const dados = await resposta.json();
    return {
      rua: dados.street ?? "",
      bairro: dados.neighborhood ?? "",
      cidade: dados.city ?? "",
      uf: dados.state ?? "",
    };
  } catch {
    return null;
  }
}
