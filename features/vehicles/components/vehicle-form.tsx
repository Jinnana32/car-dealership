"use client";

import { useActionState, useState } from "react";
import type { ReactElement } from "react";

import Link from "next/link";
import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createVehicle,
  updateVehicle,
} from "@/features/vehicles/actions";
import { VehicleFinancingFields } from "@/features/vehicles/components/vehicle-financing-fields";
import { VehicleMakeModelFields } from "@/features/vehicles/components/vehicle-make-model-fields";
import type { VehicleCatalog } from "@/features/vehicles/catalog";
import {
  VEHICLE_BODY_TYPE_OPTIONS,
  VEHICLE_COLOR_OPTIONS,
  VEHICLE_FUEL_TYPE_OPTIONS,
  VEHICLE_AVAILABILITIES,
  VEHICLE_STATUSES,
  VEHICLE_TRANSMISSION_OPTIONS,
} from "@/features/vehicles/constants";
import { parseEngineValue } from "@/features/vehicles/engine";
import {
  inferDownPaymentPercent,
  serializeTextList,
} from "@/features/vehicles/pricing";
import type {
  Vehicle,
  VehicleFormState,
  VehicleFormValues,
} from "@/features/vehicles/types";
import {
  getVehicleAvailabilityLabel,
  getVehicleStatusLabel,
  buildVehicleDetailPath,
} from "@/features/vehicles/utils";

type VehicleFormProps = {
  catalog: VehicleCatalog;
  financingAprPercent: number;
  mode: "create" | "edit";
  vehicle?: Vehicle;
};

const emptyFormState: VehicleFormState = {
  error: undefined,
  fieldErrors: {},
};

type SelectOption = {
  label: string;
  value: string;
};

