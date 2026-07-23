const Incoterms = {
  EX_WORKS: "exw",
  FREE_CARRIER: "fca",
  FREE_ALONGSIDE_SHIP: "fas",
  FREE_ON_BOARD: "fob",
  COST_AND_FREIGHT: "cfr",
  COST_INSURANCE_AND_FREIGHT: "cif",
  CARRIAGE_PAID_TO: "cpt",
  CARRIAGE_AND_INSURANCE_PAID_TO: "cip",
  DELIVERED_AT_PLACE_UNLOADED: "dpu",
  DELIVERED_AT_PLACE: "dap",
  DELIVERED_DUTY_PAID: "ddp",
} as const;

type Incoterm = (typeof Incoterms)[keyof typeof Incoterms];

export { Incoterms };
export type { Incoterm };
