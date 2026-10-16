import App from "@/components/app";
import { notFound } from "next/navigation";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug?: string[] }>;
}) {
  const { slug } = await params;
  const page = slug?.[0] || "landing";
  if (
    (slug?.length || 0) > 1 ||
    ![
      "landing",
      "login",
      "register",
      "dashboard",
      "vision",
      "digital-twin",
      "simulator",
      "analytics",
      "inventory",
      "ai-assistant",
      "reports",
      "settings",
    ].includes(page)
  )
    notFound();
  return <App page={page} />;
}
