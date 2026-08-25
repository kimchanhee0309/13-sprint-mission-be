import type { Request } from "express";
import { imageUrlsFromRequest } from "../upload.service";

describe("upload.service", () => {
  test("업로드된 파일 목록을 접근 가능한 URL 목록으로 변환한다", () => {
    const req = {
      protocol: "http",
      get: jest.fn(() => "localhost:4000"),
      files: [{ filename: "a.png" }, { filename: "b.png" }],
    } as unknown as Request;

    expect(imageUrlsFromRequest(req)).toEqual([
      "http://localhost:4000/uploads/a.png",
      "http://localhost:4000/uploads/b.png",
    ]);
  });

  test("업로드된 파일이 없으면 빈 배열을 반환한다", () => {
    const req = {
      protocol: "http",
      get: jest.fn(() => "localhost:4000"),
      files: undefined,
    } as unknown as Request;

    expect(imageUrlsFromRequest(req)).toEqual([]);
  });
});
