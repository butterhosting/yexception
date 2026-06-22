import { Yexception } from "./Yexception";

class UserError {
  public static readonly NAME = "UserError";

  public static readonly not_found = Yexception.field<{ id: number }>();
  public static readonly email_already_taken = Yexception.field<{ email: string }>();
  public static readonly too_many_login_requests = Yexception.field();

  static {
    Yexception.initialize(this);
  }
}

class GameError {
  public static readonly NAME = "GameError";

  public static readonly not_found = Yexception.field<{ id: number }>();
  public static readonly cheating_detected = Yexception.field();

  static {
    Yexception.initialize(this);
  }
}

describe(Yexception.name, () => {
  const nameProperty = "NAME" satisfies keyof Parameters<typeof Yexception.initialize>[0];

  try {
    throw UserError.not_found({ id: 123 });
  } catch (e: unknown) {
    if (Yexception.isInstance(e)) {
      console.log(e.problem); // "UserError::not_found"
    }
    if (Yexception.isInstance(e, UserError.not_found)) {
      console.log(e.problem); // "UserError::not_found"
      console.log(e.details.id); // 123
    }
  }

  describe("field initialization", () => {
    it.each([UserError, GameError])(`initializes the fields of %s`, (klass) => {
      // given
      const fields = Object.keys(klass).filter((key) => key !== nameProperty);
      // when
      expect(fields.length).toBeGreaterThan(0);
      fields.forEach((field) => {
        const exceptionFn = (klass as any)[field] as Yexception.Fn;
        expect(exceptionFn).toBeDefined();
        const exception = exceptionFn();
        // then
        expect(exception).toEqual(
          expect.objectContaining({
            problem: `${klass.NAME}::${field}`,
          }),
        );
      });
    });
  });

  describe("fields and methods", () => {
    const testCases: Array<{ error: Yexception; problemDetails: Yexception.ProblemDetails }> = [
      {
        error: UserError.not_found({ id: 12345 }),
        problemDetails: {
          problem: "UserError::not_found",
          details: { id: 12345 },
        },
      },
      {
        error: UserError.email_already_taken({ email: "test@example.com" }),
        problemDetails: {
          problem: "UserError::email_already_taken",
          details: { email: "test@example.com" },
        },
      },
      {
        error: UserError.too_many_login_requests(),
        problemDetails: {
          problem: "UserError::too_many_login_requests",
          details: {},
        },
      },
      {
        error: GameError.not_found({ id: 999 }),
        problemDetails: {
          problem: "GameError::not_found",
          details: { id: 999 },
        },
      },
      {
        error: GameError.cheating_detected(),
        problemDetails: {
          problem: "GameError::cheating_detected",
          details: {},
        },
      },
    ];
    for (const { error, problemDetails } of testCases) {
      it(`exposes the right fields and methods for ${error.problem}`, () => {
        expect(error.message).toEqual(problemDetails.problem);
        expect(error.problem).toEqual(problemDetails.problem);
        expect(error.problemDetails()).toEqual(problemDetails);
        expect(error.namespace).toEqual("@Yexception");
      });
    }
  });

  describe("matching logic", () => {
    const testCases: Array<{ error: Yexception; shouldMatch: Yexception.Fn<any>; shouldNotMatch: Array<Yexception.Fn<any>> }> = [
      {
        error: UserError.not_found({ id: 123 }),
        shouldMatch: UserError.not_found,
        shouldNotMatch: [UserError.email_already_taken, GameError.not_found],
      },
      {
        error: UserError.too_many_login_requests(),
        shouldMatch: UserError.too_many_login_requests,
        shouldNotMatch: [UserError.email_already_taken, GameError.not_found],
      },
    ];

    for (const { error, shouldMatch, shouldNotMatch } of testCases) {
      it(`correctly applies matching logic for ${error.problem}`, () => {
        expect(shouldMatch.matches(error)).toEqual(true);
        shouldNotMatch.forEach((snm) => {
          expect(snm.matches(error)).toEqual(false);
        });
      });
    }
  });

  describe("instance detection", () => {
    it("correctly narrows down a generic error", () => {
      // given
      const error: unknown = GameError.cheating_detected();

      // when
      if (!Yexception.isInstance(error)) {
        fail("impossible");
      }

      // then
      error satisfies Yexception.ProblemDetails;
    });

    it("refuses to narrow down an invalid generic error", () => {
      const error = new Error("incompatible");
      expect(Yexception.isInstance(error)).toEqual(false);
    });

    it("correctly narrows down a specific error", () => {
      // given
      const error: unknown = GameError.not_found({ id: 777 });

      // when
      if (!Yexception.isInstance(error, GameError.not_found)) {
        fail("impossible");
      }

      // then
      error.details.id satisfies number;
      expect(error.details.id).toEqual(777);
    });

    it("refuses to narrow down an invalid specific error", () => {
      const error = GameError.not_found({ id: 777 });
      expect(Yexception.isInstance(error, GameError.cheating_detected)).toEqual(false);
    });
  });
});
