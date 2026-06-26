import { recordVehicleSaleSchema } from "../features/sales/validators";

const cases = {
  good: {
    asking_price: "700000",
    confirm: "record_sale",
    customer_id: "252599c1-d3df-40cc-962b-75550267ef90",
    inquiry_id: "a365ed93-0ea1-4da5-b8dd-327522f633db",
    notes: "",
    payment_type: "financing",
    sold_at: "2026-06-26T02:34",
    sold_price: "700,000",
    vehicle_id: "102bd4b9-88b1-4793-98d9-aa8f089d3747",
    down_payment_input_mode: "percent",
    down_payment_value: "50",
    down_payment_amount: "350000",
    term_years: "5",
    monthly_payment: "7786",
    term_months: "60",
    trade_in_amount: "",
    plan_tbd: "",
  },
  financing_empty: {
    asking_price: "700000",
    confirm: "record_sale",
    customer_id: "252599c1-d3df-40cc-962b-75550267ef90",
    inquiry_id: "a365ed93-0ea1-4da5-b8dd-327522f633db",
    notes: "",
    payment_type: "financing",
    sold_at: "2026-06-26T02:34",
    sold_price: "700000",
    vehicle_id: "102bd4b9-88b1-4793-98d9-aa8f089d3747",
    down_payment_input_mode: "percent",
    down_payment_value: "",
    term_years: "",
    plan_tbd: "",
  },
  payment_undefined: {
    asking_price: "700000",
    confirm: "record_sale",
    customer_id: "252599c1-d3df-40cc-962b-75550267ef90",
    inquiry_id: "a365ed93-0ea1-4da5-b8dd-327522f633db",
    notes: "",
    payment_type: undefined,
    sold_at: "2026-06-26T02:34",
    sold_price: "700000",
    vehicle_id: "102bd4b9-88b1-4793-98d9-aa8f089d3747",
    plan_tbd: "",
  },
  payment_null: {
    asking_price: "700000",
    confirm: "record_sale",
    customer_id: "252599c1-d3df-40cc-962b-75550267ef90",
    inquiry_id: "a365ed93-0ea1-4da5-b8dd-327522f633db",
    notes: "",
    payment_type: null,
    sold_at: "2026-06-26T02:34",
    sold_price: "700000",
    vehicle_id: "102bd4b9-88b1-4793-98d9-aa8f089d3747",
    plan_tbd: "",
  },
  plan_tbd_null: {
    asking_price: "700000",
    confirm: "record_sale",
    customer_id: "252599c1-d3df-40cc-962b-75550267ef90",
    inquiry_id: "a365ed93-0ea1-4da5-b8dd-327522f633db",
    notes: "",
    payment_type: "financing",
    sold_at: "2026-06-26T02:34",
    sold_price: "700,000",
    vehicle_id: "102bd4b9-88b1-4793-98d9-aa8f089d3747",
    down_payment_input_mode: "percent",
    down_payment_value: "50",
    down_payment_amount: "350000",
    term_years: "5",
    monthly_payment: "7786",
    term_months: "60",
    trade_in_amount: "",
    plan_tbd: null,
  },
  no_sold_price: {
    asking_price: "700000",
    confirm: "record_sale",
    customer_id: "252599c1-d3df-40cc-962b-75550267ef90",
    inquiry_id: "a365ed93-0ea1-4da5-b8dd-327522f633db",
    notes: "",
    payment_type: "",
    sold_at: "2026-06-26T02:34",
    sold_price: "",
    vehicle_id: "102bd4b9-88b1-4793-98d9-aa8f089d3747",
    plan_tbd: "",
  },
};

for (const [name, payload] of Object.entries(cases)) {
  const result = recordVehicleSaleSchema.safeParse(payload);
  if (!result.success) {
    console.log(
      name,
      result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
        code: issue.code,
      })),
    );
  } else {
    console.log(name, "ok");
  }
}
