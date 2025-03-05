import { uniqueNamesGenerator, Config, adjectives, colors, animals, starWars } from 'unique-names-generator'

const config: Config = {
    dictionaries: [adjectives, colors, animals, starWars],
    separator: ' ',
    style: 'capital'
}

export const createRandomName = uniqueNamesGenerator(
    {
        dictionaries: [adjectives, colors, animals, starWars],
        separator: ' ',
        length: 4,
        style: 'capital'
    }
)
