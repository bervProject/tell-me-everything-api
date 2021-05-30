import feathers from "@feathersjs/feathers";
import { JSONParseError, SignatureValidationFailed } from "@line/bot-sdk";
import botErrorHandling from "../../src/hooks/bot-error-handling";

describe("Hook test 'bot-error-handling ", () => {
  let server: feathers.Application<any>;
  beforeAll(() => {
    server = feathers();
    server.use("random", {
      async create(
        data: Partial<any> | Partial<any>[],
        params: feathers.Params,
      ) {
        if (Array.isArray(data)) {
          return {};
        }
        if (data.isSignatureError) {
          throw new SignatureValidationFailed("Dummy Error", "Something Error");
        } else if (data.isJsonParseError) {
          throw new JSONParseError("Json Error", "Can't read the json");
        }
        return {};
      },
    });
    server.service("random").hooks({
      error: { create: [botErrorHandling()] },
    });
  });
  test("Test 'SignatureValidationFailed'", async () => {
    expect.assertions(1);
    const result = await server.service("random").create({
      isSignatureError: true,
    });
    console.log(JSON.stringify(result));
    expect(result).toBe("Something Error");
  });
  test("Test 'JSONParseError'", async () => {
    expect.assertions(1);
    const result = await server.service("random").create({
      isJsonParseError: true,
    });
    console.log(JSON.stringify(result));
    expect(result).toBe("Can't read the json");
  });
});
