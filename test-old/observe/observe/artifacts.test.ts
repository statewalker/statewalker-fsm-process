import { ArtifactStore } from "../../src/observe/artifacts.ts";
import { describe, expect, it } from "../deps.ts";

describe("ArtifactStore", () => {
  it("should add and retrieve all artifacts", () => {
    const store = new ArtifactStore();
    store.add(["Root", "Step"], {
      type: "text",
      name: "step-result",
      content: "hello",
      timestamp: 1000,
    });
    store.add(["Root", "Step2"], {
      type: "json",
      name: "step2-data",
      content: { x: 1 },
      timestamp: 2000,
    });

    const all = store.all();
    expect(all).toHaveLength(2);
    expect(all[0].name).toBe("step-result");
    expect(all[0].statePath).toEqual(["Root", "Step"]);
    expect(all[1].name).toBe("step2-data");
  });

  it("should return a copy from all()", () => {
    const store = new ArtifactStore();
    store.add(["Root"], {
      type: "text",
      name: "x",
      content: "y",
      timestamp: 0,
    });

    const a = store.all();
    const b = store.all();
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });

  it("should filter by state path prefix in getTree", () => {
    const store = new ArtifactStore();
    store.add(["Root", "A"], {
      type: "text",
      name: "a1",
      content: "x",
      timestamp: 100,
    });
    store.add(["Root", "A", "Child"], {
      type: "text",
      name: "child1",
      content: "y",
      timestamp: 200,
    });
    store.add(["Root", "B"], {
      type: "text",
      name: "b1",
      content: "z",
      timestamp: 300,
    });

    const tree = store.getTree(["Root", "A"]);
    expect(tree.size).toBe(2);
    expect(tree.get("Root.A")).toHaveLength(1);
    expect(tree.get("Root.A.Child")).toHaveLength(1);
    expect(tree.has("Root.B")).toBe(false);
  });

  it("should return empty map when no artifacts match", () => {
    const store = new ArtifactStore();
    store.add(["Root", "A"], {
      type: "text",
      name: "x",
      content: "y",
      timestamp: 0,
    });

    const tree = store.getTree(["Root", "B"]);
    expect(tree.size).toBe(0);
  });

  it("should store error artifacts", () => {
    const store = new ArtifactStore();
    store.add(["Root", "Fail"], {
      type: "error",
      name: "fail-error",
      content: "something broke",
      timestamp: 500,
    });

    const all = store.all();
    expect(all).toHaveLength(1);
    expect(all[0].type).toBe("error");
  });
});
