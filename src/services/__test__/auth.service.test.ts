import bcrypt from "bcryptjs";
import { signIn, signUp } from "../auth.service";
import * as usersRepository from "../../repositories/user.repository";
import type { AuthUser } from "../../types/domain";

jest.mock("bcryptjs", () => ({
  __esModule: true,
  default: {
    hash: jest.fn(),
    compare: jest.fn(),
  },
}));

jest.mock("../../repositories/user.repository");
jest.mock("../../repositories/prisma.repository", () => ({
  createId: jest.fn(() => "user_test"),
}));

const mockedBcrypt = jest.mocked(bcrypt);
const mockedUsersRepository = jest.mocked(usersRepository);

const now = new Date("2026-01-01T00:00:00.000Z");

const user: AuthUser = {
  id: "user_test",
  email: "test@example.com",
  nickname: "테스터",
  image: "",
  encryptedPassword: "hashed-password",
  createdAt: now,
  updatedAt: now,
};

describe("auth.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("회원가입에 성공하면 사용자 정보와 토큰을 반환한다", async () => {
    mockedUsersRepository.findByEmail.mockResolvedValue(null);
    mockedUsersRepository.create.mockResolvedValue(user);
    mockedBcrypt.hash.mockResolvedValue("hashed-password" as never);

    const result = await signUp({
      email: "test@example.com",
      nickname: "테스터",
      password: "password123",
    });

    expect(mockedUsersRepository.create).toHaveBeenCalledWith({
      id: "user_test",
      email: "test@example.com",
      nickname: "테스터",
      image: "",
      encryptedPassword: "hashed-password",
    });

    expect(result.user?.email).toBe("test@example.com");
    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
  });

  test("이미 가입된 이메일이면 회원가입에 실패한다", async () => {
    mockedUsersRepository.findByEmail.mockResolvedValue(user);

    await expect(
      signUp({
        email: "test@example.com",
        nickname: "테스터",
        password: "password123",
      }),
    ).rejects.toMatchObject({
      status: 409,
      message: "이미 가입된 이메일입니다.",
    });

    expect(mockedUsersRepository.create).not.toHaveBeenCalled();
  });

  test("로그인에 성공하면 사용자 정보와 토큰을 반환한다", async () => {
    mockedUsersRepository.findByEmail.mockResolvedValue(user);
    mockedBcrypt.compare.mockResolvedValue(true as never);

    const result = await signIn({
      email: "test@example.com",
      password: "password123",
    });

    expect(mockedBcrypt.compare).toHaveBeenCalledWith(
      "password123",
      "hashed-password",
    );

    expect(result.user?.id).toBe("user_test");
    expect(result.accessToken).toEqual(expect.any(String));
  });

  test("비밀번호가 틀리면 로그인에 실패한다", async () => {
    mockedUsersRepository.findByEmail.mockResolvedValue(user);
    mockedBcrypt.compare.mockResolvedValue(false as never);

    await expect(
      signIn({
        email: "test@example.com",
        password: "wrong-password",
      }),
    ).rejects.toMatchObject({
      status: 401,
      message: "이메일 또는 비밀번호가 올바르지 않습니다.",
    });
  });
});
