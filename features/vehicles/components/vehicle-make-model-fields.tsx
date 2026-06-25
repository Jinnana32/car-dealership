"use client";

import { useMemo, useState } from "react";
import type { ReactElement } from "react";

import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  appendCustomOption,
  getVehicleBrandOptions,
  getVehicleModelOptions,
  getVehicleVariantOptions,
  type VehicleCatalog,
} from "@/features/vehicles/catalog";
import type { VehicleFormState } from "@/features/vehicles/types";

type VehicleMakeModelFieldsProps = {
  catalog: VehicleCatalog;
  fieldErrors: VehicleFormState["fieldErrors"];
  initialBrand: string;
  initialModel: string;
  initialVariant: string;
};

function getFieldError(
  fieldErrors: VehicleFormState["fieldErrors"],
  fieldName: string,
): string | undefined {
  return fieldErrors?.[fieldName]?.[0];
}

function FieldError({
  message,
}: {
  message?: string;
}): ReactElement | null {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-red-600">{message}</p>;
}

export function VehicleMakeModelFields({
  catalog,
  fieldErrors,
  initialBrand,
  initialModel,
  initialVariant,
}: VehicleMakeModelFieldsProps): ReactElement {
  const [brand, setBrand] = useState(initialBrand);
  const [model, setModel] = useState(initialModel);
  const [variant, setVariant] = useState(initialVariant);

  const brandOptions = useMemo(
    () => appendCustomOption(getVehicleBrandOptions(catalog), brand),
    [brand, catalog],
  );
  const modelOptions = useMemo(
    () => appendCustomOption(getVehicleModelOptions(catalog, brand), model),
    [brand, catalog, model],
  );
  const variantOptions = useMemo(
    () => appendCustomOption(getVehicleVariantOptions(catalog, brand, model), variant),
    [brand, catalog, model, variant],
  );

  function handleBrandChange(nextBrand: string): void {
    setBrand(nextBrand);
    setModel("");
    setVariant("");
  }

  function handleModelChange(nextModel: string): void {
    setModel(nextModel);
    setVariant("");
  }

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="brand">Make</Label>
        <Select
          id="brand"
          name="brand"
          onChange={(event) => handleBrandChange(event.target.value)}
          required
          value={brand}
        >
          <option value="">Select a make</option>
          {brandOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
        <FieldError message={getFieldError(fieldErrors, "brand")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="model">Model</Label>
        <Select
          disabled={!brand}
          id="model"
          name="model"
          onChange={(event) => handleModelChange(event.target.value)}
          required
          value={model}
        >
          <option value="">{brand ? "Select a model" : "Select a make first"}</option>
          {modelOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
        <FieldError message={getFieldError(fieldErrors, "model")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="variant">Variant</Label>
        <Select
          disabled={!brand || !model}
          id="variant"
          name="variant"
          onChange={(event) => setVariant(event.target.value)}
          value={variant}
        >
          <option value="">
            {brand && model ? "Select a variant" : "Select make and model first"}
          </option>
          {variantOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
        <FieldError message={getFieldError(fieldErrors, "variant")} />
      </div>
    </>
  );
}
