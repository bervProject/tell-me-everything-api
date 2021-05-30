import feathers from "@feathersjs/feathers";
import {
  AccountLinkEvent,
  MessageEvent,
  FollowEvent,
  JoinEvent,
  MemberJoinEvent,
  WebhookRequestBody,
} from "@line/bot-sdk";
import botLineRespond from "../../src/hooks/bot-line-respond";

describe("Hook test 'bot-error-handling ", () => {
  let server: feathers.Application<any>;
  beforeAll(() => {
    server = feathers();
    server.use("random", {
      async create(
        data: Partial<any> | Partial<any>[],
        params: feathers.Params,
      ) {
        return {};
      },
    });
    server.service("random").hooks({
      before: { create: [botLineRespond()] },
    });
    const clientMock = jest.fn().mockImplementation((query) => ({
      getProfile: jest.fn(),
      replyMessage: jest.fn(),
      leaveRoom: jest.fn(),
      leaveGroup: jest.fn(),
    }));
    server.set("lineClient", clientMock);
  });
  test("Test Empty Events", async () => {
    expect.assertions(1);
    const request: WebhookRequestBody = {
      destination: "here",
      events: [],
    };
    const result = await server.service("random").create(request);
    console.log(JSON.stringify(result));
    expect(result).toBe(request.events);
  });

  test("Test MemberJoinEvent", async () => {
    expect.assertions(1);
    const memberJoinEvent: MemberJoinEvent = {
      type: "memberJoined",
      joined: { members: [{ userId: "", type: "user" }] },
      timestamp: 0,
      source: { type: "group", groupId: "anon" },
      mode: "active",
      replyToken: "mock",
    };
    const request: WebhookRequestBody = {
      destination: "here",
      events: [memberJoinEvent],
    };
    const result = await server.service("random").create(request);
    console.log(JSON.stringify(result));
    expect(result).toBe(request.events);
  });

  test("Test JoinEvent", async () => {
    expect.assertions(1);
    const joinEvent: JoinEvent = {
      type: "join",
      timestamp: 0,
      source: { type: "group", groupId: "anon" },
      mode: "active",
      replyToken: "mock",
    };
    const request: WebhookRequestBody = {
      destination: "here",
      events: [joinEvent],
    };
    const result = await server.service("random").create(request);
    console.log(JSON.stringify(result));
    expect(result).toBe(request.events);
  });

  test("Test FollowEvent", async () => {
    expect.assertions(1);
    const followEvent: FollowEvent = {
      type: "follow",
      timestamp: 0,
      source: { type: "user", userId: "anon" },
      mode: "active",
      replyToken: "mock",
    };
    const request: WebhookRequestBody = {
      destination: "here",
      events: [followEvent],
    };
    const result = await server.service("random").create(request);
    console.log(JSON.stringify(result));
    expect(result).toBe(request.events);
  });

  test("Test MessageEvent hi", async () => {
    expect.assertions(1);
    const messageEvent: MessageEvent = {
      type: "message",
      timestamp: 0,
      source: { type: "user", userId: "ok" },
      message: { type: "text", text: "hi", id: "randomly" },
      mode: "active",
      replyToken: "mock",
    };
    const request: WebhookRequestBody = {
      destination: "here",
      events: [messageEvent],
    };
    const result = await server.service("random").create(request);
    console.log(JSON.stringify(result));
    expect(result).toBe(request.events);
  });

  test("Test MessageEvent bantuan", async () => {
    expect.assertions(1);
    const messageEvent: MessageEvent = {
      type: "message",
      timestamp: 0,
      source: { type: "group", groupId: "ok" },
      message: { type: "text", text: "bantuan", id: "randomly" },
      mode: "active",
      replyToken: "mock",
    };
    const request: WebhookRequestBody = {
      destination: "here",
      events: [messageEvent],
    };
    const result = await server.service("random").create(request);
    console.log(JSON.stringify(result));
    expect(result).toBe(request.events);
  });

  test("Test MessageEvent bye from group", async () => {
    expect.assertions(1);
    const messageEvent: MessageEvent = {
      type: "message",
      timestamp: 0,
      source: { type: "group", groupId: "ok" },
      message: { type: "text", text: "bye", id: "randomly" },
      mode: "active",
      replyToken: "mock",
    };
    const request: WebhookRequestBody = {
      destination: "here",
      events: [messageEvent],
    };
    const result = await server.service("random").create(request);
    console.log(JSON.stringify(result));
    expect(result).toBe(request.events);
  });

  test("Test MessageEvent bye from room", async () => {
    expect.assertions(1);
    const messageEvent: MessageEvent = {
      type: "message",
      timestamp: 0,
      source: { type: "room", roomId: "ok" },
      message: { type: "text", text: "bye", id: "randomly" },
      mode: "active",
      replyToken: "mock",
    };
    const request: WebhookRequestBody = {
      destination: "here",
      events: [messageEvent],
    };
    const result = await server.service("random").create(request);
    console.log(JSON.stringify(result));
    expect(result).toBe(request.events);
  });

  test("Test MessageEvent bye from user room", async () => {
    expect.assertions(1);
    const messageEvent: MessageEvent = {
      type: "message",
      timestamp: 0,
      source: { type: "user", userId: "ok" },
      message: { type: "text", text: "bye", id: "randomly" },
      mode: "active",
      replyToken: "mock",
    };
    const request: WebhookRequestBody = {
      destination: "here",
      events: [messageEvent],
    };
    const result = await server.service("random").create(request);
    console.log(JSON.stringify(result));
    expect(result).toBe(request.events);
  });

  test("Test MessageEvent search only", async () => {
    expect.assertions(1);
    const messageEvent: MessageEvent = {
      type: "message",
      timestamp: 0,
      source: { type: "user", userId: "ok" },
      message: { type: "text", text: "search", id: "randomly" },
      mode: "active",
      replyToken: "mock",
    };
    const request: WebhookRequestBody = {
      destination: "here",
      events: [messageEvent],
    };
    const result = await server.service("random").create(request);
    console.log(JSON.stringify(result));
    expect(result).toBe(request.events);
  });

  test("Test MessageEvent randomly", async () => {
    expect.assertions(1);
    const messageEvent: MessageEvent = {
      type: "message",
      timestamp: 0,
      source: { type: "user", userId: "ok" },
      message: { type: "text", text: "randomly", id: "randomly" },
      mode: "active",
      replyToken: "mock",
    };
    const request: WebhookRequestBody = {
      destination: "here",
      events: [messageEvent],
    };
    const result = await server.service("random").create(request);
    console.log(JSON.stringify(result));
    expect(result).toBe(request.events);
  });

  test("Test UnsupportEvent", async () => {
    expect.assertions(1);
    const accountLinkEvent: AccountLinkEvent = {
      type: "accountLink",
      timestamp: 0,
      source: { type: "group", groupId: "anon" },
      mode: "active",
      replyToken: "mock",
      link: { result: "ok", nonce: "" },
    };
    const request: WebhookRequestBody = {
      destination: "here",
      events: [accountLinkEvent],
    };
    const result = await server.service("random").create(request);
    console.log(JSON.stringify(result));
    expect(result).toBe(request.events);
  });
});
