import { describe, it, expect, beforeEach, afterEach } from "../deps.ts";
import { withInstance, wrap } from "../../src/props/index.ts";

describe("Properties Proxy", () => {
  interface IUserInfo {
    firstName: string;
    lastName?: string;
  }
  class UserInfo implements IUserInfo {
    firstName: string;
    lastName?: string;
    get fullName() {
      return this.firstName + " " + this.lastName;
    }
    constructor({ firstName, lastName }: IUserInfo) {
      this.firstName = firstName;
      this.lastName = lastName;
    }
  }

  it("should manage instance of a specific type", () => {
    const useUserInfo = withInstance(UserInfo);
    let data: IUserInfo = {
      firstName: "John",
      lastName: "Smith",
    };
    const info = useUserInfo(data, (d) => (data = d));
    expect(data).toEqual({
      firstName: "John",
      lastName: "Smith",
    });
    info.lastName = "SMITH";
    expect(data).toEqual({
      firstName: "John",
      lastName: "SMITH",
    });
    expect(info.fullName).toEqual("John SMITH");
  });

  it("should forward all properties to an externfal object", async () => {
    const data: Record<string, any> = {
      firstName: "John",
      lastName: "Smith",
    };
    const user = new UserInfo(data as IUserInfo);
    let updates: [string, unknown][] = [];
    const user1 = wrap(
      user,
      (field) => data[field],
      (field, value) => {
        data[field] = value;
        updates.push([field, value]);
      }
    );
    expect(user1).toBe(user);
    expect(data).toEqual({
      firstName: "John",
      lastName: "Smith",
    });
    expect(updates).toEqual([
      ["firstName", "John"],
      ["lastName", "Smith"],
    ]);
    expect(user.firstName).toEqual("John");
    expect(user.lastName).toEqual("Smith");

    user.firstName = "JOHN";
    user.lastName = "SMITH";

    expect(data).toEqual({
      firstName: "JOHN",
      lastName: "SMITH",
    });
    expect(updates).toEqual([
      ["firstName", "John"],
      ["lastName", "Smith"],
      ["firstName", "JOHN"],
      ["lastName", "SMITH"],
    ]);
    expect(user.firstName).toEqual("JOHN");
    expect(user.lastName).toEqual("SMITH");
  });
});
