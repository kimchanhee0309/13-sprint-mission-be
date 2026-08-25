import type { NextFunction, Request, Response } from "express";
import { errorHandler, HttpError, notFoundHandler } from "../error";

function createResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };

  return res as unknown as Response & {
    status: jest.Mock;
    json: jest.Mock;
  };
}

describe("error middleware", () => {
  test("notFoundHandler는 404 HttpError를 next로 넘긴다", () => {
    const next = jest.fn() as jest.MockedFunction<NextFunction>;

    notFoundHandler({} as Request, {} as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 404,
        message: "요청한 리소스를 찾을 수 없습니다.",
      }),
    );
  });

  test("errorHandler는 HttpError 상태와 메시지를 응답한다", () => {
    const res = createResponse();

    errorHandler(
      new HttpError(403, "권한이 없습니다."),
      {} as Request,
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "권한이 없습니다.",
    });
  });

  test("errorHandler는 일반 Error를 500 메시지로 응답한다", () => {
    const res = createResponse();
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    errorHandler(new Error("raw error"), {} as Request, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "서버 오류가 발생했습니다.",
    });

    jest.mocked(console.error).mockRestore();
  });
});
