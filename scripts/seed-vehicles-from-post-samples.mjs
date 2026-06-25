#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const samplesDir = join(projectRoot, "post-samples");

function loadEnvFile(filePath) {
  try {
    const contents = readFileSync(filePath, "utf8");

    for (const line of contents.split("\n")) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");

      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // Optional local env file.
  }
}

loadEnvFile(join(projectRoot, ".env.local"));
loadEnvFile(join(projectRoot, ".env"));

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function parsePesoAmount(line) {
  const match = line.match(/₱\s*([\d,]+(?:\.\d+)?)/i);

  if (match) {
    return Math.round(Number.parseFloat(match[1].replace(/,/g, "")));
  }

  const shorthand = line.match(/(?:dp|downpayment)\s*:?\s*([\d.]+)\s*k\b/i);

  if (shorthand) {
    return Math.round(Number.parseFloat(shorthand[1]) * 1_000);
  }

  return null;
}

function parseVehicleLine(line) {
  const withEmoji = line.match(
    /(?:🚗|🚙|🚐)\s*(\d{4})\s+([A-Z0-9][A-Z0-9\s/-]+?)\s*(?:🚗|🚙|🚐)/i,
  );

  const plainYearFirst = line.match(/(?:🔥|🚨)?\s*(\d{4})\s+([A-Z0-9][A-Z0-9\s/-]+)/i);
  const match = withEmoji ?? plainYearFirst;

  if (!match) {
    return null;
  }

  const year = Number.parseInt(match[1], 10);
  const remainder = match[2]
    .trim()
    .replace(/\s+/g, " ")
    .replace(/(?:🔥|🚨)+$/u, "")
    .trim();
  const tokens = remainder.split(" ");
  const brand = tokens[0] ?? "";
  const model = tokens.slice(1).join(" ") || brand;

  return {
    brand: toTitleCase(brand),
    model: toTitleCase(model),
    title: `${year} ${toTitleCase(brand)} ${toTitleCase(model)}`,
    year,
  };
}

