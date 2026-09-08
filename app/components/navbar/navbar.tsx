"use client";

import { useState } from "react";
import { Button, Chip } from "@heroui/react";
import NextLink from "next/link";
import clsx from "clsx";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import { ArrowLeftFromLine, Bars, Xmark } from "@gravity-ui/icons";

import { siteConfig } from "@/config/site";
import { Logo } from "@/app/components/icons-list/icons";
import { useAuthStore } from "@/zustand/auth-store";
import AuthModal from "../modal-button/auth-modal";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuthStore();

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
      ? "Free"
      : user?.subscriptionPlan || "Free";

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-primary/15 bg-background/95 shadow-sm backdrop-blur-md">
      <header className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-5 sm:px-6">
        <div className="flex items-center gap-8">
          <NextLink
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

            <div className="hidden sm:block">
              <p className="text-[15px] font-black tracking-tight text-foreground">
                StudyBuddy
              </p>

              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                SAT Preparation
              </p>
            </div>
          </NextLink>

          {isAuthenticated && (
            <ul className="hidden items-center gap-1 lg:flex">
              {siteConfig.navItems.map((item) => {
                const active = isActive(item.href);

                return (
                  <li key={item.href}>
                    <NextLink
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
                      {item.label}

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
                    </NextLink>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 md:flex">
            {isAuthenticated ? (
              <>
                {user && (
                  <div
                    className={clsx(
                      "rounded-xl border border-accent/20",
                      " px-3 py-1.5",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <p className="max-w-[140px] truncate text-sm font-bold">
                        {user.firstName || "Student"}
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

                  {isLogoutLoading ? "Logging out..." : "Logout"}
                </Button>
              </>
            ) : (
              <AuthModal />
            )}
          </div>

          <button
            type="button"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
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
            {isAuthenticated && user && (
              <div
                className={clsx(
                  "mb-4 rounded-2xl border border-primary/15",
                  "bg-primary/5 px-4 py-3",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-primary">
                      {user.firstName || "Student"}
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
            )}

            {isAuthenticated && (
              <ul className="space-y-1">
                {siteConfig.navItems.map((item) => (
                  <li key={item.href}>
                    <NextLink
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
                      {item.label}
                    </NextLink>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 border-t border-default-200 pt-4">
              {isAuthenticated ? (
                <Button
                  variant="danger-soft"
                  onPress={handleLogout}
                  isDisabled={isLogoutLoading}
                  className="w-full rounded-xl"
                >
                  <ArrowLeftFromLine width={16} />

                  {isLogoutLoading ? "Logging out..." : "Logout"}
                </Button>
              ) : (
                <div
                  className="w-full"
                  onClick={() => setIsMenuOpen(false)}
                >
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