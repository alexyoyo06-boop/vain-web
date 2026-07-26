import PolicyPage from "@/components/PolicyPage";
import { getLocale } from "@/lib/i18n/server";
import { getPolicyCopy } from "@/lib/i18n/policies";

const KEY = "terms-of-service" as const;

export async function generateMetadata() {
  const copy = await getPolicyCopy(await getLocale(), KEY);
  return { title: `${copy.title} — VAIN` };
}

export default async function TermsOfServicePage() {
  const copy = await getPolicyCopy(await getLocale(), KEY);
  return <PolicyPage copy={copy} />;
}
