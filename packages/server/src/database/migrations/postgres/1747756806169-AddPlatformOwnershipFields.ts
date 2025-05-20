import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPlatformOwnershipFields1747756806169 implements MigrationInterface {
    name = 'AddPlatformOwnershipFields1747756806169'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_f56c36fe42894d57e5c664d229"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e76bae1780b77e56aab1h2asd4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e213b811b01405a42309a6a410"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f56c36fe42894d57e5c664d230"`);
        // Add applicationId as nullable first
        await queryRunner.query(`ALTER TABLE "chat_flow" ADD "applicationId" uuid`);
        // Update existing rows with default application ID
        await queryRunner.query(`UPDATE "chat_flow" SET "applicationId" = '3b702f3b-5749-4bae-a62e-fb967921ab80'`);
        // Add NOT NULL constraint
        await queryRunner.query(`ALTER TABLE "chat_flow" ALTER COLUMN "applicationId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "chat_flow" ADD "userId" uuid`);
        // Add applicationId as nullable first
        await queryRunner.query(`ALTER TABLE "credential" ADD "applicationId" uuid`);
        // Update existing rows with default application ID
        await queryRunner.query(`UPDATE "credential" SET "applicationId" = '3b702f3b-5749-4bae-a62e-fb967921ab80'`);
        // Add NOT NULL constraint
        await queryRunner.query(`ALTER TABLE "credential" ALTER COLUMN "applicationId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "credential" ADD "organizationId" uuid`);
        await queryRunner.query(`ALTER TABLE "credential" ADD "userId" uuid`);
        // Add applicationId as nullable first
        await queryRunner.query(`ALTER TABLE "tool" ADD "applicationId" uuid`);
        // Update existing rows with default application ID
        await queryRunner.query(`UPDATE "tool" SET "applicationId" = '3b702f3b-5749-4bae-a62e-fb967921ab80'`);
        // Add NOT NULL constraint
        await queryRunner.query(`ALTER TABLE "tool" ALTER COLUMN "applicationId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tool" ADD "userId" uuid`);
        // Add applicationId as nullable first
        await queryRunner.query(`ALTER TABLE "variable" ADD "applicationId" uuid`);
        // Update existing rows with default application ID
        await queryRunner.query(`UPDATE "variable" SET "applicationId" = '3b702f3b-5749-4bae-a62e-fb967921ab80'`);
        // Add NOT NULL constraint
        await queryRunner.query(`ALTER TABLE "variable" ALTER COLUMN "applicationId" SET NOT NULL`);
        // Add applicationId as nullable first
        await queryRunner.query(`ALTER TABLE "document_store" ADD "applicationId" uuid`);
        // Update existing rows with default application ID
        await queryRunner.query(`UPDATE "document_store" SET "applicationId" = '3b702f3b-5749-4bae-a62e-fb967921ab80'`);
        // Add NOT NULL constraint
        await queryRunner.query(`ALTER TABLE "document_store" ALTER COLUMN "applicationId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "document_store" ADD "organizationId" uuid`);
        await queryRunner.query(`ALTER TABLE "document_store" ADD "userId" uuid`);
        // Add applicationId as nullable first
        await queryRunner.query(`ALTER TABLE "chat_message_feedback" ADD "applicationId" uuid`);
        // Update existing rows with default application ID
        await queryRunner.query(`UPDATE "chat_message_feedback" SET "applicationId" = '3b702f3b-5749-4bae-a62e-fb967921ab80'`);
        // Add NOT NULL constraint
        await queryRunner.query(`ALTER TABLE "chat_message_feedback" ALTER COLUMN "applicationId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "chat_message_feedback" ADD "organizationId" uuid`);
        await queryRunner.query(`ALTER TABLE "chat_message_feedback" ADD "userId" uuid`);
        // Add applicationId as nullable first
        await queryRunner.query(`ALTER TABLE "upsert_history" ADD "applicationId" uuid`);
        // Update existing rows with default application ID
        await queryRunner.query(`UPDATE "upsert_history" SET "applicationId" = '3b702f3b-5749-4bae-a62e-fb967921ab80'`);
        // Add NOT NULL constraint
        await queryRunner.query(`ALTER TABLE "upsert_history" ALTER COLUMN "applicationId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "upsert_history" ADD "organizationId" uuid`);
        await queryRunner.query(`ALTER TABLE "upsert_history" ADD "userId" uuid`);
        // Add applicationId as nullable first
        await queryRunner.query(`ALTER TABLE "apikey" ADD "applicationId" uuid`);
        // Update existing rows with default application ID
        await queryRunner.query(`UPDATE "apikey" SET "applicationId" = '3b702f3b-5749-4bae-a62e-fb967921ab80'`);
        // Add NOT NULL constraint
        await queryRunner.query(`ALTER TABLE "apikey" ALTER COLUMN "applicationId" SET NOT NULL`);
        // Add other columns (these can remain as is since they're nullable or have defaults)
        await queryRunner.query(`ALTER TABLE "apikey" ADD "organizationId" uuid`);
        await queryRunner.query(`ALTER TABLE "apikey" ADD "userId" uuid`);
        await queryRunner.query(`ALTER TABLE "apikey" ADD "createdDate" TIMESTAMP NOT NULL DEFAULT now()`);
        // Add applicationId as nullable first
        await queryRunner.query(`ALTER TABLE "custom_template" ADD "applicationId" uuid`);
        // Update existing rows with default application ID
        await queryRunner.query(`UPDATE "custom_template" SET "applicationId" = '3b702f3b-5749-4bae-a62e-fb967921ab80'`);
        // Add NOT NULL constraint
        await queryRunner.query(`ALTER TABLE "custom_template" ALTER COLUMN "applicationId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "custom_template" ADD "organizationId" uuid`);
        await queryRunner.query(`ALTER TABLE "custom_template" ADD "userId" uuid`);
        await queryRunner.query(`ALTER TABLE "execution" ALTER COLUMN "stoppedDate" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "chat_message" ADD CONSTRAINT "UQ_617f10ebdc13a5941b01b348232" UNIQUE ("executionId")`);
        await queryRunner.query(`ALTER TABLE "chat_message" ALTER COLUMN "chatType" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "lead" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "lead" ADD "name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lead" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "lead" ADD "email" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lead" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "lead" ADD "phone" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "variable" ALTER COLUMN "value" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "variable" ALTER COLUMN "type" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "variable" ALTER COLUMN "type" SET DEFAULT 'string'`);
        await queryRunner.query(`ALTER TABLE "document_store" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "document_store" ADD "name" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "document_store" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "document_store" ADD "description" text`);
        await queryRunner.query(`ALTER TABLE "document_store" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "document_store" ADD "status" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "document_store_file_chunk" ALTER COLUMN "pageContent" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "chat_message_feedback" ALTER COLUMN "rating" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "upsert_history" DROP COLUMN "result"`);
        await queryRunner.query(`ALTER TABLE "upsert_history" ADD "result" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "upsert_history" DROP COLUMN "flowData"`);
        await queryRunner.query(`ALTER TABLE "upsert_history" ADD "flowData" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "apikey" DROP COLUMN "apiKey"`);
        await queryRunner.query(`ALTER TABLE "apikey" ADD "apiKey" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "apikey" DROP COLUMN "apiSecret"`);
        await queryRunner.query(`ALTER TABLE "apikey" ADD "apiSecret" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "apikey" DROP COLUMN "keyName"`);
        await queryRunner.query(`ALTER TABLE "apikey" ADD "keyName" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "custom_template" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "custom_template" ADD "description" text`);
        await queryRunner.query(`ALTER TABLE "custom_template" DROP COLUMN "badge"`);
        await queryRunner.query(`ALTER TABLE "custom_template" ADD "badge" text`);
        await queryRunner.query(`ALTER TABLE "custom_template" DROP COLUMN "framework"`);
        await queryRunner.query(`ALTER TABLE "custom_template" ADD "framework" text`);
        await queryRunner.query(`ALTER TABLE "custom_template" DROP COLUMN "usecases"`);
        await queryRunner.query(`ALTER TABLE "custom_template" ADD "usecases" text`);
        await queryRunner.query(`ALTER TABLE "custom_template" DROP COLUMN "type"`);
        await queryRunner.query(`ALTER TABLE "custom_template" ADD "type" text`);
        await queryRunner.query(`CREATE INDEX "IDX_ea4c0387fab252f9c5e8be493f" ON "execution" ("agentflowId") `);
        await queryRunner.query(`CREATE INDEX "IDX_4901ef1f2fca418dd717c2dda4" ON "execution" ("sessionId") `);
        await queryRunner.query(`CREATE INDEX "IDX_e28550b1dd9e091193fa3ed22a" ON "document_store_file_chunk" ("docId") `);
        await queryRunner.query(`CREATE INDEX "IDX_c791442eeab0fbf5219b6f78c0" ON "document_store_file_chunk" ("storeId") `);
        await queryRunner.query(`CREATE INDEX "IDX_f56c36fe42894d57e5c664d229" ON "chat_message_feedback" ("chatflowid") `);
        await queryRunner.query(`CREATE INDEX "IDX_4572bbe0437c04b9842d802a0c" ON "upsert_history" ("chatflowid") `);
        await queryRunner.query(`ALTER TABLE "execution" ADD CONSTRAINT "FK_ea4c0387fab252f9c5e8be493fe" FOREIGN KEY ("agentflowId") REFERENCES "chat_flow"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_message" ADD CONSTRAINT "FK_617f10ebdc13a5941b01b348232" FOREIGN KEY ("executionId") REFERENCES "execution"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_message" DROP CONSTRAINT "FK_617f10ebdc13a5941b01b348232"`);
        await queryRunner.query(`ALTER TABLE "execution" DROP CONSTRAINT "FK_ea4c0387fab252f9c5e8be493fe"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4572bbe0437c04b9842d802a0c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f56c36fe42894d57e5c664d229"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c791442eeab0fbf5219b6f78c0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e28550b1dd9e091193fa3ed22a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4901ef1f2fca418dd717c2dda4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ea4c0387fab252f9c5e8be493f"`);
        await queryRunner.query(`ALTER TABLE "custom_template" DROP COLUMN "type"`);
        await queryRunner.query(`ALTER TABLE "custom_template" ADD "type" character varying`);
        await queryRunner.query(`ALTER TABLE "custom_template" DROP COLUMN "usecases"`);
        await queryRunner.query(`ALTER TABLE "custom_template" ADD "usecases" character varying`);
        await queryRunner.query(`ALTER TABLE "custom_template" DROP COLUMN "framework"`);
        await queryRunner.query(`ALTER TABLE "custom_template" ADD "framework" character varying`);
        await queryRunner.query(`ALTER TABLE "custom_template" DROP COLUMN "badge"`);
        await queryRunner.query(`ALTER TABLE "custom_template" ADD "badge" character varying`);
        await queryRunner.query(`ALTER TABLE "custom_template" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "custom_template" ADD "description" character varying`);
        await queryRunner.query(`ALTER TABLE "apikey" DROP COLUMN "keyName"`);
        await queryRunner.query(`ALTER TABLE "apikey" ADD "keyName" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "apikey" DROP COLUMN "apiSecret"`);
        await queryRunner.query(`ALTER TABLE "apikey" ADD "apiSecret" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "apikey" DROP COLUMN "apiKey"`);
        await queryRunner.query(`ALTER TABLE "apikey" ADD "apiKey" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "upsert_history" DROP COLUMN "flowData"`);
        await queryRunner.query(`ALTER TABLE "upsert_history" ADD "flowData" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "upsert_history" DROP COLUMN "result"`);
        await queryRunner.query(`ALTER TABLE "upsert_history" ADD "result" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "chat_message_feedback" ALTER COLUMN "rating" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "document_store_file_chunk" ALTER COLUMN "pageContent" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "document_store" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "document_store" ADD "status" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "document_store" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "document_store" ADD "description" character varying`);
        await queryRunner.query(`ALTER TABLE "document_store" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "document_store" ADD "name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "variable" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "variable" ALTER COLUMN "type" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "variable" ALTER COLUMN "value" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lead" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "lead" ADD "phone" text`);
        await queryRunner.query(`ALTER TABLE "lead" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "lead" ADD "email" text`);
        await queryRunner.query(`ALTER TABLE "lead" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "lead" ADD "name" text`);
        await queryRunner.query(`ALTER TABLE "chat_message" ALTER COLUMN "chatType" SET DEFAULT 'INTERNAL'`);
        await queryRunner.query(`ALTER TABLE "chat_message" DROP CONSTRAINT "UQ_617f10ebdc13a5941b01b348232"`);
        await queryRunner.query(`ALTER TABLE "execution" ALTER COLUMN "stoppedDate" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "custom_template" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "custom_template" DROP COLUMN "organizationId"`);
        // Remove NOT NULL constraint first
        await queryRunner.query(`ALTER TABLE "custom_template" ALTER COLUMN "applicationId" DROP NOT NULL`);
        // Then drop the column
        await queryRunner.query(`ALTER TABLE "custom_template" DROP COLUMN "applicationId"`);
        await queryRunner.query(`ALTER TABLE "apikey" DROP COLUMN "createdDate"`);
        await queryRunner.query(`ALTER TABLE "apikey" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "apikey" DROP COLUMN "organizationId"`);
        // Remove NOT NULL constraint first
        await queryRunner.query(`ALTER TABLE "apikey" ALTER COLUMN "applicationId" DROP NOT NULL`);
        // Then drop the column
        await queryRunner.query(`ALTER TABLE "apikey" DROP COLUMN "applicationId"`);
        await queryRunner.query(`ALTER TABLE "upsert_history" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "upsert_history" DROP COLUMN "organizationId"`);
        // Remove NOT NULL constraint first
        await queryRunner.query(`ALTER TABLE "upsert_history" ALTER COLUMN "applicationId" DROP NOT NULL`);
        // Then drop the column
        await queryRunner.query(`ALTER TABLE "upsert_history" DROP COLUMN "applicationId"`);
        await queryRunner.query(`ALTER TABLE "chat_message_feedback" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "chat_message_feedback" DROP COLUMN "organizationId"`);
        // Remove NOT NULL constraint first
        await queryRunner.query(`ALTER TABLE "chat_message_feedback" ALTER COLUMN "applicationId" DROP NOT NULL`);
        // Then drop the column
        await queryRunner.query(`ALTER TABLE "chat_message_feedback" DROP COLUMN "applicationId"`);
        await queryRunner.query(`ALTER TABLE "document_store" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "document_store" DROP COLUMN "organizationId"`);
        // Remove NOT NULL constraint first
        await queryRunner.query(`ALTER TABLE "document_store" ALTER COLUMN "applicationId" DROP NOT NULL`);
        // Then drop the column
        await queryRunner.query(`ALTER TABLE "document_store" DROP COLUMN "applicationId"`);
        // Remove NOT NULL constraint first
        await queryRunner.query(`ALTER TABLE "variable" ALTER COLUMN "applicationId" DROP NOT NULL`);
        // Then drop the column
        await queryRunner.query(`ALTER TABLE "variable" DROP COLUMN "applicationId"`);
        await queryRunner.query(`ALTER TABLE "tool" DROP COLUMN "userId"`);
        // Remove NOT NULL constraint first
        await queryRunner.query(`ALTER TABLE "tool" ALTER COLUMN "applicationId" DROP NOT NULL`);
        // Then drop the column
        await queryRunner.query(`ALTER TABLE "tool" DROP COLUMN "applicationId"`);
        await queryRunner.query(`ALTER TABLE "credential" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "credential" DROP COLUMN "organizationId"`);
        // Remove NOT NULL constraint first
        await queryRunner.query(`ALTER TABLE "credential" ALTER COLUMN "applicationId" DROP NOT NULL`);
        // Then drop the column
        await queryRunner.query(`ALTER TABLE "credential" DROP COLUMN "applicationId"`);
        await queryRunner.query(`ALTER TABLE "chat_flow" DROP COLUMN "userId"`);
        // Remove NOT NULL constraint first
        await queryRunner.query(`ALTER TABLE "chat_flow" ALTER COLUMN "applicationId" DROP NOT NULL`);
        // Then drop the column
        await queryRunner.query(`ALTER TABLE "chat_flow" DROP COLUMN "applicationId"`);
        await queryRunner.query(`CREATE INDEX "IDX_f56c36fe42894d57e5c664d230" ON "chat_message_feedback" ("chatflowid") `);
        await queryRunner.query(`CREATE INDEX "IDX_e213b811b01405a42309a6a410" ON "document_store_file_chunk" ("storeId") `);
        await queryRunner.query(`CREATE INDEX "IDX_e76bae1780b77e56aab1h2asd4" ON "document_store_file_chunk" ("docId") `);
        await queryRunner.query(`CREATE INDEX "IDX_f56c36fe42894d57e5c664d229" ON "chat_message" ("chatflowid") `);
    }

}
