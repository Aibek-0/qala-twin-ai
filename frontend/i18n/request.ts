import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import kk from "@/messages/kk.json";
import ru from "@/messages/ru.json";
export default getRequestConfig(async () => {
  const c = await cookies();
  const locale = c.get("qala_locale")?.value === "ru" ? "ru" : "kk";
  return {
    locale,
    messages: locale === "ru" ? ru : kk,
    timeZone: "Asia/Qyzylorda",
  };
});
