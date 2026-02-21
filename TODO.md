# TODO
---
## Validation and Refinement TODOs

### validateProcessConfigHandler

* Allow semantic validation step even if there are structural errors. 

* Get all structural errors and warnings organized in trees (parent state -> child state) and serialize them as YAML:
  * Structural errors and warnings (if any) with references to corresponding braking rules. 
  * Semantic elements to verify (e.g. goal alignment, event-state consistency, convergent transition compatibility) with references to the corresponding rules to verify.
  * All mentioned rules to validate added as a separate reference block in the prompt. Use structured object with rules exported from @statewalker/fsm-validator to generate this block.

* Prompt should contain request actionable instructions from LLM to return a structured object with identified incoherencies, including:
  * Type of incoherency (e.g. goal misalignment, event-state inconsistency, convergent transition incompatibility).
  * Description of the issue.
  * Reference to the specific part of the configuration that is affected (e.g. state name, event name, transition name).
  * Reference to the corresponding rule that is violated.
  * Suggestion for how to fix the issue (if possible).

* Add detailed description for each field in semanticIssueSchema


### refineProcessConfigHandler

* Results of the semantic validation from  validateProcessConfigHandler should be used in the refineProcessConfigHandler to guide the refinement process.
The feedback should be structured and actionable, providing clear guidance on how to address each identified incoherency.

