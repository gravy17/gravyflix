import { Request, Response, NextFunction } from "express";

const mockSave = jest.fn();
const mockFindOne = jest.fn();
const uploadImageMock = jest.fn();

jest.mock("../src/models/User", () => ({
  __esModule: true,
  default: Object.assign(
    jest.fn().mockImplementation((data: Record<string, unknown>) => ({
      ...data,
      save: mockSave,
    })),
    {
      findOne: mockFindOne,
    }
  ),
}));

jest.mock("../src/utils/image-utils", () => ({
  uploadImage: uploadImageMock,
}));

import { register } from "../src/controllers/user";

describe("register image upload", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSave.mockResolvedValue({ _id: "user-id" });
    mockFindOne.mockResolvedValue(null);
    uploadImageMock.mockResolvedValue("https://ik.imagekit.io/test/profile.jpg");
  });

  it("uploads a provided image URL to imagekit before saving the user", async () => {
    const req = {
      body: {
        fullname: "Jane Doe",
        username: "jane",
        email: "jane@example.com",
        password: "password123",
        confirm_password: "password123",
        image: "https://example.com/profile.jpg",
      },
    } as unknown as Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;

    const next = jest.fn() as unknown as NextFunction;

    await register(req, res, next);

    expect(uploadImageMock).toHaveBeenCalledWith(
      "https://example.com/profile.jpg",
      expect.any(String),
      "jane"
    );
    expect(mockSave).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
