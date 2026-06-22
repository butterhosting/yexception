export class Yexception<D extends Record<string, Internal.Json> = Record<string, Internal.Json>> extends Error {
  public static readonly NAMESPACE = "@Yexception";

  public static initializeFields(klass: Internal.Class & { Name: string }) {
    const group = klass.Name;
    for (const key of Object.keys(klass).filter((key) => key !== ("Name" satisfies keyof typeof klass))) {
      const problem = `${group}::${key}`;
      const YexceptionFn = (details?: Record<string, Internal.Json>) => new Yexception(problem, details);
      YexceptionFn.matches = (otherProblem: unknown) => {
        if (typeof otherProblem === "string") {
          return otherProblem === problem;
        }
        if (Yexception.ProblemDetails.isInstance(otherProblem)) {
          return otherProblem.problem === problem;
        }
        return false;
      };
      Object.assign(klass, {
        [key]: YexceptionFn satisfies Internal.Fn,
      });
    }
  }

  public readonly namespace = Yexception.NAMESPACE;

  public constructor(
    public readonly problem: string,
    public readonly details?: D,
  ) {
    super(problem);
  }

  public json(): Yexception.ProblemDetails {
    return {
      problem: this.problem,
      details: this.details,
    };
  }
}

export namespace Yexception {
  export type ProblemDetails = {
    problem: string;
    details?: Record<string, any>;
  };

  export namespace ProblemDetails {
    export function isInstance(value: any): value is ProblemDetails {
      return typeof value?.problem === "string";
    }
  }

  export function isInstance<D extends Record<string, Internal.Json>>(e: any, specific: Internal.Fn<D>): e is Yexception<D>;
  export function isInstance(e: any): e is Yexception;
  export function isInstance<D extends Record<string, Internal.Json> = Record<string, Internal.Json>>(
    e: any,
    specific?: Internal.Fn<D>,
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
}

namespace Internal {
  type WithMatcher<T> = T & { matches(otherProblem: unknown): boolean };
  export type Fn<T extends Record<string, Json> | void = void> = T extends void
    ? WithMatcher<(details?: Record<string, Json>) => Yexception>
    : WithMatcher<(details: T) => Yexception>;

  export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

  export type Class<T = any> = Function & {
    new (...args: any[]): T;
  };
}
