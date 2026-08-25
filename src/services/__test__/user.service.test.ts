import { me } from "../user.service";
import type { AuthUser } from "../../types/domain";

const now = new Date("2026-01-01T00:00:00.000Z");

describe("user.service", () => {
  test("me는 공개 가능한 사용자 정보만 반환한다", () => {
    const user: AuthUser = {
      id: "user_1",
      email: "test@example.com",
      nickname: "테스터",
      image: null,
      encryptedPassword: "secret",
      createdAt: now,
      updatedAt: now,
    };

    const result = me(user);

    expect(result).toEqual({
      id: "user_1",
      email: "test@example.com",
      nickname: "테스터",
      image: null,
      createdAt: now,
      updatedAt: now,
    });
    expect(result).not.toHaveProperty("encryptedPassword");
  });
});
