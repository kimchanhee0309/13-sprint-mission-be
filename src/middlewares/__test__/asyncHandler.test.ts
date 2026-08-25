import type { NextFunction, Request, Response } from "express";
import asyncHandler from "../asyncHandler";

describe("asyncHandler middleware", () => {
  test("비동기 핸들러가 resolve되면 next에 에러를 넘기지 않는다", async () => {
    const req = {} as Request;
    const res = {} as Response;
    const next = jest.fn() as jest.MockedFunction<NextFunction>;
    const handler = jest.fn(async () => undefined);

    await asyncHandler(handler)(req, res, next);

    expect(handler).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  test("비동기 핸들러가 reject되면 next로 에러를 넘긴다", async () => {
    const req = {} as Request;
    const res = {} as Response;
    const next = jest.fn() as jest.MockedFunction<NextFunction>;
    const error = new Error("boom");
    const handler = jest.fn(async () => {
      throw error;
    });

    await asyncHandler(handler)(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
