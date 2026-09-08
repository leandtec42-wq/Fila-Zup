-- ============================================================================
-- Zup — Sistema de Filas
-- Script SQL de criação do banco de dados (MySQL 8+ / MariaDB 10.6+)
--
-- Este arquivo corresponde EXATAMENTE ao schema definido em
-- prisma/schema.prisma. Ele foi escrito manualmente porque o ambiente onde
-- este projeto foi construído não tinha acesso a um servidor MySQL real nem
-- à internet para rodar `npx prisma migrate dev` (que geraria este mesmo
-- arquivo automaticamente).
--
-- Você tem duas opções para criar o banco (escolha uma):
--
--   OPÇÃO A (recomendada): deixe o Prisma gerar e aplicar a migration
--     npx prisma migrate dev --name init
--
--   OPÇÃO B: rode este arquivo diretamente no MySQL
--     mysql -u root -p < database/schema.sql
--     (depois, para o Prisma reconhecer o banco como já migrado, rode:
--      npx prisma migrate resolve --applied "0_init"
--      ou simplesmente `npx prisma db pull` seguido de `npx prisma generate`)
--
-- As duas opções resultam exatamente na mesma estrutura de tabelas.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `queue_saas`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `queue_saas`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- users — o cliente que cria e administra eventos (tenant)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`            VARCHAR(191) NOT NULL,
  `name`          VARCHAR(160) NOT NULL,
  `companyName`   VARCHAR(160) NOT NULL,
  `email`         VARCHAR(190) NOT NULL,
  `passwordHash`  VARCHAR(255) NOT NULL,
  `createdAt`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`),
  KEY `users_email_idx` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- events — um evento pertence a um usuário (tenant) e possui uma fila própria
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `events` (
  `id`                          VARCHAR(191) NOT NULL,
  `userId`                      VARCHAR(191) NOT NULL,
  `name`                        VARCHAR(200) NOT NULL,
  `description`                 TEXT NULL,
  `date`                        DATETIME(3) NOT NULL,
  `startTime`                   VARCHAR(5) NOT NULL,
  `endTime`                     VARCHAR(5) NOT NULL,
  `location`                    VARCHAR(255) NULL,
  `maxParticipants`             INT NULL,
  `status`                      ENUM('DRAFT','ACTIVE','PAUSED','CLOSED') NOT NULL DEFAULT 'DRAFT',
  `publicSlug`                  VARCHAR(64) NOT NULL,
  `allowReentryAfterCompletion` BOOLEAN NOT NULL DEFAULT false,
  `lastQueueNumber`             INT NOT NULL DEFAULT 0,
  `createdAt`                   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`                   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `events_publicSlug_key` (`publicSlug`),
  KEY `events_userId_idx` (`userId`),
  KEY `events_publicSlug_idx` (`publicSlug`),
  KEY `events_status_idx` (`status`),

  CONSTRAINT `events_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- queue_entries — um participante dentro da fila de um evento específico
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `queue_entries` (
  `id`               VARCHAR(191) NOT NULL,
  `eventId`          VARCHAR(191) NOT NULL,
  `queueNumber`      INT NOT NULL,
  `name`             VARCHAR(160) NOT NULL,
  `email`            VARCHAR(190) NOT NULL,
  `phone`            VARCHAR(20) NOT NULL COMMENT 'E.164, ex: +5511999999999',
  `status`           ENUM('WAITING','CALLED','IN_SERVICE','COMPLETED','SKIPPED','CANCELLED') NOT NULL DEFAULT 'WAITING',
  `consentWhatsApp`  BOOLEAN NOT NULL DEFAULT true,
  `createdAt`        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `calledAt`         DATETIME(3) NULL,
  `serviceStartedAt` DATETIME(3) NULL,
  `completedAt`      DATETIME(3) NULL,
  `updatedAt`        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `queue_entries_eventId_queueNumber_key` (`eventId`, `queueNumber`),
  KEY `queue_entries_eventId_status_createdAt_idx` (`eventId`, `status`, `createdAt`),
  KEY `queue_entries_eventId_phone_idx` (`eventId`, `phone`),
  KEY `queue_entries_phone_idx` (`phone`),

  CONSTRAINT `queue_entries_eventId_fkey`
    FOREIGN KEY (`eventId`) REFERENCES `events` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- queue_actions — trilha de auditoria de tudo que acontece com uma entrada
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `queue_actions` (
  `id`           VARCHAR(191) NOT NULL,
  `queueEntryId` VARCHAR(191) NOT NULL,
  `eventId`      VARCHAR(191) NOT NULL,
  `action`       VARCHAR(40) NOT NULL COMMENT 'QUEUE_JOINED, QUEUE_CALLED, SERVICE_STARTED, ...',
  `metadata`     TEXT NULL COMMENT 'JSON serializado com detalhes extras',
  `createdAt`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  KEY `queue_actions_eventId_createdAt_idx` (`eventId`, `createdAt`),
  KEY `queue_actions_queueEntryId_idx` (`queueEntryId`),

  CONSTRAINT `queue_actions_queueEntryId_fkey`
    FOREIGN KEY (`queueEntryId`) REFERENCES `queue_entries` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `queue_actions_eventId_fkey`
    FOREIGN KEY (`eventId`) REFERENCES `events` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- whatsapp_messages — histórico de mensagens enviadas via Meta Cloud API
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `whatsapp_messages` (
  `id`                VARCHAR(191) NOT NULL,
  `queueEntryId`      VARCHAR(191) NOT NULL,
  `eventId`           VARCHAR(191) NOT NULL,
  `phone`             VARCHAR(20) NOT NULL,
  `messageType`       ENUM('QUEUE_JOINED','POSITION_UPDATE','CALLED','COMPLETED') NOT NULL,
  `status`            ENUM('PENDING','SENT','FAILED','LOGGED_DEV_MODE') NOT NULL DEFAULT 'PENDING',
  `providerMessageId` VARCHAR(190) NULL,
  `error`             TEXT NULL,
  `payload`           TEXT NULL COMMENT 'JSON enviado à API (sem tokens)',
  `createdAt`         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `sentAt`            DATETIME(3) NULL,

  PRIMARY KEY (`id`),
  KEY `whatsapp_messages_eventId_createdAt_idx` (`eventId`, `createdAt`),
  KEY `whatsapp_messages_queueEntryId_idx` (`queueEntryId`),
  KEY `whatsapp_messages_status_idx` (`status`),

  CONSTRAINT `whatsapp_messages_queueEntryId_fkey`
    FOREIGN KEY (`queueEntryId`) REFERENCES `queue_entries` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `whatsapp_messages_eventId_fkey`
    FOREIGN KEY (`eventId`) REFERENCES `events` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- Fim do script. Depois de rodar este arquivo, popule o banco com dados de
-- demonstração usando:  npm run seed
-- ============================================================================
