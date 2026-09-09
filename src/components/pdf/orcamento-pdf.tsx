import path from "node:path";
import { readFileSync } from "node:fs";
import { Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer";
import { formatarData, formatarMoeda } from "@/lib/format";

const fontsDir = path.join(process.cwd(), "src", "lib", "fonts");

Font.register({
  family: "Inter",
  fonts: [
    { src: path.join(fontsDir, "Inter-Regular.ttf"), fontWeight: 400 },
    { src: path.join(fontsDir, "Inter-Medium.ttf"), fontWeight: 500 },
    { src: path.join(fontsDir, "Inter-SemiBold.ttf"), fontWeight: 600 },
    { src: path.join(fontsDir, "Inter-Bold.ttf"), fontWeight: 700 },
  ],
});

Font.register({
  family: "Playfair Display",
  fonts: [
    { src: path.join(fontsDir, "PlayfairDisplay-Regular.ttf"), fontWeight: 400 },
    { src: path.join(fontsDir, "PlayfairDisplay-SemiBold.ttf"), fontWeight: 600 },
    { src: path.join(fontsDir, "PlayfairDisplay-Bold.ttf"), fontWeight: 700 },
  ],
});

const GRAFITE = "#2B2B2B";
const DOURADO = "#B8873A";
const CREME = "#F2EFE9";
const CINZA = "#6B6459";
const BORDA = "#DDD6C8";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 9.5,
    color: GRAFITE,
    padding: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: DOURADO,
    paddingBottom: 16,
    marginBottom: 20,
  },
  marca: {
    fontFamily: "Playfair Display",
    fontSize: 26,
    fontWeight: 600,
    color: GRAFITE,
  },
  marcaAccent: {
    color: DOURADO,
  },
  tagline: {
    fontSize: 8,
    color: CINZA,
    letterSpacing: 2,
    marginTop: 2,
  },
  lojaInfo: {
    textAlign: "right",
    fontSize: 8.5,
    color: CINZA,
    lineHeight: 1.5,
  },
  tituloDocumento: {
    fontFamily: "Playfair Display",
    fontSize: 16,
    marginBottom: 4,
  },
  subinfo: {
    fontSize: 9,
    color: CINZA,
    marginBottom: 16,
  },
  secao: {
    marginBottom: 16,
  },
  secaoTitulo: {
    fontSize: 8,
    fontWeight: 700,
    color: DOURADO,
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  clienteBox: {
    backgroundColor: CREME,
    borderRadius: 4,
    padding: 12,
  },
  clienteNome: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 3,
  },
  clienteLinha: {
    fontSize: 9,
    color: CINZA,
  },
  tabela: {
    borderTopWidth: 1,
    borderTopColor: BORDA,
  },
  tabelaHeader: {
    flexDirection: "row",
    backgroundColor: GRAFITE,
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  tabelaHeaderTexto: {
    color: CREME,
    fontSize: 8.5,
    fontWeight: 700,
    textTransform: "uppercase",
  },
  tabelaLinha: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDA,
  },
  colProduto: { width: "46%" },
  colQtd: { width: "12%", textAlign: "center" },
  colPreco: { width: "21%", textAlign: "right" },
  colSubtotal: { width: "21%", textAlign: "right" },
  produtoNome: { fontSize: 9.5, fontWeight: 500 },
  produtoSku: { fontSize: 7.5, color: CINZA, marginTop: 1 },
  totaisBox: {
    alignSelf: "flex-end",
    width: 220,
    marginTop: 12,
  },
  totalLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  totalLabel: { color: CINZA, fontSize: 9.5 },
  totalValor: { fontSize: 9.5 },
  totalFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1.5,
    borderTopColor: GRAFITE,
    marginTop: 4,
    paddingTop: 6,
  },
  totalFinalLabel: {
    fontFamily: "Playfair Display",
    fontSize: 13,
  },
  totalFinalValor: {
    fontFamily: "Playfair Display",
    fontSize: 15,
    color: DOURADO,
    fontWeight: 700,
  },
  condicoesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  condicaoItem: {
    width: "50%",
    marginBottom: 8,
  },
  condicaoLabel: {
    fontSize: 8,
    color: CINZA,
    marginBottom: 2,
  },
  condicaoValor: {
    fontSize: 9.5,
  },
  observacoesTexto: {
    fontSize: 9,
    color: GRAFITE,
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: BORDA,
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerTexto: {
    fontSize: 7.5,
    color: CINZA,
  },
  validadeBox: {
    backgroundColor: CREME,
    borderRadius: 4,
    padding: 10,
    marginTop: 16,
  },
  validadeTexto: {
    fontSize: 8.5,
    color: CINZA,
    textAlign: "center",
  },
});

export type OrcamentoPdfData = {
  numero: number;
  criadoEm: Date;
  validadeDias: number;
  desconto: number;
  descontoTipo: string;
  frete: number;
  prazoEntrega: string | null;
  condicaoPagamento: string | null;
  observacoes: string | null;
  cliente: {
    nome: string;
    telefone: string | null;
    email: string | null;
    rua: string | null;
    numero: string | null;
    bairro: string | null;
    cidade: string | null;
    uf: string | null;
  };
  itens: {
    quantidade: number;
    precoUnitario: number;
    subtotal: number;
    produto: { nome: string; sku: string | null; unidade: string };
  }[];
  loja: {
    nome: string;
    telefone: string;
    email: string;
    endereco: string;
    cnpj: string;
  };
  subtotal: number;
  valorDesconto: number;
  total: number;
};

