import type { FsmStateConfig } from "@statewalker/fsm-validator";
import { newAdapter } from "@/shared/adapters/index.ts";
import { Base } from "@/shared/base-class/index.ts";

export class ProcessConfigModel extends Base {
  config: FsmStateConfig | undefined = undefined;
  iteration = 0;
  isGenerating = false;
  maxIterations = 5;

  startGeneration(): (result: {
    config?: FsmStateConfig;
    error?: unknown;
  }) => void {
    this.update(() => {
      this.isGenerating = true;
      this.iteration++;
    });
    return (result) => {
      this.update(() => {
        this.isGenerating = false;
        if (result.config) {
          this.config = result.config;
        }
      });
    };
  }
}

export const [getProcessConfigModel, setProcessConfigModel] =
  newAdapter<ProcessConfigModel>(
    "define:processConfig",
    () => new ProcessConfigModel(),
  );
