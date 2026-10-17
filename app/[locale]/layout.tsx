import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { MathJaxContext } from "better-react-mathjax";
import clsx from "clsx";

import { Providers } from "@/app/providers";
import { routing } from "@/i18n/routing";
import { fontSans, fontMono } from "@/config/fonts";

export const metadata: Metadata = {
  title: "StudyBuddy",
  description: "Focused SAT preparation platform.",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

const mathJaxConfig = {
  loader: { load: ["input/tex", "output/chtml"] },
  tex: {
    inlineMath: [
      ["$", "$"],
      ["\\(", "\\)"],
    ],
    displayMath: [
      ["$$", "$$"],
      ["\\[", "\\]"],
    ],
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages({ locale });

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={clsx(fontSans.variable, fontMono.variable)}
    >
      <body className="min-h-screen bg-white font-sans text-slate-900 antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <MathJaxContext config={mathJaxConfig}>
              {children}
            </MathJaxContext>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}