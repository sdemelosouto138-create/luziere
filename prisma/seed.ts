// Popula o banco com dados de exemplo para testar o sistema.
// Rodar com: npx prisma db seed  (ou automaticamente após `prisma migrate dev`)
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Limpando dados existentes...");
  await prisma.movimentacaoEstoque.deleteMany();
  await prisma.itemPedido.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.imagemProduto.deleteMany();
  await prisma.produto.deleteMany();
  await prisma.categoria.deleteMany();
  await prisma.cliente.deleteMany();

  console.log("Criando categorias...");
  const nomesCategorias = [
    "LED",
    "Spots",
    "Perfil",
    "Pendentes",
    "Fitas",
    "Plafon",
    "Arandela",
    "Lustre",
    "Outros",
  ];
  const categorias = new Map<string, string>();
  for (const nome of nomesCategorias) {
    const categoria = await prisma.categoria.create({ data: { nome } });
    categorias.set(nome, categoria.id);
  }

  console.log("Criando produtos...");
  const produtosSeed = [
    {
      nome: "Lâmpada LED Bulbo 9W",
      sku: "LED-BULB-9W",
      categoria: "LED",
      descricao: "Lâmpada LED bulbo E27, alta eficiência energética.",
      precoCusto: 8.5,
      precoVenda: 19.9,
      unidade: "un",
      potenciaW: 9,
      temperaturaCor: "3000K",
      estoqueAtual: 120,
      estoqueMinimo: 20,
      fornecedor: "Osram",
    },
    {
      nome: "Lâmpada LED Bulbo 12W",
      sku: "LED-BULB-12W",
      categoria: "LED",
      descricao: "Lâmpada LED bulbo E27, luz branca fria.",
      precoCusto: 10.0,
      precoVenda: 24.9,
      unidade: "un",
      potenciaW: 12,
      temperaturaCor: "6500K",
      estoqueAtual: 90,
      estoqueMinimo: 20,
      fornecedor: "Osram",
    },
    {
      nome: "Spot Embutir Quadrado 7W",
      sku: "SPT-EMB-QD-7W",
      categoria: "Spots",
      descricao: "Spot de embutir quadrado para gesso, corpo em alumínio.",
      precoCusto: 22.0,
      precoVenda: 49.9,
      unidade: "un",
      potenciaW: 7,
      temperaturaCor: "3000K",
      estoqueAtual: 45,
      estoqueMinimo: 10,
      fornecedor: "Save Energy",
    },
    {
      nome: "Spot Direcionável Redondo 5W",
      sku: "SPT-DIR-RD-5W",
      categoria: "Spots",
      descricao: "Spot direcionável (olho de boi) para trilho ou embutir.",
      precoCusto: 18.0,
      precoVenda: 42.0,
      unidade: "un",
      potenciaW: 5,
      temperaturaCor: "4000K",
      estoqueAtual: 8,
      estoqueMinimo: 10,
      fornecedor: "Save Energy",
    },
    {
      nome: "Perfil de Embutir em Gesso 2m",
      sku: "PRF-EMB-GESSO-2M",
      categoria: "Perfil",
      descricao: "Perfil de alumínio para embutir em sanca de gesso, com difusor leitoso.",
      precoCusto: 35.0,
      precoVenda: 79.9,
      unidade: "un",
      potenciaW: null,
      temperaturaCor: null,
      estoqueAtual: 30,
      estoqueMinimo: 8,
      fornecedor: "Itaim Iluminação",
    },
    {
      nome: "Perfil de Sobrepor Slim 1m",
      sku: "PRF-SOB-SLIM-1M",
      categoria: "Perfil",
      descricao: "Perfil de sobrepor de alumínio escovado, ideal para prateleiras.",
      precoCusto: 28.0,
      precoVenda: 64.9,
      unidade: "un",
      potenciaW: null,
      temperaturaCor: null,
      estoqueAtual: 25,
      estoqueMinimo: 8,
      fornecedor: "Itaim Iluminação",
    },
    {
      nome: "Pendente Cônico Preto",
      sku: "PND-CONICO-PRETO",
      categoria: "Pendentes",
      descricao: "Pendente cônico em metal preto fosco, soquete E27.",
      precoCusto: 65.0,
      precoVenda: 149.9,
      unidade: "un",
      potenciaW: null,
      temperaturaCor: null,
      estoqueAtual: 15,
      estoqueMinimo: 5,
      fornecedor: "Bella Luce",
    },
    {
      nome: "Pendente Globo Vidro Âmbar",
      sku: "PND-GLOBO-AMBAR",
      categoria: "Pendentes",
      descricao: "Pendente com globo de vidro âmbar soprado, acabamento dourado.",
      precoCusto: 90.0,
      precoVenda: 219.9,
      unidade: "un",
      potenciaW: null,
      temperaturaCor: null,
      estoqueAtual: 4,
      estoqueMinimo: 5,
      fornecedor: "Bella Luce",
    },
    {
      nome: "Fita LED 5050 IP65 (rolo 5m)",
      sku: "FITA-5050-IP65",
      categoria: "Fitas",
      descricao: "Fita de LED 5050, resistente à umidade, rolo com 5 metros.",
      precoCusto: 45.0,
      precoVenda: 99.9,
      unidade: "m",
      potenciaW: 14.4,
      temperaturaCor: "3000K",
      estoqueAtual: 60,
      estoqueMinimo: 15,
      fornecedor: "LedTech",
    },
    {
      nome: "Fita LED COB Dimerizável (rolo 5m)",
      sku: "FITA-COB-DIM",
      categoria: "Fitas",
      descricao: "Fita de LED COB de alta densidade, compatível com dimmer.",
      precoCusto: 70.0,
      precoVenda: 159.9,
      unidade: "m",
      potenciaW: 12,
      temperaturaCor: "4000K",
      estoqueAtual: 18,
      estoqueMinimo: 10,
      fornecedor: "LedTech",
    },
    {
      nome: "Plafon de Sobrepor Redondo 24W",
      sku: "PLF-SOB-RD-24W",
      categoria: "Plafon",
      descricao: "Plafon LED de sobrepor redondo, corpo branco.",
      precoCusto: 40.0,
      precoVenda: 89.9,
      unidade: "un",
      potenciaW: 24,
      temperaturaCor: "6500K",
      estoqueAtual: 32,
      estoqueMinimo: 8,
      fornecedor: "Save Energy",
    },
    {
      nome: "Plafon Quadrado Embutir 18W",
      sku: "PLF-EMB-QD-18W",
      categoria: "Plafon",
      descricao: "Plafon LED quadrado de embutir para forro de gesso.",
      precoCusto: 32.0,
      precoVenda: 74.9,
      unidade: "un",
      potenciaW: 18,
      temperaturaCor: "4000K",
      estoqueAtual: 6,
      estoqueMinimo: 8,
      fornecedor: "Save Energy",
    },
    {
      nome: "Arandela Externa Retangular",
      sku: "ARD-EXT-RET",
      categoria: "Arandela",
      descricao: "Arandela para área externa, corpo em alumínio injetado, IP65.",
      precoCusto: 38.0,
      precoVenda: 89.0,
      unidade: "un",
      potenciaW: 7,
      temperaturaCor: "3000K",
      estoqueAtual: 22,
      estoqueMinimo: 6,
      fornecedor: "Itaim Iluminação",
    },
    {
      nome: "Arandela Interna Meia-Lua",
      sku: "ARD-INT-MEIALUA",
      categoria: "Arandela",
      descricao: "Arandela interna meia-lua para corredores e escadas.",
      precoCusto: 25.0,
      precoVenda: 59.9,
      unidade: "un",
      potenciaW: 5,
      temperaturaCor: "3000K",
      estoqueAtual: 28,
      estoqueMinimo: 6,
      fornecedor: "Bella Luce",
    },
    {
      nome: "Lustre de Cristal 6 Lâmpadas",
      sku: "LST-CRISTAL-6L",
      categoria: "Lustre",
      descricao: "Lustre clássico em metal dourado com pingentes de cristal.",
      precoCusto: 380.0,
      precoVenda: 899.0,
      unidade: "un",
      potenciaW: null,
      temperaturaCor: null,
      estoqueAtual: 5,
      estoqueMinimo: 2,
      fornecedor: "Bella Luce",
    },
  ];

  const produtos = new Map<string, string>();
  for (const p of produtosSeed) {
    const produto = await prisma.produto.create({
      data: {
        nome: p.nome,
        sku: p.sku,
        descricao: p.descricao,
        categoriaId: categorias.get(p.categoria)!,
        precoCusto: p.precoCusto,
        precoVenda: p.precoVenda,
        unidade: p.unidade,
        potenciaW: p.potenciaW,
        temperaturaCor: p.temperaturaCor,
        estoqueAtual: p.estoqueAtual,
        estoqueMinimo: p.estoqueMinimo,
        fornecedor: p.fornecedor,
      },
    });
    produtos.set(p.sku, produto.id);

    await prisma.movimentacaoEstoque.create({
      data: {
        produtoId: produto.id,
        tipo: "ENTRADA",
        quantidade: p.estoqueAtual,
        motivo: "Estoque inicial (carga de cadastro)",
      },
    });
  }

  console.log("Criando clientes...");
  const clientes = await Promise.all([
    prisma.cliente.create({
      data: {
        nome: "Marina Costa Ribeiro",
        telefone: "(11) 98765-4321",
        email: "marina.ribeiro@example.com",
        cpfCnpj: "123.456.789-00",
        cep: "01310-100",
        rua: "Avenida Paulista",
        numero: "1500",
        bairro: "Bela Vista",
        cidade: "São Paulo",
        uf: "SP",
        observacoes: "Prefere contato por WhatsApp após as 18h.",
      },
    }),
    prisma.cliente.create({
      data: {
        nome: "Construtora Horizonte Ltda",
        telefone: "(21) 97654-3210",
        email: "compras@horizonteconstrutora.com.br",
        cpfCnpj: "12.345.678/0001-90",
        cep: "22440-032",
        rua: "Rua Visconde de Pirajá",
        numero: "220",
        bairro: "Ipanema",
        cidade: "Rio de Janeiro",
        uf: "RJ",
        observacoes: "Cliente recorrente, sempre pede nota fiscal.",
      },
    }),
    prisma.cliente.create({
      data: {
        nome: "Roberto Almeida Santos",
        telefone: "(31) 99123-4567",
        email: "roberto.almeida@example.com",
        cpfCnpj: "987.654.321-00",
        cep: "30130-010",
        rua: "Rua da Bahia",
        numero: "800",
        bairro: "Centro",
        cidade: "Belo Horizonte",
        uf: "MG",
        observacoes: null,
      },
    }),
  ]);

  console.log("Criando pedidos de exemplo...");

  // Pedido 1: orçamento em aberto para a Marina
  const itensPedido1 = [
    { sku: "PND-CONICO-PRETO", quantidade: 3, precoUnitario: 149.9 },
    { sku: "LED-BULB-9W", quantidade: 6, precoUnitario: 19.9 },
  ];
  await prisma.pedido.create({
    data: {
      clienteId: clientes[0].id,
      status: "ORCAMENTO",
      desconto: 30,
      descontoTipo: "VALOR",
      frete: 40,
      prazoEntrega: "7 dias úteis após aprovação",
      condicaoPagamento: "50% na aprovação, 50% na entrega",
      observacoes: "Cliente pediu para revisar cor do pendente antes de fechar.",
      validadeDias: 7,
      itens: {
        create: itensPedido1.map((i) => ({
          produtoId: produtos.get(i.sku)!,
          quantidade: i.quantidade,
          precoUnitario: i.precoUnitario,
          subtotal: i.quantidade * i.precoUnitario,
        })),
      },
    },
  });

  // Pedido 2: aprovado para a Construtora, com baixa de estoque
  const itensPedido2 = [
    { sku: "PLF-SOB-RD-24W", quantidade: 10, precoUnitario: 89.9 },
    { sku: "SPT-EMB-QD-7W", quantidade: 20, precoUnitario: 49.9 },
    { sku: "FITA-5050-IP65", quantidade: 15, precoUnitario: 99.9 },
  ];
  const pedido2 = await prisma.pedido.create({
    data: {
      clienteId: clientes[1].id,
      status: "APROVADO",
      desconto: 5,
      descontoTipo: "PERCENTUAL",
      frete: 120,
      prazoEntrega: "15 dias úteis",
      condicaoPagamento: "Boleto 28 dias",
      observacoes: "Entrega na obra do Edifício Horizonte, portaria B.",
      validadeDias: 7,
      itens: {
        create: itensPedido2.map((i) => ({
          produtoId: produtos.get(i.sku)!,
          quantidade: i.quantidade,
          precoUnitario: i.precoUnitario,
          subtotal: i.quantidade * i.precoUnitario,
        })),
      },
    },
  });

  for (const i of itensPedido2) {
    const produtoId = produtos.get(i.sku)!;
    await prisma.produto.update({
      where: { id: produtoId },
      data: { estoqueAtual: { decrement: i.quantidade } },
    });
    await prisma.movimentacaoEstoque.create({
      data: {
        produtoId,
        tipo: "VENDA",
        quantidade: i.quantidade,
        motivo: "Baixa automática por aprovação de pedido",
        pedidoId: pedido2.id,
      },
    });
  }

  console.log("Seed concluído com sucesso.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
