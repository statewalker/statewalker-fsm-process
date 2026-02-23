import { newStageSlot } from "@/commons/stage/index.ts";
import type { OutputModel } from "@/define/models/output.model.ts";
import type { ProcessConfigModel } from "@/define/models/process-config.model.ts";
import type { ValidationModel } from "@/define/models/validation.model.ts";

export const [publishDefineProgress, listenDefineProgress] =
  newStageSlot<ProcessConfigModel>("define:progress");

export const [publishValidation, listenValidation] =
  newStageSlot<ValidationModel>("define:validation");

export const [publishDefineOutput, listenDefineOutput] =
  newStageSlot<OutputModel>("define:output");
