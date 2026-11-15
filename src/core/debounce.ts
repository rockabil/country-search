export type DebouncedFunction<Args extends unknown[]> = {
  (...args: Args): void;
  cancel: () => void;
};

export function debounce<Args extends unknown[]>(
  _fn: (...args: Args) => void,
  _delay: number
): DebouncedFunction<Args> {
  void _fn;
  void _delay;
  throw new Error('debounce: not implemented yet');
}
