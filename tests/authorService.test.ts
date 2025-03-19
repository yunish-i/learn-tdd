import app from "../server";
import request from "supertest";
import Author from "../models/author";

describe("Verify GET /authors", () => {
  const mockAuthors = [
    { name: "Ab, Cd", lifespan: "1900-2000" },
    { name: "Zy, Xw", lifespan: "1800-1900" },
    { name: "Ij, Kl", lifespan: "1700-1800" },
  ];

  let consoleSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  it("should respond with a list of author names and lifetimes sorted by family name of the authors", async () => {
    const expectedResponse = [...mockAuthors].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    Author.getAllAuthors = jest.fn().mockImplementationOnce((sortOpts) => {
      if (sortOpts && sortOpts.family_name === 1) {
        return Promise.resolve(expectedResponse);
      }
      return Promise.resolve(mockAuthors);
    });
    const response = await request(app).get(`/authors`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toStrictEqual(expectedResponse);
  });

  it("should respond with a No authors found message when there are no authors in the database", async () => {
    Author.getAllAuthors = jest.fn().mockRejectedValue([]);
    const response = await request(app).get("/authors");
    expect(response.statusCode).toBe(500);
    expect(response.text).toBe("No authors found");
  });

  it("should respond with an error code of 500 if an error occurs when retrieving the authors", async () => {
    Author.getAllAuthors = jest
      .fn()
      .mockRejectedValue(new Error("Database error"));
    const response = await request(app).get(`/authors`);
    expect(response.statusCode).toBe(500);
    expect(consoleSpy).toHaveBeenCalled();
  });
});
