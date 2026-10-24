import arrowYellow from "./assets/arrow_yellow.png";
import coneStraight from "./assets/cone_straight.png";
import tentBlue from "./assets/tent_blue.png";
import tentRed from "./assets/tent_red.png";
import tiresRed from "./assets/tires_red.png";
import tiresWhite from "./assets/tires_white.png";
import treeLarge from "./assets/tree_large.png";
import treeSmall from "./assets/tree_small.png";
import tribuneFull from "./assets/tribune_full.png";
/**
 * Décorations du pack « Racing Pack » de Kenney (kenney.nl), licence CC0.
 * Chargées via le loader Phaser (preload) puis peintes dans la texture du circuit.
 */
export const SCENERY_ASSETS = {
  "asset-arrow": arrowYellow,
  "asset-cone": coneStraight,
  "asset-tent-blue": tentBlue,
  "asset-tent-red": tentRed,
  "asset-tires-red": tiresRed,
  "asset-tires-white": tiresWhite,
  "asset-tree-large": treeLarge,
  "asset-tree-small": treeSmall,
  "asset-tribune": tribuneFull,
} as const;
