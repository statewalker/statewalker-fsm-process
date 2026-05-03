import { newAdapter } from "@/shared/adapters/index.ts";
import { Base } from "@/shared/base-class/index.ts";

export class OutputModel extends Base {
  content = "";
  destination = "";
  isWritten = false;

  setContent(yaml: string, dest: string): void {
    return this.update(() => {
      this.content = yaml;
      this.destination = dest;
      this.isWritten = false;
    
    });
  }

  markWritten(): void {
    return this.update(() => {
      this.isWritten = true;
    
    });
  }
}

export const [getOutputModel, setOutputModel] = newAdapter<OutputModel>(
  "define:output",
  () => new OutputModel(),
);
