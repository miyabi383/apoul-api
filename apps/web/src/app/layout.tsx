import { Nunito, Zen_Maru_Gothic } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ja } from "@/lib/i18n/ja";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

const zenMaru = Zen_Maru_Gothic({
  subsets: ["latin"],
  variable: "--font-ja",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: `${ja.app.name} ${ja.app.admin}`,
  description: ja.app.subtitle,
};

const themeScript = `(function(){try{var t=localStorage.getItem('apoul-theme');document.documentElement.setAttribute('data-theme',t==='dark'?'dark':'light');}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning className={`${nunito.variable} ${zenMaru.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
