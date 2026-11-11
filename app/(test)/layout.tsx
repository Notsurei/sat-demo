import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import { siteConfig } from "@/config/site";
import { MathJaxContext } from "better-react-mathjax";
import SessionMonitor from "../components/modal-button/session-monitor";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

const config = {
  loader: {
    load: ["input/tex", "output/chtml"],
  },
  tex: {
    inlineMath: [["$", "$"], ["\\(", "\\)"]],
    displayMath: [["$$", "$$"], ["\\[", "\\]"]],
  },
};

/* Test routes không có [locale] trong URL → dùng "en" */
const TEST_LOCALE = "en";

export default async function TestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages({ locale: TEST_LOCALE });

  return (
    <html lang={TEST_LOCALE} suppressHydrationWarning>
      <body className="min-h-screen bg-white text-slate-900">
        <NextIntlClientProvider locale={TEST_LOCALE} messages={messages}>
          <div className="relative flex min-h-screen flex-col">
            <main>
              <MathJaxContext config={config}>{children}</MathJaxContext>
              <SessionMonitor />
            </main>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}