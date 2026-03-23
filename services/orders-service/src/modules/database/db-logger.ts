import type { Logger, QueryRunner } from 'typeorm';
import { requestContext } from 'src/common/request-context';

export class TypeOrmRequestContextLogger implements Logger {
  logQuery(
    _query: string,
    _parameters?: unknown[],
    _queryRunner?: QueryRunner,
  ) {
    const store = requestContext.getStore();
    if (store) {
      store.queryCount += 1;
    }
  }

  logQueryError(
    _error: string | Error,
    _query: string,
    _parameters?: unknown[],
    _queryRunner?: QueryRunner,
  ) {}

  logQuerySlow(
    _time: number,
    _query: string,
    _parameters?: unknown[],
    _queryRunner?: QueryRunner,
  ) {}

  logSchemaBuild(_message: string, _queryRunner?: QueryRunner) {}

  logMigration(_message: string, _queryRunner?: QueryRunner) {}

  log(
    _level: 'log' | 'info' | 'warn',
    _message: unknown,
    _queryRunner?: QueryRunner,
  ) {}
}
