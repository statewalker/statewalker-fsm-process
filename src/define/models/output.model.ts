import { newAdapter } from "../../commons/adapters/index.ts";
import { BaseClass } from "../../commons/base-class/index.ts";

export class OutputModel extends BaseClass {
  content = "";
  destination = "";
  isWritten = false;

  setContent(yaml: string, dest: string): void {
    this.content = yaml;
    this.destination = dest;
    this.isWritten = false;
    this.notify();
  }

  markWritten(): void {
    this.isWritten = true;
    this.notify();
  }
}

export const [getOutputModel, setOutputModel] = newAdapter<OutputModel>(
  "define:output",
  () => new OutputModel(),
);
