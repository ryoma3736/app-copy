/**
 * Gardenscapes Clone - Level Configurations
 * サンプルレベル設定
 */

import {
  LevelConfig,
  PieceType,
  GoalType,
  ObstacleType,
} from '../types';

/**
 * レベル1: チュートリアル
 */
export const LEVEL_1: LevelConfig = {
  id: 1,
  rows: 8,
  cols: 8,
  moves: 25,
  goals: [
    {
      type: GoalType.SCORE,
      target: 'score',
      required: 1000,
      current: 0,
    },
  ],
  grid: [
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
  ],
  spawners: [
    [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7],
  ],
  availablePieces: [
    PieceType.RED,
    PieceType.BLUE,
    PieceType.GREEN,
    PieceType.YELLOW,
    PieceType.PURPLE,
  ],
  obstacles: [],
  collectibles: [],
};

/**
 * レベル2: 収集目標
 */
export const LEVEL_2: LevelConfig = {
  id: 2,
  rows: 8,
  cols: 8,
  moves: 20,
  goals: [
    {
      type: GoalType.COLLECT,
      target: PieceType.RED,
      required: 30,
      current: 0,
    },
    {
      type: GoalType.COLLECT,
      target: PieceType.BLUE,
      required: 30,
      current: 0,
    },
  ],
  grid: [
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
  ],
  spawners: [
    [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7],
  ],
  availablePieces: [
    PieceType.RED,
    PieceType.BLUE,
    PieceType.GREEN,
    PieceType.YELLOW,
  ],
  obstacles: [],
  collectibles: [],
};

/**
 * レベル3: 氷障害物
 */
export const LEVEL_3: LevelConfig = {
  id: 3,
  rows: 8,
  cols: 8,
  moves: 30,
  goals: [
    {
      type: GoalType.DESTROY_OBSTACLE,
      target: ObstacleType.ICE_1,
      required: 20,
      current: 0,
    },
  ],
  grid: [
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
  ],
  spawners: [
    [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7],
  ],
  availablePieces: [
    PieceType.RED,
    PieceType.BLUE,
    PieceType.GREEN,
    PieceType.YELLOW,
    PieceType.PURPLE,
  ],
  obstacles: [
    { row: 3, col: 2, type: ObstacleType.ICE_1 },
    { row: 3, col: 3, type: ObstacleType.ICE_1 },
    { row: 3, col: 4, type: ObstacleType.ICE_1 },
    { row: 3, col: 5, type: ObstacleType.ICE_1 },
    { row: 4, col: 2, type: ObstacleType.ICE_1 },
    { row: 4, col: 3, type: ObstacleType.ICE_1 },
    { row: 4, col: 4, type: ObstacleType.ICE_1 },
    { row: 4, col: 5, type: ObstacleType.ICE_1 },
    { row: 5, col: 2, type: ObstacleType.ICE_1 },
    { row: 5, col: 3, type: ObstacleType.ICE_1 },
    { row: 5, col: 4, type: ObstacleType.ICE_1 },
    { row: 5, col: 5, type: ObstacleType.ICE_1 },
    { row: 6, col: 2, type: ObstacleType.ICE_1 },
    { row: 6, col: 3, type: ObstacleType.ICE_1 },
    { row: 6, col: 4, type: ObstacleType.ICE_1 },
    { row: 6, col: 5, type: ObstacleType.ICE_1 },
    { row: 7, col: 2, type: ObstacleType.ICE_1 },
    { row: 7, col: 3, type: ObstacleType.ICE_1 },
    { row: 7, col: 4, type: ObstacleType.ICE_1 },
    { row: 7, col: 5, type: ObstacleType.ICE_1 },
  ],
  collectibles: [],
};

/**
 * レベル4: 変形グリッド
 */
export const LEVEL_4: LevelConfig = {
  id: 4,
  rows: 9,
  cols: 9,
  moves: 35,
  goals: [
    {
      type: GoalType.SCORE,
      target: 'score',
      required: 5000,
      current: 0,
    },
    {
      type: GoalType.COLLECT,
      target: PieceType.GREEN,
      required: 50,
      current: 0,
    },
  ],
  grid: [
    [null, null, 'x', 'x', 'x', 'x', 'x', null, null],
    [null, 'x', 'x', 'x', 'x', 'x', 'x', 'x', null],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    [null, 'x', 'x', 'x', 'x', 'x', 'x', 'x', null],
    [null, null, 'x', 'x', 'x', 'x', 'x', null, null],
  ],
  spawners: [
    [0, 2], [0, 3], [0, 4], [0, 5], [0, 6],
    [1, 1], [1, 7],
    [2, 0], [2, 8],
  ],
  availablePieces: [
    PieceType.RED,
    PieceType.BLUE,
    PieceType.GREEN,
    PieceType.YELLOW,
    PieceType.PURPLE,
    PieceType.ORANGE,
  ],
  obstacles: [],
  collectibles: [],
};

/**
 * レベル5: ハードモード
 */
export const LEVEL_5: LevelConfig = {
  id: 5,
  rows: 9,
  cols: 9,
  moves: 40,
  goals: [
    {
      type: GoalType.COLLECT,
      target: PieceType.RED,
      required: 100,
      current: 0,
    },
    {
      type: GoalType.DESTROY_OBSTACLE,
      target: ObstacleType.BOX_1,
      required: 15,
      current: 0,
    },
  ],
  grid: [
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
  ],
  spawners: [
    [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8],
  ],
  availablePieces: [
    PieceType.RED,
    PieceType.BLUE,
    PieceType.GREEN,
    PieceType.YELLOW,
    PieceType.PURPLE,
    PieceType.ORANGE,
  ],
  obstacles: [
    { row: 4, col: 0, type: ObstacleType.BOX_1 },
    { row: 4, col: 1, type: ObstacleType.BOX_1 },
    { row: 4, col: 2, type: ObstacleType.BOX_1 },
    { row: 4, col: 3, type: ObstacleType.BOX_1 },
    { row: 4, col: 4, type: ObstacleType.BOX_2 },
    { row: 4, col: 5, type: ObstacleType.BOX_1 },
    { row: 4, col: 6, type: ObstacleType.BOX_1 },
    { row: 4, col: 7, type: ObstacleType.BOX_1 },
    { row: 4, col: 8, type: ObstacleType.BOX_1 },
    { row: 5, col: 4, type: ObstacleType.ICE_2 },
    { row: 6, col: 3, type: ObstacleType.CHAIN },
    { row: 6, col: 5, type: ObstacleType.CHAIN },
    { row: 7, col: 4, type: ObstacleType.BOX_3 },
    { row: 8, col: 3, type: ObstacleType.BOX_1 },
    { row: 8, col: 5, type: ObstacleType.BOX_1 },
  ],
  collectibles: [],
};

/**
 * 全レベル配列
 */
export const ALL_LEVELS: LevelConfig[] = [
  LEVEL_1,
  LEVEL_2,
  LEVEL_3,
  LEVEL_4,
  LEVEL_5,
];

/**
 * レベル取得関数
 */
export function getLevel(id: number): LevelConfig | null {
  return ALL_LEVELS.find((level) => level.id === id) || null;
}
