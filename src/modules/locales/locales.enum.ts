const Locales = {
  FR: "fr",
  EN: "en",
} as const;

type Locale = (typeof Locales)[keyof typeof Locales];

export { Locales };
export type { Locale };
