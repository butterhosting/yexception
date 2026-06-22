export class Yexception<D extends Record<string, Internal.Json> = Record<string, Internal.Json>> extends Error {
  public static readonly NAMESPACE = "@Yexception";

  public static initialize(klass: Internal.Class & { NAME: string }) {
    const group = klass.NAME;
    for (const key of Object.keys(klass).filter((key) => key !== ("NAME" satisfies keyof typeof klass))) {
      const problem = `${group}::${key}`;
      const fn = (details: Record<string, Internal.Json> = {}) => new Yexception(problem, details);
      fn.matches = (otherProblem: unknown) => {
        if (typeof otherProblem === "string") {
          return otherProblem === problem;
        }
        if (Yexception.ProblemDetails.isInstance(otherProblem)) {
          return otherProblem.problem === problem;
        }
        return false;
      };
      Object.assign(klass, {
        [key]: fn satisfies Yexception.Fn,
      });
    }
  }

  public static field<T extends Record<string, Internal.Json> | void = void>(): Yexception.Fn<T> {
    return null as unknown as Yexception.Fn<T>; // Temporary value during assignment
  }

  public static isInstance(e: any): e is Yexception;
  public static isInstance<D extends Record<string, Internal.Json>>(e: any, specific: Yexception.Fn<D>): e is Yexception<D>;
  public static isInstance<D extends Record<string, Internal.Json> = Record<string, Internal.Json>>(
    e: any,
    specific?: Yexception.Fn<D>,
  ): boolean {
    const marker = "namespace" satisfies keyof InstanceType<typeof Yexception>;
    const isYexception = typeof e === "object" && marker in e && e[marker] === Yexception.NAMESPACE;
    if (!isYexception) {
      return false;
    }
    if (specific) {
      const { problem } = specific({});
      return problem === (e as Yexception).problem;
    }
    return true;
  }

  public readonly namespace = Yexception.NAMESPACE;

  public constructor(
    public readonly problem: string,
    public readonly details: D,
  ) {
    super(problem);
  }

  public problemDetails(): Yexception.ProblemDetails {
    return {
      problem: this.problem,
      details: this.details,
    };
  }
}

export namespace Yexception {
  export type Fn<T extends Record<string, Internal.Json> | void = void> = T extends void
    ? Internal.WithMatcher<(details?: Record<string, Internal.Json>) => Yexception>
    : Internal.WithMatcher<(details: T) => Yexception>;

  export type ProblemDetails = {
    problem: string;
    details?: Record<string, any>;
  };

  export namespace ProblemDetails {
    export function isInstance(value: any): value is ProblemDetails {
      return typeof value?.problem === "string";
    }
  }
}

namespace Internal {
  export type WithMatcher<T> = T & { matches(otherProblem: unknown): boolean };

  export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

  export type Class<T = any> = Function & {
    new (...args: any[]): T;
  };
}
