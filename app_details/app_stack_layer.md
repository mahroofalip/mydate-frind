Layer	Stack
API Framework	NestJS
Real-Time Engine	WebSocket (via @WebSocketGateway + Socket.IO)
Database	PostgreSQL (message log, read/delivered states)
ORM	Prisma
File Upload	AWS S3 or Firebase Storage
Caching	Redis (user presence, rooms, last activity)
Queuing (optional)	BullMQ (message retry/delivery)