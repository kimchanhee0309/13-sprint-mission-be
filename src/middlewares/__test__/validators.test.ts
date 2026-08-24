import type { NextFunction, Request, Response } from "express";
import { validateComment, validateProduct } from "../validators";

function createRequest(body: Record<string, unknown>): Request {
  return { body } as Request;
}

function createNext() {
  return jest.fn() as jest.MockedFunction<NextFunction>;
}

describe("validators middleware", () => {
  test("validateProduct는 유효한 상품 body를 정리하고 통과시킨다", () => {
    const req = createRequest({
      name: "아이패드",
      description: "상태 좋은 아이패드입니다",
      price: "500000",
      tags: ["태블릿"],
    });

    const next = createNext();

    validateProduct(req, {} as Response, next);

    expect(req.body).toMatchObject({
      name: "아이패드",
      description: "상태 좋은 아이패드입니다",
      price: 500000,
    });

    expect(next).toHaveBeenCalledWith();
  });

  test("validateProduct는 상품명이 10자를 넘으면 400 에러를 넘긴다", () => {
    const req = createRequest({
      name: "너무긴상품명입니다",
      description: "상품 설명은 충분히 깁니다.",
      price: 1000,
    });

    const next = createNext();

    validateProduct(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
        message: "상품명은 10자 이내로 입력해주세요",
      }),
    );
  });

  test("validateComment는 댓글 내용을 trim한다", () => {
    const req = createRequest({
      content: "문의드립니다.",
    });

    const next = createNext();

    validateComment(req, {} as Response, next);

    expect(req.body.content).toBe("문의드립니다.");
    expect(next).toHaveBeenCalledWith();
  });

  test("validateComment는 빈 댓글이면 400 에러를 넘긴다", () => {
    const req = createRequest({
      content: "  ",
    });

    const next = createNext();

    validateComment(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
        message: "댓글을(을) 입력해주세요.",
      }),
    );
  });
});
