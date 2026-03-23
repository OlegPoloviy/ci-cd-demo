import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CustomBody = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();

    //@ts-expect-error
    return data ? req.body?.[data] : req.body;
  },
);
