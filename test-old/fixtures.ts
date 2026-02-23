import type { FsmStateConfig } from "@statewalker/fsm-validator";

export const lightBulbConfig: FsmStateConfig = {
  key: "LightBulb",
  description: "A simple on/off light bulb",
  transitions: [
    ["", "*", "Off"],
    ["Off", "toggle", "On"],
    ["On", "toggle", "Off"],
  ],
  states: [
    {
      key: "Off",
      description: "Light is off",
      events: { toggle: "When user presses the light switch" },
    },
    {
      key: "On",
      description: "Light is on",
      events: { toggle: "When user presses the light switch" },
    },
  ],
};

export const brokenConfig: FsmStateConfig = {
  key: "",
  transitions: [["A", "go", "B"]],
};

export const semanticIssuesConfig: FsmStateConfig = {
  key: "BadProcess",
  description: "A process with semantic issues",
  transitions: [
    ["", "*", "StepA"],
    ["StepA", "ok", "StepB"],
    ["StepA", "error", "StepB"],
    ["StepB", "done", ""],
  ],
  states: [
    {
      key: "StepA",
      description: "First step",
      events: {
        ok: "When step succeeds",
        error: "When step fails",
      },
    },
    {
      key: "StepB",
      description: "Second step",
      events: { done: "When complete" },
    },
  ],
};

export const defineProcessConfig: FsmStateConfig = {
  key: "DefineProcess",
  description:
    "Transform a human-readable process description into a validated HFSM configuration.",
  outcome:
    "Validated FsmStateConfig serialized as a YAML file, passing all structural validation rules and semantic coherence checks",
  actors: ["User", "AiModel", "Validator"],
  object: "FsmStateConfig",
  transitions: [
    ["", "*", "GetUserInput"],
    ["GetUserInput", "inputReady", "GenerateProcessConfig"],
    ["GetUserInput", "noInput", ""],
    ["GenerateProcessConfig", "configValid", "SerializeConfig"],
    ["GenerateProcessConfig", "generationFailed", ""],
    ["SerializeConfig", "configSerialized", ""],
  ],
  states: [
    {
      key: "GetUserInput",
      description:
        "Collect the human-readable process description from user input.",
      outcome: "Process description text loaded and ready for HFSM generation",
      actors: ["User"],
      object: "Process description text",
      events: {
        inputReady:
          "When description text is successfully loaded and is non-empty",
        noInput:
          "When no description is provided, the file is missing, or the user cancels",
      },
    },
    {
      key: "GenerateProcessConfig",
      description:
        "Generate an initial HFSM configuration from the user's description using AI, then iteratively validate and refine it until it passes both structural validation and semantic coherence evaluation",
      outcome:
        "FsmStateConfig that passes all structural rules (L1-S9) with zero errors and zero warnings, and passes AI semantic coherence evaluation (M4, M8, M9) with no incoherencies detected",
      actors: ["AiModel", "Validator"],
      object: "FsmStateConfig",
      events: {
        configValid:
          "When the configuration passes all structural validation rules and semantic coherence evaluation with no issues",
        generationFailed:
          "When maximum refinement iterations are exceeded without producing a fully valid configuration",
      },
      transitions: [
        ["", "*", "GenerateInitialConfig"],
        ["GenerateInitialConfig", "configGenerated", "ValidateProcessConfig"],
        ["ValidateProcessConfig", "configValid", ""],
        ["ValidateProcessConfig", "validationFailed", "RefineProcessConfig"],
        ["RefineProcessConfig", "configRefined", "ValidateProcessConfig"],
        ["RefineProcessConfig", "generationFailed", ""],
      ],
      states: [
        {
          key: "GenerateInitialConfig",
          description:
            "Use AI (generateObject with Zod schema) to transform the user's process description into an initial FsmStateConfig.",
          outcome: "Initial FsmStateConfig generated from the description",
          actors: ["AiModel"],
          object: "FsmStateConfig",
          events: {
            configGenerated:
              "When AI successfully produces an initial HFSM configuration conforming to the Zod schema",
          },
        },
        {
          key: "ValidateProcessConfig",
          description: "Run two-phase validation on the current configuration.",
          outcome:
            "Complete validation report combining structural issues and semantic incoherencies, or confirmation that no issues exist",
          actors: ["Validator", "AiModel"],
          object: "Validation report",
          events: {
            configValid:
              "When structural validation returns zero errors and zero warnings, and AI semantic evaluation detects no incoherencies",
            validationFailed:
              "When structural validation returns errors or warnings, or AI semantic evaluation detects incoherencies",
          },
        },
        {
          key: "RefineProcessConfig",
          description:
            "Send the current configuration along with the complete validation report to AI for targeted refinement.",
          outcome:
            "Refined FsmStateConfig that addresses all reported validation issues from the previous iteration",
          actors: ["AiModel"],
          object: "FsmStateConfig",
          events: {
            configRefined:
              "When AI produces a refined configuration addressing the reported issues",
            generationFailed:
              "When the refinement iteration count exceeds the maximum limit without resolving all issues",
          },
        },
      ],
    },
    {
      key: "SerializeConfig",
      description:
        "Serialize the validated FsmStateConfig to YAML format and write to the specified output file path.",
      outcome: "YAML file written to the output path",
      actors: ["User"],
      object: "YAML file",
      events: {
        configSerialized:
          "When YAML file is successfully written to the output path",
      },
    },
  ],
};
