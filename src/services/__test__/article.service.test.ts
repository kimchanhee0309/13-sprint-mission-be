import * as articleService from "../article.service";
import * as articlesRepository from "../../repositories/article.repository";
import * as commentsRepository from "../../repositories/comment.repository";
import type {
  ArticleBody,
  ArticleWithRelations,
  AuthUser,
} from "../../types/domain";

jest.mock("../../repositories/article.repository");
jest.mock("../../repositories/comment.repository");
jest.mock("../../repositories.prisma.repository", () => ({
  createId: jest.fn((prefix: string) => `${prefix}_test`),
  prisma: {
    $transaction: jest.fn(async (callback) =>
      callback({
        articleLike: {
          upsert: jest.fn(),
          deleteMany: jest.fn(),
        },
      }),
    ),
  },
}));

const mockedArticlesRepository = jest.mocked(articlesRepository);
const mockedCommentsRepository = jest.mocked(commentsRepository);

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
  nickname: "다른 사용자",
};

const articleBody: ArticleBody = {
  title: "게시글 제목",
  content: "게시글 내용입니다.",
  imageUrls: ["https://example.com/article.png"],
};

function createArticle(
  overrides: Partial<ArticleWithRelations> = {},
): ArticleWithRelations {
  return {
    id: "article_1",
    title: "게시글 제목",
    content: "게시글 내용입니다.",
    imageUrls: ["https://example.com/article.png"],
    ownerId: owner.id,
    owner,
    likes: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("article.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("게시글을 생성한다", async () => {
    mockedArticlesRepository.create.mockResolvedValue(createArticle());

    const result = await articleService.create(articleBody, owner);

    expect(mockedArticlesRepository.create).toHaveBeenCalledWith({
      id: "article_test",
      title: articleBody.title,
      content: articleBody.content,
      imageUrls: ["https://example.com/article.png"],
      ownerId: owner.id,
    });
    expect(result.title).toBe("게시글 제목");
    expect(result.ownerNickname).toBe("작성자");
  });

  test("게시글 상세와 댓글 목록을 조회한다", async () => {
    mockedArticlesRepository.findById.mockResolvedValue(createArticle());
    mockedCommentsRepository.findByTarget.mockResolvedValue([]);

    const result = await articleService.detail("article_1", owner.id);

    expect(mockedArticlesRepository.findById).toHaveBeenCalledWith("article_1");
    expect(mockedCommentsRepository.findByTarget).toHaveBeenCalledWith(
      "article",
      "article_1",
    );
    expect(result.comments).toEqual([]);
  });

  test("존재하지 않는 게시글 상세 조회는 404를 던진다", async () => {
    mockedArticlesRepository.findById.mockResolvedValue(null);

    await expect(articleService.detail("missing")).rejects.toMatchObject({
      status: 404,
      message: "게시글을 찾을 수 없습니다.",
    });
  });

  test("게시글 작성자는 게시글을 수정할 수 있다", async () => {
    mockedArticlesRepository.findById.mockResolvedValue(createArticle());
    mockedArticlesRepository.update.mockResolvedValue(
      createArticle({ title: "수정된 제목" }),
    );

    const result = await articleService.update("article_1", articleBody, owner);

    expect(mockedArticlesRepository.update).toHaveBeenCalledWith("article_1", {
      title: articleBody.title,
      content: articleBody.content,
      imageUrls: ["https://example.com/article.png"],
    });
    expect(result.title).toBe("수정된 제목");
  });

  test("게시글 작성자가 아니면 게시글을 수정할 수 없다", async () => {
    mockedArticlesRepository.findById.mockResolvedValue(createArticle());

    await expect(
      articleService.update("article_1", articleBody, otherUser),
    ).rejects.toMatchObject({
      status: 403,
      message: "게시글 작성자만 수정할 수 있습니다.",
    });

    expect(mockedArticlesRepository.update).not.toHaveBeenCalled();
  });

  test("게시글 작성자는 게시글을 삭제할 수 있다", async () => {
    mockedArticlesRepository.findById.mockResolvedValue(createArticle());
    mockedArticlesRepository.remove.mockResolvedValue(createArticle());

    await expect(articleService.remove("article_1", owner)).resolves.toEqual({
      ok: true,
    });
    expect(mockedArticlesRepository.remove).toHaveBeenCalledWith("article_1");
  });
});
