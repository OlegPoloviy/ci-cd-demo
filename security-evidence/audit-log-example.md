Audit for auth

```
orders-api-1        | [Nest] 1  - 04/18/2026, 7:35:34 PM     LOG [AuditService] {"action":"auth.login","actorId":"f40de908-8d98-4c64-885c-38902d79fb0d","actorRoles":["admin","user"],"actorScopes":[],"targetType":"user","targetId":"f40de908-8d98-4c64-885c-38902d79fb0d","outcome":"success","timestamp":"2026-04-18T19:35:34.109Z","correlationId":"e5190268-0256-4c14-a899-fbfef62115d7","requestId":"e5190268-0256-4c14-a899-fbfef62115d7","ip":"::ffff:172.20.0.1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0"}
```

Failure

```
orders-api-1        | [Nest] 1  - 04/18/2026, 7:49:08 PM     LOG [AuditService] {"action":"auth.login","actorId":null,"actorRoles":[],"actorScopes":[],"targetType":"user","targetId":"f40de908-8d98-4c64-885c-38902d79fb0d","outcome":"failure","reason":"invalid_credentials","metadata":{"email":"ada@admin.dev"},"timestamp":"2026-04-18T19:49:08.743Z","correlationId":"619f499a-c420-42d2-b1ea-d396936ce14a","requestId":"619f499a-c420-42d2-b1ea-d396936ce14a","ip":"::ffff:172.20.0.1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0"}
```

Audit for updating a user role

```
orders-api-1        | [Nest] 1  - 04/18/2026, 7:47:16 PM     LOG [AuditService] {"action":"user.roles.update","actorId":null,"actorRoles":["admin","user"],"actorScopes":[],"targetType":"user","targetId":"fcc96294-06f0-4749-9acf-c75051975a9a","outcome":"success","metadata":{"previousRoles":[],"nextRoles":["admin","user"]},"timestamp":"2026-04-18T19:47:16.532Z","correlationId":"d8a3b59b-9a91-4030-a033-dc92de1018ac","requestId":"d8a3b59b-9a91-4030-a033-dc92de1018ac","ip":"::ffff:172.20.0.1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0"}
```
