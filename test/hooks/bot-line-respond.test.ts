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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
        data: Partial<any> | Partial<any>[],
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        params: feathers.Params,
      ) {
        return {};
      },
    });
    server.service("random").hooks({
      before: { create: [botLineRespond()] },
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      webhookEventId: "xxxx",
      deliveryContext: { isRedelivery: false },
    };
    const request: WebhookRequestBody = {
      destination: "here",
      events: [memberJoinEvent],
    };
    const result = await server.service("random").create(request);
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
      webhookEventId: "anyid-1",
      deliveryContext: { isRedelivery: false },
    };
    const request: WebhookRequestBody = {
      destination: "here",
      events: [joinEvent],
    };
    const result = await server.service("random").create(request);
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
      webhookEventId: "anyid-1",
      deliveryContext: { isRedelivery: false },
    };
    const request: WebhookRequestBody = {
      destination: "here",
      events: [followEvent],
    };
    const result = await server.service("random").create(request);
    expect(result).toBe(request.events);
  });

  test("Test MessageEvent hi", async () => {
    expect.assertions(1);
    const messageEvent: MessageEvent = {
      type: "message",
      timestamp: 0,
      source: { type: "user", userId: "ok" },
      message: {
        type: "text",
        text: "hi",
        id: "randomly",
        quoteToken: "any-quote-token",
      },
      mode: "active",
      replyToken: "mock",
      webhookEventId: "xxxx",
      deliveryContext: { isRedelivery: false },
    };
    const request: WebhookRequestBody = {
      destination: "here",
      events: [messageEvent],
    };
    const result = await server.service("random").create(request);
    expect(result).toBe(request.events);
  });

  test("Test MessageEvent bantuan", async () => {
    expect.assertions(1);
    const messageEvent: MessageEvent = {
      type: "message",
      timestamp: 0,
      source: { type: "group", groupId: "ok" },
      message: {
        type: "text",
        text: "bantuan",
        id: "randomly",
        quoteToken: "any-quote-token",
      },
      mode: "active",
      replyToken: "mock",
      webhookEventId: "xxxx",
      deliveryContext: { isRedelivery: false },
    };
    const request: WebhookRequestBody = {
      destination: "here",
      events: [messageEvent],
    };
    const result = await server.service("random").create(request);
    expect(result).toBe(request.events);
  });

  test("Test MessageEvent bye from group", async () => {
    expect.assertions(1);
    const messageEvent: MessageEvent = {
      type: "message",
      timestamp: 0,
      source: { type: "group", groupId: "ok" },
      message: {
        type: "text",
        text: "bye",
        id: "randomly",
        quoteToken: "any-quote-token",
      },
      mode: "active",
      replyToken: "mock",
      webhookEventId: "xxxx",
      deliveryContext: { isRedelivery: false },
    };
    const request: WebhookRequestBody = {
      destination: "here",
      events: [messageEvent],
    };
    const result = await server.service("random").create(request);
    expect(result).toBe(request.events);
  });

  test("Test MessageEvent bye from room", async () => {
    expect.assertions(1);
    const messageEvent: MessageEvent = {
      type: "message",
      timestamp: 0,
      source: { type: "room", roomId: "ok" },
      message: {
        type: "text",
        text: "bye",
        id: "randomly",
        quoteToken: "any-quote-token",
      },
      mode: "active",
      replyToken: "mock",
      webhookEventId: "xxxx",
      deliveryContext: { isRedelivery: false },
    };
    const request: WebhookRequestBody = {
      destination: "here",
      events: [messageEvent],
    };
    const result = await server.service("random").create(request);
    expect(result).toBe(request.events);
  });

  test("Test MessageEvent bye from user room", async () => {
    expect.assertions(1);
    const messageEvent: MessageEvent = {
      type: "message",
      timestamp: 0,
      source: { type: "user", userId: "ok" },
      message: {
        type: "text",
        text: "bye",
        id: "randomly",
        quoteToken: "any-quote-token",
      },
      mode: "active",
      replyToken: "mock",
      webhookEventId: "xxxx",
      deliveryContext: { isRedelivery: false },
    };
    const request: WebhookRequestBody = {
      destination: "here",
      events: [messageEvent],
    };
    const result = await server.service("random").create(request);
    expect(result).toBe(request.events);
  });

  test("Test MessageEvent search only", async () => {
    expect.assertions(1);
    const messageEvent: MessageEvent = {
      type: "message",
      timestamp: 0,
      source: { type: "user", userId: "ok" },
      message: {
        type: "text",
        text: "search",
        id: "randomly",
        quoteToken: "any-quote-token",
      },
      mode: "active",
      replyToken: "mock",
      webhookEventId: "xxxx",
      deliveryContext: { isRedelivery: false },
    };
    const request: WebhookRequestBody = {
      destination: "here",
      events: [messageEvent],
    };
    const result = await server.service("random").create(request);
    expect(result).toBe(request.events);
  });

  test("Test MessageEvent randomly", async () => {
    expect.assertions(1);
    const messageEvent: MessageEvent = {
      type: "message",
      timestamp: 0,
      source: { type: "user", userId: "ok" },
      message: {
        type: "text",
        text: "randomly",
        id: "randomly",
        quoteToken: "any-quote-token",
      },
      mode: "active",
      replyToken: "mock",
      webhookEventId: "xxxx",
      deliveryContext: { isRedelivery: false },
    };
    const request: WebhookRequestBody = {
      destination: "here",
      events: [messageEvent],
    };
    const result = await server.service("random").create(request);
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
      webhookEventId: "xxxx",
      deliveryContext: { isRedelivery: false },
    };
    const request: WebhookRequestBody = {
      destination: "here",
      events: [accountLinkEvent],
    };
    const result = await server.service("random").create(request);
    expect(result).toBe(request.events);
  });
});
