import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1775704705075 implements MigrationInterface {
  name = 'Init1775704705075';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clerkUserId" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "name" character varying(100), "stripeCustomerId" character varying(255), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_2530170f5916a86260a173b08ae" UNIQUE ("clerkUserId"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "facebook_accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "facebookUserId" character varying(255) NOT NULL, "pageId" character varying(255) NOT NULL, "pageName" character varying(255) NOT NULL, "accessToken" text NOT NULL, "tokenExpiresAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_cbb18301bf0fd763db534dee458" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."posts_status_enum" AS ENUM('draft', 'scheduled', 'published', 'failed')`
    );
    await queryRunner.query(
      `CREATE TABLE "posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "facebookAccountId" uuid, "title" character varying(255), "content" text NOT NULL, "mediaUrl" character varying(2048), "status" "public"."posts_status_enum" NOT NULL DEFAULT 'draft', "scheduledAt" TIMESTAMP WITH TIME ZONE, "publishedAt" TIMESTAMP WITH TIME ZONE, "facebookPostId" character varying(255), "lastError" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid, "action" character varying(150) NOT NULL, "entityType" character varying(150) NOT NULL, "entityId" character varying(255), "metadata" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "post_metrics" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "postId" uuid NOT NULL, "likes" integer NOT NULL DEFAULT '0', "comments" integer NOT NULL DEFAULT '0', "reach" integer NOT NULL DEFAULT '0', "engagement" integer NOT NULL DEFAULT '0', "fetchedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_88a44d533eadf1971700d7a6fd3" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(20) NOT NULL, "name" character varying(50) NOT NULL, "description" text NOT NULL, "monthlyPrice" integer NOT NULL DEFAULT '0', "postLimit" integer NOT NULL DEFAULT '10', "scheduledLimit" integer NOT NULL DEFAULT '3', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_95f7ef3fc4c31a3545b4d825dd4" UNIQUE ("code"), CONSTRAINT "PK_3720521a81c7c24fe9b7202ba61" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('inactive', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete')`
    );
    await queryRunner.query(
      `CREATE TABLE "subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "planId" uuid NOT NULL, "stripeSubscriptionId" character varying(255), "stripeCustomerId" character varying(255), "status" "public"."subscriptions_status_enum" NOT NULL DEFAULT 'inactive', "currentPeriodEnd" TIMESTAMP WITH TIME ZONE DEFAULT now(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_2b708d303a3196a61cc88d08931" UNIQUE ("stripeSubscriptionId"), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
    await queryRunner.query(`DROP TABLE "plans"`);
    await queryRunner.query(`DROP TABLE "post_metrics"`);
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TABLE "posts"`);
    await queryRunner.query(`DROP TYPE "public"."posts_status_enum"`);
    await queryRunner.query(`DROP TABLE "facebook_accounts"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
