import path from "node:path";
import { readFileSync } from "node:fs";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { formatarData } from "@/lib/format";
import type { GrupoDeCompra } from "@/lib/compras";

// As fontes já são registradas em orcamento-pdf.tsx, que é importado no mesmo processo.
import "./orcamento-pdf";

const GRAFITE = "#2B2B2B";
const DOURADO = "#B8873A";
const CREME = "#F2EFE9";
const CINZA = "#6B6459";
const BORDA = "#DDD6C8";

const styles = StyleSheet.create({
  page: { fontFamily: "Inter", fontSize: 9.5, color: GRAFITE, padding: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: DOURADO,
    paddingBottom: 16,
    marginBottom: 20,
  },
  marca: { fontFamily: "Playfair Display", fontSize: 26, fontWeight: 600, color: GRAFITE },
  marcaAccent: { color: DOURADO },
  tagline: { fontSize: 8, color: CINZA, letterSpacing: 2, marginTop: 2 },
  lojaInfo: { textAlign: "right", fontSize: 8.5, color: CINZA, lineHeight: 1.5 },
  tituloDocumento: { fontFamily: "Playfair Display", fontSize: 16, marginBottom: 4 },
  subinfo: { fontSize: 9, color: CINZA, marginBottom: 16 },

  fornecedorBloco: { marginBottom: 20 },
  fornecedorNome: {
    fontFamily: "Playfair Display",
    fontSize: 13,
    marginBottom: 6,
  },
  tabelaHeader: {
    flexDirection: "row",
    backgroundColor: GRAFITE,
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  tabelaHeaderTexto: { color: CREME, fontSize: 8.5, fontWeight: 700, textTransform: "uppercase" },
  linha: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDA,
  },
  colCodigo: { width: "22%" },
  colProduto: { width: "56%" },
  colQtd: { width: "22%", textAlign: "right" },
  codigoTexto: { fontSize: 9.5, fontWeight: 700 },
  semCodigo: { fontSize: 8.5, color: CINZA },
  produtoNome: { fontSize: 9.5 },
  produtoPedidos: { fontSize: 7.5, color: CINZA, marginTop: 1 },
  quantidade: { fontSize: 10, fontWeight: 700 },
  resumo: { fontSize: 8.5, color: CINZA, marginTop: 6, textAlign: "right" },

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
  footerTexto: { fontSize: 7.5, color: CINZA },
});

export type CompraPdfData = {
  grupos: GrupoDeCompra[];
  geradoEm: Date;
  /** Números dos pedidos considerados na lista. */
  pedidos: number[];
  loja: { nome: string; telefone: string; email: string; cnpj: string };
};

export function CompraPdf({ dados }: { dados: CompraPdfData }) {
  const titulo =
    dados.grupos.length === 1 ? `Pedido de compra · ${dados.grupos[0].fornecedorNome}` : "Pedido de compra";

  return (
    <Document title={`Compra-Luziere-${formatarData(dados.geradoEm).replace(/\//g, "-")}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Image
              src={{
                data: readFileSync(path.join(process.cwd(), "public", "logo-simbolo-claro.png")),
                format: "png",
              }}
              style={{ width: 44, height: 51, borderRadius: 6 }}
            />
            <View>
              <Text style={styles.marca}>
                Luzi<Text style={styles.marcaAccent}>é</Text>re
              </Text>
              <Text style={styles.tagline}>ILUMINAÇÃO RESIDENCIAL</Text>
            </View>
          </View>
          <View style={styles.lojaInfo}>
            <Text>{dados.loja.nome}</Text>
            {dados.loja.telefone ? <Text>{dados.loja.telefone}</Text> : null}
            {dados.loja.email ? <Text>{dados.loja.email}</Text> : null}
            {dados.loja.cnpj ? <Text>CNPJ: {dados.loja.cnpj}</Text> : null}
          </View>
        </View>

        <Text style={styles.tituloDocumento}>{titulo}</Text>
        <Text style={styles.subinfo}>
          Gerado em {formatarData(dados.geradoEm)}
          {dados.pedidos.length > 0
            ? ` · referente aos pedidos ${dados.pedidos.map((n) => `#${n}`).join(", ")}`
            : ""}
        </Text>

        {dados.grupos.map((grupo) => (
          <View key={grupo.fornecedorId ?? "sem"} style={styles.fornecedorBloco}>
            {dados.grupos.length > 1 ? <Text style={styles.fornecedorNome}>{grupo.fornecedorNome}</Text> : null}

            <View style={styles.tabelaHeader}>
              <Text style={[styles.tabelaHeaderTexto, styles.colCodigo]}>Código</Text>
              <Text style={[styles.tabelaHeaderTexto, styles.colProduto]}>Produto</Text>
              <Text style={[styles.tabelaHeaderTexto, styles.colQtd]}>Quantidade</Text>
            </View>

            {grupo.itens.map((item) => (
              <View style={styles.linha} key={item.produtoId} wrap={false}>
                <View style={styles.colCodigo}>
                  {item.sku ? (
                    <Text style={styles.codigoTexto}>{item.sku}</Text>
                  ) : (
                    <Text style={styles.semCodigo}>sem código</Text>
                  )}
                </View>
                <View style={styles.colProduto}>
                  <Text style={styles.produtoNome}>{item.nome}</Text>
                  <Text style={styles.produtoPedidos}>
                    Pedidos {item.pedidos.map((n) => `#${n}`).join(", ")}
                  </Text>
                </View>
                <Text style={[styles.quantidade, styles.colQtd]}>
                  {item.quantidade} {item.unidade}
                </Text>
              </View>
            ))}

            <Text style={styles.resumo}>
              {grupo.itens.length} {grupo.itens.length === 1 ? "item" : "itens"} ·{" "}
              {grupo.itens.reduce((soma, i) => soma + i.quantidade, 0)} peças no total
            </Text>
          </View>
        ))}

        <View style={styles.footer} fixed>
          <Text style={styles.footerTexto}>{dados.loja.nome} · Pedido de compra</Text>
          <Text
            style={styles.footerTexto}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
