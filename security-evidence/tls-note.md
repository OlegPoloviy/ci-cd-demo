# Current TLS setup in project

Current local/development deployment does not expose a real public TLS endpoint, so it only uses localhost and Docker Compose for development.

## Do I have HTTP -> HTTPS redirect

No, the current setup does not include HTTP -> HTTPS redirect, because there is no public edge proxy, public domain, or deployed TLS certificate in the local/demo environment.

In the intended production design, HTTP -> HTTPS redirect will be enforced at the edge reverse proxy or ingress layer. The public endpoint will listen on port 80 only to redirect all incoming requests to HTTPS on port 443, while TLS termination will happen at the same edge layer. Application containers behind the proxy will not be directly exposed to the Internet.

## Traffic classification

- Public traffic:
  `client -> orders-api HTTP endpoint` in the current local/demo setup.
  In the intended production design, this traffic will become `client -> edge proxy over HTTPS`.

- Internal traffic:
  `orders-api -> payments-service` over gRPC inside the deployment network.
  `orders-api -> PostgreSQL`, `orders-api -> RabbitMQ`, and `orders-api -> MinIO` are also internal service-to-service connections.

- Trusted only by network placement:
  internal Docker network traffic is currently trusted because services are isolated inside private container networks and are not intended to be publicly reachable.
  This means transport protection for those links currently relies on network boundaries rather than end-to-end TLS.

## Backlog

- Add TLS
- Add edge reverse proxy
- Enable HTTP to HTTPS redirect
