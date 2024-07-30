import { describe, it, expect, beforeEach, afterEach } from "../deps.ts";
import { withInstance } from "../../src/observe/withInstance.ts";

describe("withInstance", () => {
  interface IUserInfo {
    firstName: string;
    lastName?: string;
  }
  class UserInfo implements IUserInfo {
    firstName: string;
    lastName?: string;
    toJson() {
      return {
        firstName: this.firstName,
        lastName: this.lastName,
      };
    }
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
    expect(info instanceof UserInfo).toBe(true);

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

  it("should forward all properties to an external object", async () => {
    let data: IUserInfo = {
      firstName: "John",
      lastName: "Smith",
    };
    const useUserInfo = withInstance(UserInfo);
    let updates: IUserInfo[] = [];
    const user = useUserInfo(data, (d) => {
      data = d;
      updates.push(d);
    });
    expect(data).toEqual({
      firstName: "John",
      lastName: "Smith",
    });
    expect(updates).toEqual([]);
    expect(user.firstName).toEqual("John");
    expect(user.lastName).toEqual("Smith");

    user.firstName = "JOHN";
    user.lastName = "SMITH";

    expect(data).toEqual({
      firstName: "JOHN",
      lastName: "SMITH",
    });
    expect(updates).toEqual([
      { firstName: "JOHN", lastName: "Smith" },
      { firstName: "JOHN", lastName: "SMITH" },
    ]);
    expect(user.firstName).toEqual("JOHN");
    expect(user.lastName).toEqual("SMITH");
    expect(user.fullName).toEqual("JOHN SMITH");
  });
});