export function OrcamentoPdf({ dados }: { dados: OrcamentoPdfData }) {
  const enderecoCliente = [
    dados.cliente.rua && dados.cliente.numero ? `${dados.cliente.rua}, ${dados.cliente.numero}` : dados.cliente.rua,
    dados.cliente.bairro,
    dados.cliente.cidade && dados.cliente.uf ? `${dados.cliente.cidade}/${dados.cliente.uf}` : dados.cliente.cidade,
  ]
    .filter(Boolean)
    .join(" — ");

  return (
    <Document title={`Orcamento-${dados.numero}-Luziere`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Image
              // Passar o arquivo como Buffer evita que um caminho Windows (C:\...) seja lido como URL.
              src={{ data: readFileSync(path.join(process.cwd(), "public", "logo-simbolo-claro.png")), format: "png" }}
              style={{ width: 44, height: 51, borderRadius: 6 }}
            />
            <View>
              <Text style={styles.marca}>
                Luzi<Text style={styles.marcaAccent}>è</Text>re
              </Text>
              <Text style={styles.tagline}>ILUMINAÇÃO RESIDENCIAL</Text>
            </View>
          </View>
          <View style={styles.lojaInfo}>
            <Text>{dados.loja.nome}</Text>
            {dados.loja.telefone ? <Text>{dados.loja.telefone}</Text> : null}
            {dados.loja.email ? <Text>{dados.loja.email}</Text> : null}
            {dados.loja.endereco ? <Text>{dados.loja.endereco}</Text> : null}
            {dados.loja.cnpj ? <Text>CNPJ: {dados.loja.cnpj}</Text> : null}
          </View>
        </View>

        <Text style={styles.tituloDocumento}>Orçamento nº {dados.numero}</Text>
        <Text style={styles.subinfo}>Emitido em {formatarData(dados.criadoEm)}</Text>

        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Cliente</Text>
          <View style={styles.clienteBox}>
            <Text style={styles.clienteNome}>{dados.cliente.nome}</Text>
            {dados.cliente.telefone ? <Text style={styles.clienteLinha}>{dados.cliente.telefone}</Text> : null}
            {dados.cliente.email ? <Text style={styles.clienteLinha}>{dados.cliente.email}</Text> : null}
            {enderecoCliente ? <Text style={styles.clienteLinha}>{enderecoCliente}</Text> : null}
          </View>
        </View>

        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Itens</Text>
          <View style={styles.tabela}>
            <View style={styles.tabelaHeader}>
              <Text style={[styles.tabelaHeaderTexto, styles.colProduto]}>Produto</Text>
              <Text style={[styles.tabelaHeaderTexto, styles.colQtd]}>Qtd.</Text>
              <Text style={[styles.tabelaHeaderTexto, styles.colPreco]}>Preço unit.</Text>
              <Text style={[styles.tabelaHeaderTexto, styles.colSubtotal]}>Subtotal</Text>
            </View>
            {dados.itens.map((item, index) => (
              <View style={styles.tabelaLinha} key={index} wrap={false}>
                <View style={styles.colProduto}>
                  <Text style={styles.produtoNome}>{item.produto.nome}</Text>
                  {item.produto.sku ? <Text style={styles.produtoSku}>{item.produto.sku}</Text> : null}
                </View>
                <Text style={styles.colQtd}>
                  {item.quantidade} {item.produto.unidade}
                </Text>
                <Text style={styles.colPreco}>{formatarMoeda(item.precoUnitario)}</Text>
                <Text style={styles.colSubtotal}>{formatarMoeda(item.subtotal)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.totaisBox}>
            <View style={styles.totalLinha}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValor}>{formatarMoeda(dados.subtotal)}</Text>
            </View>
            <View style={styles.totalLinha}>
              <Text style={styles.totalLabel}>
                Desconto {dados.descontoTipo === "PERCENTUAL" ? `(${dados.desconto}%)` : ""}
              </Text>
              <Text style={styles.totalValor}>- {formatarMoeda(dados.valorDesconto)}</Text>
            </View>
            <View style={styles.totalLinha}>
              <Text style={styles.totalLabel}>Frete</Text>
              <Text style={styles.totalValor}>{formatarMoeda(dados.frete)}</Text>
            </View>
            <View style={styles.totalFinal}>
              <Text style={styles.totalFinalLabel}>Total</Text>
              <Text style={styles.totalFinalValor}>{formatarMoeda(dados.total)}</Text>
            </View>
          </View>
        </View>

        {dados.prazoEntrega || dados.condicaoPagamento || dados.observacoes ? (
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Condições</Text>
          <View style={styles.condicoesGrid}>
            {dados.prazoEntrega ? (
              <View style={styles.condicaoItem}>
                <Text style={styles.condicaoLabel}>Prazo de entrega</Text>
                <Text style={styles.condicaoValor}>{dados.prazoEntrega}</Text>
              </View>
            ) : null}
            {dados.condicaoPagamento ? (
              <View style={styles.condicaoItem}>
                <Text style={styles.condicaoLabel}>Condição de pagamento</Text>
                <Text style={styles.condicaoValor}>{dados.condicaoPagamento}</Text>
              </View>
            ) : null}
          </View>
          {dados.observacoes ? (
            <View style={{ marginTop: 4 }}>
              <Text style={styles.condicaoLabel}>Observações</Text>
              <Text style={styles.observacoesTexto}>{dados.observacoes}</Text>
            </View>
          ) : null}
        </View>
        ) : null}

        <View style={styles.validadeBox}>
          <Text style={styles.validadeTexto}>
            Este orçamento é válido por {dados.validadeDias} dias a partir da data de emissão.
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerTexto}>{dados.loja.nome} · Iluminação Residencial Premium</Text>
          <Text
            style={styles.footerTexto}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
