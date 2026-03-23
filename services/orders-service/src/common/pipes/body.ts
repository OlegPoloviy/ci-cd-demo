// import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
// import { plainToInstance } from 'class-transformer';
// import { validateSync } from 'class-validator';
//
// @Injectable()
// export class BodyValidationPipe implements PipeTransform {
//   transform(value: any, metadata: ArgumentMetadata): any {
//     if (metadata.type !== 'body' && !metadata.metatype) {
//       return value;
//     }
//
//     if (!metadata.metatype || this.isPrimitive(metadata.metatype)) {
//       return value;
//     }
//
//     const object = plainToInstance(metadata.metatype, value);
//     const errors = validateSync(object);
//
//     if (errors.length > 0) {
//       const errorMessage = errors.map((err) =>
//         Object.values(err.constraints || {}).join(','),
//       );
//       throw new Error(`Validation failed with errors: ${errorMessage}`);
//     }
//
//     return object;
//   }
//
//   private isPrimitive(metatype: Function): boolean {
//     const types = [String, Boolean, Number, Array, Object];
//     return types.includes(metatype);
//   }
// }
