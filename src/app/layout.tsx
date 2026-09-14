import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-serif-brand",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Luziére — Gestão de Vendas",
  description: "Sistema interno de gestão de vendas da Luziére.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${playfairDisplay.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/*
          Aplica a preferência de "ocultar valores" ANTES de a página ser
          desenhada. Sem isso os valores apareceriam por um instante antes de
          serem borrados — o que derrubaria o propósito do botão.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('luziere:valores-ocultos')==='1'){document.documentElement.classList.add('valores-ocultos')}}catch(e){}",
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
