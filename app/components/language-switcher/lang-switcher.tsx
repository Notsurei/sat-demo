"use client";

import {Button} from "@heroui/react";
import {useLocale} from "next-intl";
import {usePathname, useRouter} from "@/i18n/navigation";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const nextLocale = locale === "en" ? "vi" : "en";

  const handleChangeLanguage = () => {
    router.replace(pathname, {
      locale: nextLocale,
    });
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onPress={handleChangeLanguage}
    >
      {locale === "en" ? "🇻🇳 VI" : "🇺🇸 EN"}
    </Button>
  );
}