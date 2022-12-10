import request from "supertest";
process.env.JWT_SECRET = "secret";
import app from '../src/app';
import { Users } from "../src/models/User";

describe("Tests Register Endpoint", () => {
  beforeAll(async () => {
    const preExisting = await Users.findOne({ where: { email: "johndoe@example.com" } })
    await preExisting?.destroy();
  })

  it("registers a new user", async () => {
    const res = await request(app).post("/api/register").send({
      "fullname": "john doe",
      "username":"johnny",
      "email": "johndoe@example.com", 
      "password":"ofyourchoice",
      "confirm_password":"ofyourchoice"
    });
    expect(res.status).toBe(201);
  });
  it("fails to register a user with a duplicate email", async () => {
    const res = await request(app).post("/api/register").send({
      "fullname":"johnny doeminion",
      "username":"john",
      "email":"johndoe@example.com",
      "password":"someotherpassword",
      "confirm_password":"someotherpassword",
    });
    expect(res.status).toBe(400);
  });
  it("fails to register a user with invalid details", async () => {
    const res = await request(app).post("/api/register").send({
      "fullname":"paul walker",
      "username":"paul",
      "email":"",
      "password":"almostmatch",
      "confirm_password":"lmostmatch",
    });
    expect(res.status).toBe(400);
  });
  it("only responds to post requests", async () => {
    const res = await request(app).get("/api/register").send({
      "fullname":"johnny doeminion",
      "username":"john",
      "email":"johndoe@example.com",
      "password":"someotherpassword",
      "confirm_password":"someotherpassword",
    });
    expect(res.status).toBe(404);
  });
});

describe("Tests Login Endpoint", () => {
  beforeAll(async () => {
    const preExisting = await Users.findOne({
      where: {
        email: "johndoe@example.com"
      },
    });
    await preExisting?.destroy();
    await request(app).post("/api/register").send({
      "fullname": "john doe",
      "username":"johnny",
      "email": "johndoe@example.com", 
      "password":"ofyourchoice",
      "confirm_password":"ofyourchoice"
    });
  });

  it("logs in a valid user", async () => {
    const res = await request(app).post("/api/login").send({
      "username": "johnny",
      "password": "ofyourchoice"
    });
    expect(res.status).toBe(200);
  });
  it("fails to login a user with an incorrect password", async () => {
    const res = await request(app).post("/api/login").send({
      "username": "johnny",
      "password": "ofyourchoices"
    });
    expect(res.status).toBe(401);
  });
  it("fails to login a user with invalid credentials", async () => {
    const res = await request(app).post("/api/login").send({
      "email": "johndoe@example.com",
      "password": "ofyourchoice",
    });
    expect(res.status).toBe(400);
  });
  it("only responds to post requests", async () => {
    const res = await request(app).get("/api/login").send({
      "username": "paul",
      "password": "almostmatch"
    });
    expect(res.status).toBe(404);
  });
});