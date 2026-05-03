import { newAdapter } from "@/shared/adapters/index.ts";
import { Base } from "@/shared/base-class/index.ts";

export class ProcessInputModel extends Base {
  description = "";
  source = "";

  setDescription(desc: string, source?: string): void {
    return this.update(() => {
      this.description = desc;
      if (source !== undefined) {
        this.source = source;
      }
    
    });
  }
}

export const [getProcessInputModel, setProcessInputModel] =
  newAdapter<ProcessInputModel>(
    "define:processInput",
    () => new ProcessInputModel(),
  );
