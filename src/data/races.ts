import { CONTENT } from '../content';

export const RACES = CONTENT.races;

export const RACE_BY_ID = new Map(RACES.map((race) => [race.id, race]));
