import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import kk from "@/messages/kk.json";
import ru from "@/messages/ru.json";
export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!["kk", "ru"].includes(locale)) notFound();
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "ru" ? ru : kk}
      timeZone="Asia/Qyzylorda"
    >
      {children}
    </NextIntlClientProvider>
  );
}
