import type { FsmStateConfig } from "@statewalker/fsm-validator";
import { newAdapter } from "@/shared/adapters/index.ts";
import { BaseClass } from "@/shared/base-class/index.ts";

export class ProcessConfigModel extends BaseClass {
  config: FsmStateConfig | undefined = undefined;
  iteration = 0;
  isGenerating = false;
  maxIterations = 5;

  startGeneration(): (result: {
    config?: FsmStateConfig;
    error?: unknown;
  }) => void {
    this.isGenerating = true;
    this.iteration++;
    this.notify();
    return (result) => {
      this.isGenerating = false;
      if (result.config) {
        this.config = result.config;
      }
      this.notify();
    };
  }
}

export const [getProcessConfigModel, setProcessConfigModel] =
  newAdapter<ProcessConfigModel>(
    "define:processConfig",
    () => new ProcessConfigModel(),
  );
