export type DebouncedFunction<Args extends unknown[]> = {
  (...args: Args): void;
  cancel: () => void;
};

export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay: number
): DebouncedFunction<Args> {
  let timerId: ReturnType<typeof setTimeout> | undefined;
  let lastArgs: Args | undefined;
  let lastThis: unknown;

  const invoke = (): void => {
    timerId = undefined;
    if (lastArgs === undefined) {
      return;
    }
    const args = lastArgs;
    const thisArg = lastThis;
    lastArgs = undefined;
    lastThis = undefined;
    fn.apply(thisArg, args);
  };

  const debounced = function (this: unknown, ...args: Args): void {
    lastArgs = args;
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- preserving `this` is required to invoke the debounced function with the caller's context
    lastThis = this;
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(invoke, delay);
  } as DebouncedFunction<Args>;

  debounced.cancel = (): void => {
    if (timerId !== undefined) {
      clearTimeout(timerId);
      timerId = undefined;
    }
    lastArgs = undefined;
    lastThis = undefined;
  };

  return debounced;
}
