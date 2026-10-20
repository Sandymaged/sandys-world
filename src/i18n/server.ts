import "server-only";
import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { isLocale, type Locale } from "./config";
import { translator } from "./t";

export async function getLocale(): Promise<Locale> {
  const l = await lang();
  if (!l || !isLocale(l)) notFound();
  return l;
}

export async function getT() {
  return translator(await getLocale());
}
