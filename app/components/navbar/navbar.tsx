"use client";

import { useState } from "react";
import { Button, Chip, Skeleton } from "@heroui/react";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import axios from "axios";
import { ArrowLeftFromLine, Bars, Xmark } from "@gravity-ui/icons";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { siteConfig } from "@/config/site";
import { Logo } from "@/app/components/icons-list/icons";
import { useAuthStore } from "@/zustand/auth-store";
import AuthModal from "../modal-button/auth-modal";
import LanguageSwitcher from "@/app/components/language-switcher/lang-switcher";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("nav");

  const { isAuthenticated, isLoading, user, logout } = useAuthStore();

  const handleLogout = async () => {
    setIsLogoutLoading(true);

    try {
      await axios.post(
        "/api/auth/logout",
        {},
        {
          withCredentials: true,
        },
      );

      localStorage.removeItem("token");
      logout();

      setIsMenuOpen(false);
      router.replace("/");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLogoutLoading(false);
    }
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const planLabel =
    user?.subscriptionPlan === "FREE"
      ? t("freePlan")
      : user?.subscriptionPlan || t("freePlan");

  const displayName = user?.firstName || t("student");

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-primary/15 bg-background/95 shadow-sm backdrop-blur-md">
      <header className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-5 sm:px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            onClick={() => setIsMenuOpen(false)}
            className="group flex items-center gap-2"
          >
            <div
              className={clsx(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                "bg-primary text-primary-foreground",
                "shadow-sm shadow-primary/25",
                "transition-all duration-200",
                "group-hover:scale-105 group-hover:shadow-md",
              )}
            >
              <Logo />
            </div>

            <div className="hidden flex-col leading-none sm:flex">
              <p className="text-base font-bold tracking-tight text-foreground">
                {t("brand")}
              </p>

              <p className="mt-1 text-[10.5px] font-medium uppercase leading-[1.6] tracking-[0.14em] text-primary/80">
                {t("brandTagline")}
              </p>
            </div>
          </Link>

          {!isLoading && isAuthenticated && (
            <ul className="hidden items-center gap-1 lg:flex">
              {siteConfig.navItems.map((item) => {
                const active = isActive(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={clsx(
                        "group relative rounded-xl px-3.5 py-2 text-sm font-semibold",
                        "transition-all duration-200",

                        active
                          ? [
                            "bg-primary",
                            "text-primary-foreground",
                            "border border-primary",
                            "shadow-md shadow-primary/25",
                          ]
                          : [
                            "border border-transparent",
                            "text-default-600",
                            "hover:border-primary/20",
                            "hover:bg-primary/10",
                            "hover:text-primary",
                          ],
                      )}
                    >
                      {t(item.labelKey)}

                      <span
                        className={clsx(
                          "absolute -bottom-1 left-1/2 h-1 w-6",
                          "-translate-x-1/2 rounded-full",
                          "bg-primary",
                          "transition-all duration-200",

                          active
                            ? "scale-100 opacity-100"
                            : "scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-70",
                        )}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 md:flex">
            <LanguageSwitcher />

            {isLoading ? (
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-accent/20 px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-20 rounded-md" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                  <Skeleton className="mt-1 h-3 w-32 rounded-md" />
                </div>
                <Skeleton className="h-9 w-24 rounded-xl" />
              </div>
            ) : isAuthenticated ? (
              <>
                {user && (
                  <div
                    className={clsx(
                      "rounded-xl border border-accent/20",
                      "px-3 py-1.5",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <p className="max-w-[140px] truncate text-sm font-bold">
                        {displayName}
                      </p>

                      <Chip
                        size="sm"
                        color="accent"
                        variant="primary"
                        className="shrink-0 font-bold"
                      >
                        {planLabel}
                      </Chip>
                    </div>

                    <p className="max-w-[160px] truncate text-[11px] text-default-400">
                      {user.email}
                    </p>
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onPress={handleLogout}
                  isDisabled={isLogoutLoading}
                  className={clsx(
                    "rounded-xl text-default-500",
                    "transition-colors",
                    "hover:bg-danger/10 hover:text-danger",
                  )}
                >
                  <ArrowLeftFromLine width={16} />

                  {isLogoutLoading ? t("loggingOut") : t("logout")}
                </Button>
              </>
            ) : (
              <AuthModal />
            )}
          </div>

          <button
            type="button"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? t("closeMenu") : t("openMenu")}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={clsx(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              "border border-primary/10",
              "bg-primary/5 text-primary",
              "transition-all duration-200",
              "hover:bg-primary/10 hover:shadow-sm",
              "md:hidden",
            )}
          >
            {isMenuOpen ? <Xmark width={22} /> : <Bars width={22} />}
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div className="border-t border-primary/10 bg-background md:hidden">
          <div className="mx-auto max-w-7xl px-5 py-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-default-500">
                {t("language")}
              </span>
              <LanguageSwitcher />
            </div>

            {isLoading ? (
              <div
                className={clsx(
                  "mb-4 rounded-2xl border border-primary/15",
                  "bg-primary/5 px-4 py-3",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="mt-1 h-3 w-40 rounded-md" />
                  </div>
                  <Skeleton className="h-6 w-14 rounded-full" />
                </div>
              </div>
            ) : (
              isAuthenticated &&
              user && (
                <div
                  className={clsx(
                    "mb-4 rounded-2xl border border-primary/15",
                    "bg-primary/5 px-4 py-3",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-primary">
                        {displayName}
                      </p>

                      <p className="truncate text-xs text-default-400">
                        {user.email}
                      </p>
                    </div>

                    <Chip
                      size="sm"
                      color="accent"
                      variant="primary"
                      className="shrink-0 font-bold"
                    >
                      {planLabel}
                    </Chip>
                  </div>
                </div>
              )
            )}

            {!isLoading && isAuthenticated && (
              <ul className="space-y-1">
                {siteConfig.navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={clsx(
                        "block rounded-xl px-4 py-3",
                        "border border-transparent",
                        "text-sm font-semibold text-default-600",
                        "transition-all duration-200",
                        "hover:border-primary/10",
                        "hover:bg-primary/10",
                        "hover:text-primary",
                      )}
                    >
                      {t(item.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 border-t border-default-200 pt-4">
              {isLoading ? (
                <Skeleton className="h-11 w-full rounded-xl" />
              ) : isAuthenticated ? (
                <Button
                  variant="danger-soft"
                  onPress={handleLogout}
                  isDisabled={isLogoutLoading}
                  className="w-full rounded-xl"
                >
                  <ArrowLeftFromLine width={16} />

                  {isLogoutLoading ? t("loggingOut") : t("logout")}
                </Button>
              ) : (
                <div className="w-full" onClick={() => setIsMenuOpen(false)}>
                  <AuthModal />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};