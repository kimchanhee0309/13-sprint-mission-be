import { HttpError } from "../../middlewares/error";
import * as productService from "../product.service";
import * as commentsRepository from "../../repositories/comment.repository";
import * as productsRepository from "../../repositories/product.repository";
import type {
  AuthUser,
  ProductBody,
  ProductWithRelations,
} from "../../types/domain";

jest.mock("../../repositories/product.repository");
jest.mock("../../repositories/comment.repository");
jest.mock("../../repositories/prisma.repository", () => ({
  createId: jest.fn((prefix: string) => `${prefix}_test`),
  prisma: {
    $transaction: jest.fn(async (callback) =>
      callback({
        productLike: {
          upsert: jest.fn(),
          deleteMany: jest.fn(),
        },
      }),
    ),
  },
}));

const mockedProductsRepository = jest.mocked(productsRepository);
const mockedCommentsRepository = jest.mocked(commentsRepository);

const now = new Date("2026-01-01T00:00:00.000Z");

const owner: AuthUser = {
  id: "user_1",
  email: "owner@example.com",
  nickname: "판매자",
  image: null,
  encryptedPassword: "hashed",
  createdAt: now,
  updatedAt: now,
};

const otherUser: AuthUser = {
  ...owner,
  id: "user_2",
  email: "other@example.com",
  nickname: "다른사용자",
};

const productBody: ProductBody = {
  name: "아이패드",
  description: "상태 좋은 아이패드입니다",
  price: 500000,
  tags: ["태블릿"],
  imageUrls: ["https://example.com/ipad.png"],
};

function createProduct(
  overrides: Partial<ProductWithRelations> = {},
): ProductWithRelations {
  return {
    id: "product_1",
    name: "아이패드",
    description: "상태 좋은 아이패드입니다",
    price: 500000,
    tags: ["태블릿"],
    imageUrls: ["https://example.com/ipad.png"],
    ownerId: owner.id,
    owner,
    likes: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("product.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("상품을 생성한다", async () => {
    mockedProductsRepository.create.mockResolvedValue(createProduct());

    const result = await productService.create(productBody, owner);

    expect(mockedProductsRepository.create).toHaveBeenCalledWith({
      id: "product_test",
      name: productBody.name,
      description: productBody.description,
      price: productBody.price,
      tags: ["태블릿"],
      imageUrls: ["https://example.com/ipad.png"],
      ownerId: owner.id,
    });

    expect(result.name).toBe("아이패드");
    expect(result.ownerNickname).toBe("판매자");
  });

  test("상품 상세와 댓글 목록을 조회한다", async () => {
    mockedProductsRepository.findById.mockResolvedValue(createProduct());
    mockedCommentsRepository.findByTarget.mockResolvedValue([]);

    const result = await productService.detail("product_1", owner.id);

    expect(mockedProductsRepository.findById).toHaveBeenCalledWith("product_1");
    expect(mockedCommentsRepository.findByTarget).toHaveBeenCalledWith(
      "product",
      "product_1",
    );
    expect(result.comments).toEqual([]);
  });

  test("존재하지 않는 상품 상세 조회는 404를 던진다", async () => {
    mockedProductsRepository.findById.mockResolvedValue(null);

    await expect(productService.detail("missing")).rejects.toMatchObject({
      status: 404,
      message: "상품을 찾을 수 없습니다.",
    });
  });

  test("상품 작성자는 상품을 수정할 수 없다", async () => {
    mockedProductsRepository.findById.mockResolvedValue(createProduct());
    mockedProductsRepository.update.mockResolvedValue(
      createProduct({ name: "수정된 상품" }),
    );

    const result = await productService.update("product_1", productBody, owner);

    expect(mockedProductsRepository.update).toHaveBeenCalledWith("product_1", {
      name: productBody.name,
      description: productBody.description,
      price: productBody.price,
      tags: ["태블릿"],
      imageUrls: ["https://example.com/ipad.png"],
    });

    expect(result.name).toBe("수정된 상품");
  });

  test("상품 작성자가 아니면 상품을 수정할 수 없다", async () => {
    mockedProductsRepository.findById.mockResolvedValue(createProduct());

    await expect(
      productService.update("product_1", productBody, otherUser),
    ).rejects.toMatchObject({
      status: 403,
      message: "상품 작성자만 수정할 수 있습니다.",
    });

    expect(mockedProductsRepository.update).not.toHaveBeenCalled();
  });

  test("상품 작성자는 상품을 삭제할 수 있다", async () => {
    mockedProductsRepository.findById.mockResolvedValue(createProduct());
    mockedProductsRepository.remove.mockResolvedValue(createProduct());

    await expect(productService.remove("product_1", owner)).resolves.toEqual({
      ok: true,
    });

    expect(mockedProductsRepository.remove).toHaveBeenCalledWith("product_1");
  });

  test("상품 작성자가 아니면 상품을 삭제할 수 없다", async () => {
    mockedProductsRepository.findById.mockResolvedValue(createProduct());

    await expect(
      productService.remove("product_1", otherUser),
    ).rejects.toBeInstanceOf(HttpError);

    expect(mockedProductsRepository.remove).not.toHaveBeenCalled();
  });
});
