import feathers from "@feathersjs/feathers";
import messageEncrypt from "../../src/hooks/messages-encrypt";
import * as argon2 from "argon2";
import AES from "crypto-js/aes";
import Utf8 from "crypto-js/enc-utf8";

describe("Hook test 'message-encrypt'", () => {
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
        return data;
      },
    });
    server.service("random").hooks({
      before: { create: [messageEncrypt()] },
    });
  });
  test("Password should be encrypted correctly", async () => {
    expect.assertions(1);
    const request = {
      text: "Custom test text",
      messagePassword: "berv-password",
    };
    const copyRequest = { ...request };
    const result = await server.service("random").create(copyRequest);
    const resultData = AES.decrypt(
      result.text,
      request.messagePassword,
    ).toString(Utf8);
    expect(resultData).toBe(request.text);
  });

  test("Password should be hashed and correct", async () => {
    expect.assertions(1);
    const request = {
      text: "Custom test text",
      messagePassword: "berv-password",
    };
    const copyRequest = { ...request };
    const result = await server.service("random").create(copyRequest);
    const isCorrect = await argon2.verify(
      result.messagePassword,
      request.messagePassword,
    );
    expect(isCorrect).toBeTruthy();
  });
});
