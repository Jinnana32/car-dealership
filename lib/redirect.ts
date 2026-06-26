import { redirect } from "next/navigation";

export type RedirectMessageKey = "error" | "info" | "success";

export function redirectWithMessage(
  target: string,
  key: RedirectMessageKey,
  message: string,
): never {
  const hashIndex = target.indexOf("#");
  const pathWithQuery = hashIndex === -1 ? target : target.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : target.slice(hashIndex);
  const queryIndex = pathWithQuery.indexOf("?");
  const pathname =
    queryIndex === -1 ? pathWithQuery : pathWithQuery.slice(0, queryIndex);
  const existingQuery =
    queryIndex === -1 ? "" : pathWithQuery.slice(queryIndex + 1);
  const searchParams = new URLSearchParams(existingQuery);

  searchParams.set(key, message);

  const query = searchParams.toString();

  redirect(`${pathname}${query ? `?${query}` : ""}${hash}`);
}
