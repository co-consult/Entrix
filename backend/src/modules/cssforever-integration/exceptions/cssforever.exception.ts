import { HttpException } from '@nestjs/common';

export class CssForeverException extends HttpException {
  constructor(
    public readonly errorCode: string,
    message: string,
    httpStatus = 400,
  ) {
    super({ status: 'KO', errorCode, message }, httpStatus);
    this.name = 'CssForeverException';
  }
}
