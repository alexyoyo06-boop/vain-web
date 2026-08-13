import PolicyPage from "@/components/PolicyPage";
import { getPolicyCopy } from "@/lib/i18n/policies";
import { localeParam } from "@/lib/i18n/params";

const KEY = "legal-notice" as const;

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params) {
  const locale = localeParam((await params).locale);
  const copy = await getPolicyCopy(locale, KEY);
  return { title: `${copy.title} — VAIN` };
}

export default async function LegalNoticePage({ params }: Params) {
  const locale = localeParam((await params).locale);
  const copy = await getPolicyCopy(locale, KEY);
  return <PolicyPage copy={copy} />;
}
