import { newStageSlot } from "@/shared/stage/index.ts";
import type { OutputModel } from "@/process-define/models/output.model.ts";
import type { ProcessConfigModel } from "@/process-define/models/process-config.model.ts";
import type { ValidationModel } from "@/process-define/models/validation.model.ts";

export const [publishDefineProgress, listenDefineProgress] =
  newStageSlot<ProcessConfigModel>("define:progress");

export const [publishValidation, listenValidation] =
  newStageSlot<ValidationModel>("define:validation");

export const [publishDefineOutput, listenDefineOutput] =
  newStageSlot<OutputModel>("define:output");
