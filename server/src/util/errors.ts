export class NotFoundError extends Error {
  status: number;

  constructor(msg: string) {
    super(msg);
    this.name = this.constructor.name;
    this.status = 404;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends Error {
  status: number;
  constructor(msg: string) {
    super(msg);
    this.name = this.constructor.name;
    this.status = 400;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class InternalError extends Error {
  status: number;
  constructor(msg: string) {
    super(msg);
    this.name = this.constructor.name;
    this.status = 500;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class GenericError extends Error {
  status: number;
  constructor(msg: string, status = 500) {
    super(msg);
    this.name = this.constructor.name;
    this.status = status;

    Error.captureStackTrace(this, this.constructor);
  }
}
