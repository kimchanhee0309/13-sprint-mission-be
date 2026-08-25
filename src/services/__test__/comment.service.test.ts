import * as commentService from "../comment.service";
import * as articlesRepository from "../../repositories/article.repository";
import * as commentsRepository from "../../repositories/comment.repository";
import * as productsRepository from "../../repositories/product.repository";
import type {
  ArticleWithRelations,
  AuthUser,
  CommentWithOwner,
  ProductWithRelations,
} from "../../types/domain";

jest.mock("../../repositories/article.repository");
jest.mock("../../repositories/comment.repository");
jest.mock("../../repositories/product.repository");
jest.mock("../../repositories/prisma.repository", () => ({
  createId: jest.fn((prefix: string) => `${prefix}_test`),
}));

const mockedArticlesRepository = jest.mocked(articlesRepository);
const mockedCommentsRepository = jest.mocked(commentsRepository);
const mockedProductsRepository = jest.mocked(productsRepository);

const now = new Date("2026-01-01T00:00:00.000Z");

const owner: AuthUser = {
  id: "user_1",
  email: "owner@example.com",
  nickname: "작성자",
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

const product: ProductWithRelations = {
  id: "product_1",
  name: "아이패드",
  description: "상태 좋은 아이패드입니다.",
  price: 500000,
  tags: [],
  imageUrls: [],
  ownerId: owner.id,
  owner,
  likes: [],
  createdAt: now,
  updatedAt: now,
};

const article: ArticleWithRelations = {
  id: "article_1",
  title: "게시글 제목",
  content: "게시글 내용입니다.",
  imageUrls: [],
  ownerId: owner.id,
  owner,
  likes: [],
  createdAt: now,
  updatedAt: now,
};

function createComment(
  overrides: Partial<CommentWithOwner> = {},
): CommentWithOwner {
  return {
    id: "comment_1",
    targetType: "product",
    targetId: "product_1",
    content: "문의드립니다.",
    ownerId: owner.id,
    owner,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("comment.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("상품 댓글을 등록한다", async () => {
    mockedProductsRepository.findById.mockResolvedValue(product);
    mockedCommentsRepository.create.mockResolvedValue(createComment());

    const result = await commentService.createForTarget(
      "product",
      "product_1",
      "문의드립니다.",
      owner,
    );

    expect(mockedCommentsRepository.create).toHaveBeenCalledWith({
      id: "comment_test",
      targetType: "product",
      targetId: "product_1",
      content: "문의드립니다.",
      ownerId: owner.id,
    });

    expect(result.content).toBe("문의드립니다.");
  });

  test("게시글 댓글을 등록한다", async () => {
    mockedArticlesRepository.findById.mockResolvedValue(article);
    mockedCommentsRepository.create.mockResolvedValue(
      createComment({ targetType: "article", targetId: "article_1" }),
    );

    const result = await commentService.createForTarget(
      "article",
      "article_1",
      "댓글입니다.",
      owner,
    );

    expect(mockedCommentsRepository.create).toHaveBeenCalledWith({
      id: "comment_test",
      targetType: "article",
      targetId: "article_1",
      content: "댓글입니다.",
      ownerId: owner.id,
    });

    expect(result.targetType).toBe("article");
  });

  test("대상 상품이 없으면 댓글 등록에 실패한다", async () => {
    mockedProductsRepository.findById.mockResolvedValue(null);

    await expect(
      commentService.createForTarget("product", "missing", "문의", owner),
    ).rejects.toMatchObject({
      status: 404,
      message: "상품을 찾을 수 없습니다.",
    });
  });

  test("댓글 작성자는 댓글을 수정할 수 있다", async () => {
    mockedCommentsRepository.findById.mockResolvedValue(createComment());
    mockedCommentsRepository.update.mockResolvedValue(
      createComment({ content: "수정된 댓글입니다." }),
    );

    const result = await commentService.update(
      "comment_1",
      "수정된 댓글입니다.",
      owner,
    );

    expect(mockedCommentsRepository.update).toHaveBeenCalledWith("comment_1", {
      content: "수정된 댓글입니다.",
    });
    expect(result.content).toBe("수정된 댓글입니다.");
  });

  test("댓글 작성자가 아니면 댓글을 수정할 수 없다", async () => {
    mockedCommentsRepository.findById.mockResolvedValue(createComment());

    await expect(
      commentService.update("comment_1", "수정", otherUser),
    ).rejects.toMatchObject({
      status: 403,
      message: "댓글 작성자만 수정할 수 있습니다.",
    });

    expect(mockedCommentsRepository.update).not.toHaveBeenCalled();
  });

  test("댓글 작성자는 댓글을 삭제할 수 있다", async () => {
    mockedCommentsRepository.findById.mockResolvedValue(createComment());
    mockedCommentsRepository.remove.mockResolvedValue(createComment());

    await expect(commentService.remove("comment_1", owner)).resolves.toEqual({
      ok: true,
    });

    expect(mockedCommentsRepository.remove).toHaveBeenCalledWith("comment_1");
  });
});
