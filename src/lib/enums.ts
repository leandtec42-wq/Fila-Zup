// No MySQL esses valores eram enums nativos do Prisma. O SQLite não suporta
// enum, então as colunas viraram String no schema e esses tipos substituem
// os enums gerados pelo @prisma/client nos lugares que precisam do tipo.

export type EventStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'CLOSED';

export type QueueStatus = 'WAITING' | 'CALLED' | 'IN_SERVICE' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED';

export type WhatsAppMessageType = 'QUEUE_JOINED' | 'POSITION_UPDATE' | 'CALLED' | 'COMPLETED';

export type WhatsAppMessageStatus = 'PENDING' | 'SENT' | 'FAILED' | 'LOGGED_DEV_MODE';
