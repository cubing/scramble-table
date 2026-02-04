export function mustExist<T>(t: NonNullable<T> | null): NonNullable<T>;
export function mustExist<T>(t: NonNullable<T> | undefined): NonNullable<T>;
export function mustExist<T>(
  t: NonNullable<T> | null | undefined,
): NonNullable<T> {
  if (typeof t === "undefined" || t === null) {
    throw new Error("Missing value");
  }
  return t;
}

// Workaround for https://github.com/microsoft/TypeScript/issues/28357
export function customEventWorkaround<T>(
  e: CustomEventInit<T>,
): CustomEvent<T> {
  return e as CustomEvent<T>;
}
