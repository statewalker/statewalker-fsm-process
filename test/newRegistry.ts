export function newRegistry(): [
  register: (action?: () => unknown) => () => void,
  clean: () => void
] {
  const index: Record<number, () => unknown> = {};
  let idCounter = 0;
  return [
    (action?: () => unknown) => {
      const id = idCounter++;
      return (index[id] = () => {
        delete index[id];
        action?.();
      });
    },
    () => {
      Object.values(index).forEach((c) => c());
    },
  ];
}
