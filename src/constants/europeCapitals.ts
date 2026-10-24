import type { Difficulty } from "../engine/math";
export interface CountryCapital {
  id: string;
  country: string;
  capital: string;
  difficulty: Difficulty;
}
// Périmètre et sources : docs/CAPITALES.md. Difficulté pédagogique éditoriale.
const entries: [string, string, string, Difficulty][] = [
  ["FR", "France", "Paris", "veryEasy"],
  ["DE", "Allemagne", "Berlin", "veryEasy"],
  ["ES", "Espagne", "Madrid", "veryEasy"],
  ["IT", "Italie", "Rome", "veryEasy"],
  ["GB", "Royaume-Uni", "Londres", "veryEasy"],
  ["BE", "Belgique", "Bruxelles", "easy"],
  ["PT", "Portugal", "Lisbonne", "easy"],
  ["CH", "Suisse", "Berne", "easy"],
  ["NL", "Pays-Bas", "Amsterdam", "easy"],
  ["GR", "Grèce", "Athènes", "easy"],
  ["AT", "Autriche", "Vienne", "easy"],
  ["IE", "Irlande", "Dublin", "easy"],
  ["RU", "Russie", "Moscou", "easy"],
  ["SE", "Suède", "Stockholm", "medium"],
  ["NO", "Norvège", "Oslo", "medium"],
  ["DK", "Danemark", "Copenhague", "medium"],
  ["FI", "Finlande", "Helsinki", "medium"],
  ["PL", "Pologne", "Varsovie", "medium"],
  ["CZ", "Tchéquie", "Prague", "medium"],
  ["HU", "Hongrie", "Budapest", "medium"],
  ["RO", "Roumanie", "Bucarest", "medium"],
  ["UA", "Ukraine", "Kyiv", "medium"],
  ["TR", "Turquie", "Ankara", "medium"],
  ["LU", "Luxembourg", "Luxembourg", "easy"],
  ["MC", "Monaco", "Monaco", "easy"],
  ["VA", "Vatican", "Cité du Vatican", "easy"],
  ["AL", "Albanie", "Tirana", "hard"],
  ["AD", "Andorre", "Andorre-la-Vieille", "hard"],
  ["AM", "Arménie", "Erevan", "hard"],
  ["AZ", "Azerbaïdjan", "Bakou", "hard"],
  ["BY", "Biélorussie", "Minsk", "medium"],
  ["BA", "Bosnie-Herzégovine", "Sarajevo", "hard"],
  ["BG", "Bulgarie", "Sofia", "medium"],
  ["HR", "Croatie", "Zagreb", "medium"],
  ["CY", "Chypre", "Nicosie", "hard"],
  ["EE", "Estonie", "Tallinn", "hard"],
  ["GE", "Géorgie", "Tbilissi", "hard"],
  ["IS", "Islande", "Reykjavik", "hard"],
  ["KZ", "Kazakhstan", "Astana", "hard"],
  ["XK", "Kosovo", "Pristina", "hard"],
  ["LV", "Lettonie", "Riga", "hard"],
  ["LI", "Liechtenstein", "Vaduz", "hard"],
  ["LT", "Lituanie", "Vilnius", "hard"],
  ["MK", "Macédoine du Nord", "Skopje", "hard"],
  ["MT", "Malte", "La Valette", "hard"],
  ["MD", "Moldavie", "Chișinău", "hard"],
  ["ME", "Monténégro", "Podgorica", "hard"],
  ["SM", "Saint-Marin", "Saint-Marin", "hard"],
  ["RS", "Serbie", "Belgrade", "medium"],
  ["SK", "Slovaquie", "Bratislava", "hard"],
  ["SI", "Slovénie", "Ljubljana", "hard"],
];
export const EUROPE_CAPITALS: readonly CountryCapital[] = entries.map(
  ([id, country, capital, difficulty]) => ({ id, country, capital, difficulty }),
);
