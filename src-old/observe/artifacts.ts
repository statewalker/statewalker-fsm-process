export interface Artifact {
  type: "file" | "text" | "json" | "error";
  name: string;
  content: unknown;
  timestamp: number;
  statePath: string[];
}

export class ArtifactStore {
  private artifacts: Artifact[] = [];

  add(statePath: string[], artifact: Omit<Artifact, "statePath">): void {
    this.artifacts.push({
      ...artifact,
      statePath: [...statePath],
    });
  }

  getTree(statePath: string[]): Map<string, Artifact[]> {
    const prefix = statePath.join(".");
    const result = new Map<string, Artifact[]>();

    for (const a of this.artifacts) {
      const key = a.statePath.join(".");
      if (key === prefix || key.startsWith(`${prefix}.`)) {
        const existing = result.get(key) ?? [];
        existing.push(a);
        result.set(key, existing);
      }
    }

    return result;
  }

  all(): Artifact[] {
    return [...this.artifacts];
  }
}
