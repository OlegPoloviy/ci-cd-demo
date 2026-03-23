import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';

export const CustomHeaders = createParamDecorator(
  (headerName: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const headers = request.headers;

    if (headerName) {
      const value = headers[headerName.toLowerCase()];

      if (value === undefined) {
        throw new BadRequestException(`Header "${headerName}" is missing`);
      }

      return value;
    }

    return headers;
  },
);
