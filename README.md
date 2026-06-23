# Yexception: Simple and useful exception library

This is a lightweight and simple library for creating custom exception classes.

## Installation

```
npm install yexception
```

## Usage

```ts
//
// 1 - Create an error class
//
class UserError {
  public static readonly NAME = "UserError";

  public static readonly not_found = Yexception.field<{ id: number }>();
  public static readonly email_already_taken = Yexception.field<{ email: string }>();
  public static readonly too_many_login_requests = Yexception.field();

  static {
    Yexception.initialize(this);
  }
}

//
// 2 - Throw errors
//
throw UserError.not_found({ id: 123 });
throw UserError.email_already_taken({ email: "test@example.com" });
throw UserError.too_many_login_requests();

//
// 3 - Check instances
//
try {
  throw UserError.not_found({ id: 123 });
} catch (e: unknown) {
  //
  // 3a - Generic check (`details` shape unknown)
  //
  if (Yexception.isInstance(e)) {
    console.log(e.problem); // "UserError::not_found"
  }
  //
  // 3b - Specific check (`details` shape IS known)
  //
  if (Yexception.isInstance(e, UserError.not_found)) {
    console.log(e.details.id); // 123
  }
}
```
