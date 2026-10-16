import { redirect } from "next/navigation";
import { cookies } from "next/headers";
export default async function Page() {
  const c = await cookies();
  redirect(c.get("qala_locale")?.value === "ru" ? "/ru" : "/kk");
}
