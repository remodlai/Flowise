"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRandomName = void 0;
const unique_names_generator_1 = require("unique-names-generator");
const config = {
    dictionaries: [unique_names_generator_1.adjectives, unique_names_generator_1.colors, unique_names_generator_1.animals, unique_names_generator_1.starWars],
    separator: ' ',
    style: 'capital'
};
exports.createRandomName = (0, unique_names_generator_1.uniqueNamesGenerator)({
    dictionaries: [unique_names_generator_1.adjectives, unique_names_generator_1.colors, unique_names_generator_1.animals, unique_names_generator_1.starWars],
    separator: ' ',
    length: 4,
    style: 'capital'
});
//# sourceMappingURL=randomNameGenerator.js.map