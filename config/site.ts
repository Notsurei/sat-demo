export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "StudyBuddy",
  description: "Focused SAT preparation platform.",

  navItems: [
    {
      labelKey: "home",
      href: "/pages/home",
    },
    {
      labelKey: "dashboard",
      href: "/pages/dashboard",
    },
    {
      labelKey: "plans",
      href: "/pages/pricing",
    },
    // {
    //   labelKey: "knowledgeReview",
    //   href: "/pages/knowledge-review",
    // },
    // {
    //   labelKey: "about",
    //   href: "/about",
    // },
  ],

  navMenuItems: [
    {
      labelKey: "profile",
      href: "/profile",
    },
    {
      labelKey: "dashboard",
      href: "/dashboard",
    },
    {
      labelKey: "projects",
      href: "/projects",
    },
    {
      labelKey: "team",
      href: "/team",
    },
    {
      labelKey: "calendar",
      href: "/calendar",
    },
    {
      labelKey: "settings",
      href: "/settings",
    },
    {
      labelKey: "helpFeedback",
      href: "/help-feedback",
    },
    {
      labelKey: "logout",
      href: "/logout",
    },
  ],

  links: {
    github: "https://github.com/heroui-inc/heroui",
    twitter: "https://twitter.com/hero_ui",
    docs: "https://heroui.com",
    discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://patreon.com/jrgarciadev",
  },
} as const;