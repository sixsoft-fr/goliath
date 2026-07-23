const WeightUnits = {
  KG: "kg",
  TONS: "tons",
} as const;

type WeightUnit = (typeof WeightUnits)[keyof typeof WeightUnits];

export { WeightUnits };
export type { WeightUnit };
