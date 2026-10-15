-- CreateTable
CREATE TABLE "SystemState" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "killSwitch" BOOLEAN NOT NULL DEFAULT false,
    "fitness" REAL NOT NULL DEFAULT 32,
    "attackerCost" REAL NOT NULL DEFAULT 48,
    "businessLoss" REAL NOT NULL DEFAULT 10,
    "physicalRisk" REAL NOT NULL DEFAULT 1.5,
    "businessBudget" REAL NOT NULL DEFAULT 24,
    "physicalBudget" REAL NOT NULL DEFAULT 5,
    "falsePositiveBudget" REAL NOT NULL DEFAULT 18,
    "tick" INTEGER NOT NULL DEFAULT 0,
    "catalogSize" INTEGER NOT NULL DEFAULT 15,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "narrative" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "SensorReading" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "metrics" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SensorReading_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HoldoutCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleSlug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "desired" TEXT NOT NULL,
    "behavior" TEXT NOT NULL,
    "frozen" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Antibody" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleSlug" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "actuator" TEXT NOT NULL,
    "params" TEXT NOT NULL,
    "fitness" REAL NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ModuleState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "osRole" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "canAuto" TEXT NOT NULL,
    "mustAsk" TEXT NOT NULL,
    "observation" TEXT NOT NULL DEFAULT '{}',
    "inference" TEXT NOT NULL DEFAULT '{}',
    "proposal" TEXT NOT NULL DEFAULT '{}',
    "evaluation" TEXT NOT NULL DEFAULT '{}',
    "domainState" TEXT NOT NULL DEFAULT '{}',
    "previousDomain" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL,
    "gateReason" TEXT NOT NULL DEFAULT '',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ModuleState_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor" TEXT NOT NULL,
    "moduleSlug" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "detail" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "GovernanceProposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "merged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
