export function assert<T>(v: T|undefined|null): asserts v is T {
  if (!v)
    throw new Error("ASSERTION ERROR")
}