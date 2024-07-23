import { expect } from "./deps.ts";

export function newPrintChecker() {
  const lines: string[][] = [];
  return [
    (...args: string[]) => lines.push(args),
    (...control: string[]) => {
      const str = lines.map((items) => items.join(""));
      try {
        expect(str).toEqual(control);
      } catch (err) {
        console.log(str);
        throw err;
      }
    },
  ];
}
