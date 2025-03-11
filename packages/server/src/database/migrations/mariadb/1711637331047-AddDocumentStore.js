"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddDocumentStore1711637331047 = void 0;
class AddDocumentStore1711637331047 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`document_store\` (
                \`id\` varchar(36) NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`description\` varchar(255),
                \`loaders\` text,
                \`whereUsed\` text,
                \`status\` varchar(20) NOT NULL,
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`document_store_file_chunk\` (
                \`id\` varchar(36) NOT NULL,
                \`docId\` varchar(36) NOT NULL,
                \`storeId\` varchar(36) NOT NULL,
                \`chunkNo\` INT NOT NULL,
                \`pageContent\` text,
                \`metadata\` text,
                PRIMARY KEY (\`id\`),
                KEY \`IDX_e76bae1780b77e56aab1h2asd4\` (\`docId\`),
                KEY \`IDX_e213b811b01405a42309a6a410\` (\`storeId\`)
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE document_store`);
        await queryRunner.query(`DROP TABLE document_store_file_chunk`);
    }
}
exports.AddDocumentStore1711637331047 = AddDocumentStore1711637331047;
//# sourceMappingURL=1711637331047-AddDocumentStore.js.map