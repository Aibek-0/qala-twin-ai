import "@fontsource-variable/inter";
import "@fontsource-variable/manrope";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "QALA TWIN AI — Business Intelligence",
  description: "Бизнесіңіздің цифрлық егізі. Цифровой двойник вашего бизнеса.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="kk" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