function getFieldError(
  state: VehicleFormState,
  fieldName: string,
): string | undefined {
  return state.fieldErrors?.[fieldName]?.[0];
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

function stringifyVehicleValue(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function getVehicleFormValues(
  vehicle: Vehicle | undefined,
  state: VehicleFormState,
): VehicleFormValues {
  const parsedEngine = parseEngineValue(vehicle?.engine);

  return {
    availability: state.values?.availability ?? vehicle?.availability ?? "available",
    body_type: state.values?.body_type ?? vehicle?.body_type ?? "",
    brand: state.values?.brand ?? vehicle?.brand ?? "",
    color: state.values?.color ?? vehicle?.color ?? "",
    description: state.values?.description ?? vehicle?.description ?? "",
    engine_size:
      state.values?.engine_size ??
      vehicle?.engine_size ??
      parsedEngine.engine_size,
    engine_type:
      state.values?.engine_type ??
      vehicle?.engine_type ??
      parsedEngine.engine_type,
    financing_down_payment_mode:
      state.values?.financing_down_payment_mode ??
      (vehicle?.financing_down_payment !== null && vehicle?.financing_down_payment !== undefined
        ? "amount"
        : "percent"),
    financing_down_payment_value:
      state.values?.financing_down_payment_value ??
      stringifyVehicleValue(
        vehicle?.financing_down_payment ??
          inferDownPaymentPercent({
            cashPrice: vehicle?.price ?? null,
            downPaymentAmount: vehicle?.financing_down_payment ?? null,
            downPaymentPercent: vehicle?.financing_down_payment_percent ?? null,
          }),
      ),
    financing_enabled:
      state.values?.financing_enabled ??
      (vehicle?.financing_enabled ? "true" : "false"),
    financing_monthly_terms: state.values?.financing_monthly_terms ?? "",
    fuel_type: state.values?.fuel_type ?? vehicle?.fuel_type ?? "",
    highlights:
      state.values?.highlights ?? serializeTextList(vehicle?.highlights),
    mileage: state.values?.mileage ?? stringifyVehicleValue(vehicle?.mileage),
    model: state.values?.model ?? vehicle?.model ?? "",
    plate_number: state.values?.plate_number ?? vehicle?.plate_number ?? "",
    post_location_tag:
      state.values?.post_location_tag ?? vehicle?.post_location_tag ?? "",
    price: state.values?.price ?? stringifyVehicleValue(vehicle?.price),
    sale_inclusions:
      state.values?.sale_inclusions ?? serializeTextList(vehicle?.sale_inclusions),
    slug: state.values?.slug ?? vehicle?.slug ?? "",
    status: state.values?.status ?? vehicle?.status ?? "draft",
    stock_number: state.values?.stock_number ?? vehicle?.stock_number ?? "",
    title: state.values?.title ?? vehicle?.title ?? "",
    transmission: state.values?.transmission ?? vehicle?.transmission ?? "",
    use_cases: state.values?.use_cases ?? serializeTextList(vehicle?.use_cases),
    variant: state.values?.variant ?? vehicle?.variant ?? "",
    vin: state.values?.vin ?? vehicle?.vin ?? "",
    year: state.values?.year ?? stringifyVehicleValue(vehicle?.year),
  };
}

function getSelectOptions(
  options: readonly SelectOption[],
  currentValue: string,
): SelectOption[] {
  if (
    currentValue.length === 0 ||
    options.some((option) => option.value === currentValue)
  ) {
    return [...options];
  }

  return [{ label: currentValue, value: currentValue }, ...options];
}

function hasCustomFacebookContent(values: VehicleFormValues): boolean {
  return Boolean(
    values.post_location_tag.trim() ||
      values.highlights.trim() ||
      values.use_cases.trim() ||
      values.sale_inclusions.trim(),
  );
}

function FacebookHiddenFields({
  values,
}: {
  values: VehicleFormValues;
}): ReactElement {
  return (
    <>
      <input name="post_location_tag" type="hidden" value={values.post_location_tag} />
      <input name="highlights" type="hidden" value={values.highlights} />
      <input name="use_cases" type="hidden" value={values.use_cases} />
      <input name="sale_inclusions" type="hidden" value={values.sale_inclusions} />
    </>
  );
}

export function VehicleForm({
  catalog,
  financingAprPercent,
  mode,
  vehicle,
}: VehicleFormProps): ReactElement {
  const formAction =
    mode === "edit" && vehicle ? updateVehicle.bind(null, vehicle.id) : createVehicle;
  const [state, action] = useActionState(formAction, emptyFormState);
  const formValues = getVehicleFormValues(vehicle, state);
  const formKey = JSON.stringify(formValues);
  const fuelTypeOptions = getSelectOptions(
    VEHICLE_FUEL_TYPE_OPTIONS,
    formValues.fuel_type,
  );
  const transmissionOptions = getSelectOptions(
    VEHICLE_TRANSMISSION_OPTIONS,
    formValues.transmission,
  );
  const bodyTypeOptions = getSelectOptions(
    VEHICLE_BODY_TYPE_OPTIONS,
    formValues.body_type,
  );
  const colorOptions = getSelectOptions(VEHICLE_COLOR_OPTIONS, formValues.color);
  const [facebookExpanded, setFacebookExpanded] = useState(
    hasCustomFacebookContent(formValues),
  );

  return (
    <form action={action} className="space-y-6" key={formKey}>
      {state.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <Card className="rounded-[20px] border-border shadow-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg">Basic information</CardTitle>
          <p className="text-sm text-muted-foreground">
            Core details used across the dealership inventory.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="title">Name</Label>
            <Input
              defaultValue={formValues.title}
              id="title"
              name="title"
              placeholder="2024 Toyota Vios XLE"
              required
            />
            <FieldError message={getFieldError(state, "title")} />
          </div>

          <VehicleMakeModelFields
            catalog={catalog}
            fieldErrors={state.fieldErrors}
            initialBrand={formValues.brand}
            initialModel={formValues.model}
            initialVariant={formValues.variant}
          />

          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Input
              defaultValue={formValues.year}
              id="year"
              inputMode="numeric"
              name="year"
              placeholder="2024"
            />
            <FieldError message={getFieldError(state, "year")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock_number">Stock number</Label>
            <Input
              defaultValue={formValues.stock_number}
              id="stock_number"
              name="stock_number"
            />
            <FieldError message={getFieldError(state, "stock_number")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              defaultValue={formValues.slug}
              id="slug"
              name="slug"
              placeholder="generated automatically if left blank"
            />
            <FieldError message={getFieldError(state, "slug")} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[20px] border-border shadow-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg">Specs</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="mileage">Mileage</Label>
            <Input
              defaultValue={formValues.mileage}
              id="mileage"
              inputMode="numeric"
              name="mileage"
              placeholder="0"
            />
            <FieldError message={getFieldError(state, "mileage")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="engine_size">Engine size (L)</Label>
            <Input
              defaultValue={formValues.engine_size}
              id="engine_size"
              inputMode="decimal"
              name="engine_size"
              placeholder="1.5"
            />
            <FieldError message={getFieldError(state, "engine_size")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="engine_type">Engine type</Label>
            <Input
              defaultValue={formValues.engine_type}
              id="engine_type"
              name="engine_type"
              placeholder="Dual VVT-i"
            />
            <FieldError message={getFieldError(state, "engine_type")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fuel_type">Fuel type</Label>
            <Select
              defaultValue={formValues.fuel_type}
              id="fuel_type"
              name="fuel_type"
            >
              <option value="">Select fuel type</option>
              {fuelTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <FieldError message={getFieldError(state, "fuel_type")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transmission">Transmission</Label>
            <Select
              defaultValue={formValues.transmission}
              id="transmission"
              name="transmission"
            >
              <option value="">Select transmission</option>
              {transmissionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <FieldError message={getFieldError(state, "transmission")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body_type">Body type</Label>
            <Select
              defaultValue={formValues.body_type}
              id="body_type"
              name="body_type"
            >
              <option value="">Select body type</option>
              {bodyTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <FieldError message={getFieldError(state, "body_type")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Select
              defaultValue={formValues.color}
              id="color"
              name="color"
            >
              <option value="">Select color</option>
              {colorOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <FieldError message={getFieldError(state, "color")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plate_number">Plate number</Label>
            <Input
              defaultValue={formValues.plate_number}
              id="plate_number"
              name="plate_number"
            />
            <FieldError message={getFieldError(state, "plate_number")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vin">VIN</Label>
            <Input defaultValue={formValues.vin} id="vin" name="vin" />
            <FieldError message={getFieldError(state, "vin")} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[20px] border-border shadow-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg">Financing</CardTitle>
        </CardHeader>
        <CardContent>
          <VehicleFinancingFields
            fieldErrors={state.fieldErrors}
            financingAprPercent={financingAprPercent}
            formValues={formValues}
            vehicle={vehicle}
          />
        </CardContent>
      </Card>

      <Card className="rounded-[20px] border-border shadow-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg">Facebook post content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              checked={facebookExpanded}
              onChange={(event) => setFacebookExpanded(event.target.checked)}
              type="checkbox"
            />
            Customize Facebook post content for this vehicle
          </label>

          {facebookExpanded ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="post_location_tag">Post location tag</Label>
                <Input
                  defaultValue={formValues.post_location_tag}
                  id="post_location_tag"
                  name="post_location_tag"
                  placeholder="Iloilo"
                />
                <FieldError message={getFieldError(state, "post_location_tag")} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="highlights">Highlights</Label>
                <Textarea
                  defaultValue={formValues.highlights}
                  id="highlights"
                  name="highlights"
                  placeholder={"Built-in dashcam + rear camera\nComplete tools + spare tire included"}
                />
                <p className="text-sm text-muted-foreground">One highlight per line.</p>
                <FieldError message={getFieldError(state, "highlights")} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="use_cases">Use cases</Label>
                <Textarea
                  defaultValue={formValues.use_cases}
                  id="use_cases"
                  name="use_cases"
                  placeholder={"Family road trips\nTourism and transport business"}
                />
                <p className="text-sm text-muted-foreground">One use case per line.</p>
                <FieldError message={getFieldError(state, "use_cases")} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="sale_inclusions">Extra sale inclusions</Label>
                <Textarea
                  defaultValue={formValues.sale_inclusions}
                  id="sale_inclusions"
                  name="sale_inclusions"
                  placeholder={"Full tank gas (FREE)"}
                />
                <p className="text-sm text-muted-foreground">
                  One inclusion per line. Dealership defaults are added automatically.
                </p>
                <FieldError message={getFieldError(state, "sale_inclusions")} />
              </div>
            </div>
          ) : (
            <FacebookHiddenFields values={formValues} />
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[20px] border-border shadow-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg">Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            defaultValue={formValues.description}
            id="description"
            name="description"
            placeholder="Vehicle notes, highlights, and condition details."
          />
          <FieldError message={getFieldError(state, "description")} />
        </CardContent>
      </Card>

      {mode === "edit" ? (
        <Card className="rounded-[20px] border-border shadow-none">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg">Photos</CardTitle>
            <p className="text-sm text-muted-foreground">
              Upload additional photos here or{" "}
              <Link
                className="font-medium text-primary underline-offset-4 hover:underline"
                href={
                  vehicle
                    ? buildVehicleDetailPath(vehicle.id, "photos")
                    : "/admin/vehicles"
                }
              >
                manage the gallery on the Photos tab
              </Link>
              .
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="media_files">Vehicle photos</Label>
            <Input
              accept="image/*"
              id="media_files"
              multiple
              name="media_files"
              type="file"
            />
            <FieldError message={getFieldError(state, "files")} />
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-[20px] border-border shadow-none">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg">Photos</CardTitle>
            <p className="text-sm text-muted-foreground">
              Upload vehicle photos now or add them later.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="media_files">Vehicle photos</Label>
            <Input
              accept="image/*"
              id="media_files"
              multiple
              name="media_files"
              type="file"
            />
            <FieldError message={getFieldError(state, "files")} />
            <p className="text-sm text-muted-foreground">
              Reordering and removing photos are not supported yet.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-[20px] border-border shadow-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg">Publishing status</CardTitle>
          <p className="text-sm text-muted-foreground">
            Control inventory visibility and vehicle availability.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              defaultValue={formValues.status}
              id="status"
              name="status"
            >
              {VEHICLE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {getVehicleStatusLabel(status)}
                </option>
              ))}
            </Select>
            <FieldError message={getFieldError(state, "status")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="availability">Availability</Label>
            <Select
              defaultValue={formValues.availability}
              id="availability"
              name="availability"
            >
              {VEHICLE_AVAILABILITIES.map((availability) => (
                <option key={availability} value={availability}>
                  {getVehicleAvailabilityLabel(availability)}
                </option>
              ))}
            </Select>
            <FieldError message={getFieldError(state, "availability")} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <SubmitButton pendingLabel={mode === "create" ? "Creating..." : "Saving..."}>
          {mode === "create" ? "Create Vehicle" : "Save Vehicle"}
        </SubmitButton>
      </div>
    </form>
  );
}
