import { newAdapter } from "@/shared/adapters/index.ts";
import { BaseClass } from "@/shared/base-class/index.ts";

export class ProcessInputModel extends BaseClass {
  description = "";
  source = "";

  setDescription(desc: string, source?: string): void {
    this.description = desc;
    if (source !== undefined) {
      this.source = source;
    }
    this.notify();
  }
}

export const [getProcessInputModel, setProcessInputModel] =
  newAdapter<ProcessInputModel>(
    "define:processInput",
    () => new ProcessInputModel(),
  );