function toTitleCase(value) {
  return value
    .toLowerCase()
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function parseMileage(line) {
  const match = line.match(/([\d,]+)\s*km/i);

  if (!match) {
    return null;
  }

  return Number.parseInt(match[1].replace(/,/g, ""), 10);
}

function parseMonthlyTerms(lines) {
  const terms = [];

  for (const line of lines) {
    const detailed = line.match(/(\d+)\s*(?:years?|yrs?)\s*[—:-]\s*₱?\s*([\d,]+)/i);
    const compact = line.match(/(\d+)\s*yrs?\s*:\s*([\d.]+)\s*k/i);

    if (detailed) {
      terms.push({
        term_years: Number.parseInt(detailed[1], 10),
        monthly_payment: Number.parseInt(detailed[2].replace(/,/g, ""), 10),
      });
      continue;
    }

    if (compact) {
      terms.push({
        term_years: Number.parseInt(compact[1], 10),
        monthly_payment: Math.round(Number.parseFloat(compact[2]) * 1_000),
      });
    }
  }

  return terms;
}

function parsePostSample(fileName, content) {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const vehicleLine = lines.find((line) => /\b\d{4}\s+[A-Z]/i.test(line));
  const identity = vehicleLine ? parseVehicleLine(vehicleLine) : null;

  if (!identity) {
    throw new Error(`Could not parse vehicle identity from ${fileName}`);
  }

  let price = null;
  let downPayment = null;
  let isPriceNegotiable = false;
  let financingEnabled = false;
  let postLocationTag = null;
  let transmission = null;
  let engine = null;
  let mileage = null;
  let color = null;
  let bodyType = null;
  const highlights = [];
  const saleInclusions = [];
  const useCases = [];
  let section = null;

  for (const line of lines) {
    if (/for sale\s*\|\s*([a-z\s]+)/i.test(line)) {
      postLocationTag = line.match(/for sale\s*\|\s*([a-z\s]+)/i)?.[1]?.trim() ?? null;
    }

    if (/cash price/i.test(line)) {
      price = parsePesoAmount(line);
    }

    if (/negotiable/i.test(line)) {
      isPriceNegotiable = true;
    }

    if (/financing/i.test(line)) {
      financingEnabled = true;
    }

    if (/downpayment|down payment|^\s*📊?\s*dp\s*:/i.test(line)) {
      const parsedDownPayment = parsePesoAmount(line);

      if (parsedDownPayment !== null) {
        downPayment = parsedDownPayment;
        financingEnabled = true;
      }
    }

    if (/automatic transmission/i.test(line)) {
      transmission = "Automatic";
    }

    if (/manual transmission/i.test(line)) {
      transmission = "Manual";
    }

    if (/engine/i.test(line)) {
      engine = line.replace(/^✅\s*/u, "").trim();
    }

    if (/mileage/i.test(line)) {
      const parsedMileage = parseMileage(line);

      if (parsedMileage !== null) {
        mileage = parsedMileage;
      }
    }

    if (/exterior/i.test(line) || /two-tone finish/i.test(line)) {
      color = line
        .replace(/^✅\s*/u, "")
        .replace(/\s*exterior$/i, "")
        .replace(/\s*two-tone finish$/i, "")
        .trim();
    }

    if (/seater capacity/i.test(line)) {
      bodyType = "Van";
    }

    if (/free inclusions/i.test(line)) {
      section = "inclusions";
      continue;
    }

    if (/perfect for/i.test(line)) {
      section = "use_cases";
      continue;
    }

    if (/message now/i.test(line)) {
      section = null;
    }

    if (line.startsWith("✅") || line.startsWith("✔️")) {
      const cleaned = line.replace(/^✅\s*|^✔️\s*/u, "").trim();

      if (section === "inclusions") {
        saleInclusions.push(cleaned);
        continue;
      }

      if (section === "use_cases") {
        useCases.push(cleaned);
        continue;
      }

      if (!engine && /engine/i.test(cleaned)) {
        engine = cleaned;
        continue;
      }

      if (!transmission && /transmission/i.test(cleaned)) {
        transmission = cleaned.replace(/\s*transmission$/i, "").trim();
        continue;
      }

      if (mileage === null && /mileage/i.test(cleaned)) {
        const parsedMileage = parseMileage(cleaned);

        if (parsedMileage !== null) {
          mileage = parsedMileage;
        }
      }

      if (!color && /(exterior|finish)/i.test(cleaned)) {
        color = cleaned
          .replace(/\s*exterior$/i, "")
          .replace(/\s*two-tone finish$/i, "")
          .trim();
      }

      highlights.push(cleaned);
    }
  }

  const monthlyTerms = parseMonthlyTerms(lines);

  if (monthlyTerms.length > 0) {
    financingEnabled = true;
  }

  const variant = inferVariant(identity.model);
  const model = inferModel(identity.model, variant);
  const normalizedVariant =
    variant && variant.toLowerCase() === model.toLowerCase() ? null : variant;
  const downPaymentPercent =
    price !== null && downPayment !== null && price > 0
      ? Math.round((downPayment / price) * 10000) / 100
      : null;

  const description = lines.join("\n");
  const slug = slugify(
    `${identity.year}-${identity.brand}-${model}-${normalizedVariant || "base"}`,
  );

  return {
    availability: "available",
    body_type: bodyType,
    brand: identity.brand,
    color,
    description,
    engine,
    financing_down_payment: downPayment,
    financing_down_payment_percent: downPaymentPercent,
    financing_enabled: financingEnabled,
    financing_monthly_terms: monthlyTerms,
    highlights,
    is_price_negotiable: isPriceNegotiable,
    mileage,
    model,
    post_location_tag: postLocationTag,
    price,
    sale_inclusions: saleInclusions,
    show_cash_price_in_posts: price !== null,
    slug,
    source_file: fileName,
    status: "published",
    stock_number: fileName.replace(/\.txt$/i, "").toUpperCase(),
    title: identity.title,
    transmission,
    use_cases: useCases,
    variant: normalizedVariant,
    year: identity.year,
  };
}

function inferVariant(modelValue) {
  const knownVariants = [
    "XLE",
    "GL Grandia AT",
    "GL Grandia",
    "Royale 4x4",
    "Royale",
    "FJ Cruiser",
    "Emzoom",
    "EMZOOM",
  ];

  for (const variant of knownVariants) {
    if (modelValue.toLowerCase().includes(variant.toLowerCase())) {
      return toTitleCase(variant);
    }
  }

  return null;
}

function inferModel(modelValue, variant) {
  if (!variant) {
    return modelValue;
  }

  const pattern = new RegExp(`\\s*${variant.replace(/\s+/g, "\\s+")}$`, "i");

  return modelValue.replace(pattern, "").trim() || modelValue;
}

function parseArgs(argv) {
  const args = {
    dealershipSlug: process.env.SEED_DEALERSHIP_SLUG ?? null,
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run") {
      args.dryRun = true;
    }

    if (arg === "--dealership-slug") {
      args.dealershipSlug = argv[index + 1] ?? null;
      index += 1;
    }
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  let dealershipQuery = supabase.from("dealerships").select("id, name, slug");

  if (args.dealershipSlug) {
    dealershipQuery = dealershipQuery.eq("slug", args.dealershipSlug);
  }

  const { data: dealerships, error: dealershipError } = await dealershipQuery.limit(1);

  if (dealershipError) {
    throw dealershipError;
  }

  const dealership = dealerships?.[0];

  if (!dealership) {
    throw new Error(
      args.dealershipSlug
        ? `No dealership found for slug "${args.dealershipSlug}".`
        : "No dealership found. Create one first or pass --dealership-slug.",
    );
  }

  const sampleFiles = readdirSync(samplesDir)
    .filter((fileName) => fileName.endsWith(".txt"))
    .sort();

  const vehicles = sampleFiles.map((fileName) => {
    const content = readFileSync(join(samplesDir, fileName), "utf8");

    return parsePostSample(fileName, content);
  });

  console.log(`Dealership: ${dealership.name} (${dealership.slug})`);
  console.log(`Prepared ${vehicles.length} vehicles from post-samples:\n`);

  for (const vehicle of vehicles) {
    console.log(
      `- ${vehicle.title} | slug=${vehicle.slug} | price=${vehicle.price ?? "n/a"} | financing=${vehicle.financing_enabled ? "yes" : "no"}`,
    );
  }

  if (args.dryRun) {
    console.log("\nDry run only. No records inserted.");
    return;
  }

  const results = [];

  for (const vehicle of vehicles) {
    const payload = {
      availability: vehicle.availability,
      body_type: vehicle.body_type,
      brand: vehicle.brand,
      color: vehicle.color,
      dealership_id: dealership.id,
      description: vehicle.description,
      engine: vehicle.engine,
      financing_down_payment: vehicle.financing_down_payment,
      financing_down_payment_percent: vehicle.financing_down_payment_percent,
      financing_enabled: vehicle.financing_enabled,
      financing_monthly_terms: vehicle.financing_monthly_terms,
      highlights: vehicle.highlights,
      is_price_negotiable: vehicle.is_price_negotiable,
      mileage: vehicle.mileage,
      model: vehicle.model,
      post_location_tag: vehicle.post_location_tag,
      price: vehicle.price,
      sale_inclusions: vehicle.sale_inclusions,
      show_cash_price_in_posts: vehicle.show_cash_price_in_posts,
      slug: vehicle.slug,
      status: vehicle.status,
      stock_number: vehicle.stock_number,
      title: vehicle.title,
      transmission: vehicle.transmission,
      use_cases: vehicle.use_cases,
      variant: vehicle.variant,
      year: vehicle.year,
    };

    const { data, error } = await supabase
      .from("vehicles")
      .upsert(payload, { onConflict: "dealership_id,slug" })
      .select("id, title, slug")
      .single();

    if (error) {
      throw new Error(`${vehicle.source_file}: ${error.message}`);
    }

    results.push(data);
  }

  console.log(`\nInserted/updated ${results.length} vehicles without photos.`);

  for (const vehicle of results) {
    console.log(`- ${vehicle.title} (${vehicle.slug})`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
