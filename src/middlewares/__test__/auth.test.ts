import type { NextFunction, Request, Response } from "express";
import { optionalAuth, requireAuth, signAccessToken } from "../auth";
import * as usersRepository from "../../repositories/user.repository";
import type { AuthUser } from "../../types/domain";

jest.mock("../../repositories/user.repository");

const mockedUsersRepository = jest.mocked(usersRepository);

const now = new Date("2026-01-01T00:00:00.000Z");

const user: AuthUser = {
  id: "user_1",
  email: "test@example.com",
  nickname: "테스터",
  image: null,
  encryptedPassword: "hashed",
  createdAt: now,
  updatedAt: now,
};

function createRequest(token?: string): Request {
  return {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  } as Request;
}

function createNext() {
  return jest.fn() as jest.MockedFunction<NextFunction>;
}

describe("auth middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("requireAuth는 유효한 토큰이면 req.user를 설정한다", async () => {
    const token = signAccessToken(user);
    const req = createRequest(token);
    const next = createNext();

    mockedUsersRepository.findById.mockResolvedValue(user);

    await requireAuth(req, {} as Response, next);

    expect(req.user).toEqual(user);
    expect(next).toHaveBeenCalledWith();
  });

  test("requireAuth는 토큰이 없으면 401 에러를 next로 넘긴다", async () => {
    const next = createNext();

    await requireAuth(createRequest(), {} as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 401,
        message: "로그인이 필요합니다.",
      }),
    );
  });

  test("optionalAuth는 토큰이 없어도 통과한다", async () => {
    const req = createRequest();
    const next = createNext();

    await optionalAuth(req, {} as Response, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });
});
