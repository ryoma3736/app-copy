/**
 * Gardenscapes Clone - Type Definitions
 * 完全再現のための型定義
 */

// ピースの種類
export enum PieceType {
  RED = 'red',
  BLUE = 'blue',
  GREEN = 'green',
  YELLOW = 'yellow',
  PURPLE = 'purple',
  ORANGE = 'orange',
  EMPTY = 'empty',
}

// 特殊ピースの種類
export enum SpecialPieceType {
  NONE = 'none',
  BOMB = 'bomb',           // 4マッチで生成、周囲8マス破壊
  ROCKET_H = 'rocket_h',   // 4マッチ横で生成、横一列破壊
  ROCKET_V = 'rocket_v',   // 4マッチ縦で生成、縦一列破壊
  RAINBOW = 'rainbow',     // 5マッチで生成、同色全破壊
  PAPER_PLANE = 'paper_plane', // L/T字で生成、ランダム破壊
}

// 障害物の種類
export enum ObstacleType {
  NONE = 'none',
  ICE_1 = 'ice_1',         // 氷1層
  ICE_2 = 'ice_2',         // 氷2層
  ICE_3 = 'ice_3',         // 氷3層
  CHAIN = 'chain',         // 鎖
  BOX_1 = 'box_1',         // 木箱1層
  BOX_2 = 'box_2',         // 木箱2層
  BOX_3 = 'box_3',         // 木箱3層
  STONE = 'stone',         // 石
  HONEY = 'honey',         // ハニー（広がる）
  CHOCOLATE = 'chocolate', // チョコレート（増殖）
  CARPET = 'carpet',       // カーペット
}

// 収集アイテムの種類
export enum CollectibleType {
  APPLE = 'apple',
  ORANGE = 'orange',
  LEMON = 'lemon',
  ACORN = 'acorn',
  FLOWER = 'flower',
  GNOME = 'gnome',
}

// ピースの状態
export interface Piece {
  id: string;
  type: PieceType;
  special: SpecialPieceType;
  obstacle: ObstacleType;
  collectible: CollectibleType | null;
  row: number;
  col: number;
  x: number;       // 画面上のX座標
  y: number;       // 画面上のY座標
  targetX: number; // アニメーション目標X
  targetY: number; // アニメーション目標Y
  isMoving: boolean;
  isMatched: boolean;
  isSelected: boolean;
}

// グリッドセルの状態
export interface GridCell {
  row: number;
  col: number;
  piece: Piece | null;
  isPlayable: boolean;  // プレイ可能なセルか
  spawner: boolean;     // 新ピース生成ポイントか
}

// グリッド全体
export interface Grid {
  rows: number;
  cols: number;
  cells: GridCell[][];
  cellSize: number;
  offsetX: number;
  offsetY: number;
}

// レベル目標の種類
export enum GoalType {
  SCORE = 'score',
  COLLECT = 'collect',
  DESTROY_OBSTACLE = 'destroy_obstacle',
  DROP_ITEM = 'drop_item',
}

// レベル目標
export interface Goal {
  type: GoalType;
  target: string;      // 対象（ピースタイプ、障害物タイプなど）
  required: number;    // 必要数
  current: number;     // 現在数
}

// レベル設定
export interface LevelConfig {
  id: number;
  rows: number;
  cols: number;
  moves: number;
  goals: Goal[];
  grid: (string | null)[][]; // 初期グリッド配置
  spawners: [number, number][]; // スポーナー位置
  availablePieces: PieceType[];
  obstacles: { row: number; col: number; type: ObstacleType }[];
  collectibles: { row: number; col: number; type: CollectibleType }[];
}

// ゲーム状態
export enum GameState {
  LOADING = 'loading',
  READY = 'ready',
  PLAYING = 'playing',
  ANIMATING = 'animating',
  CHECKING = 'checking',
  PAUSED = 'paused',
  WIN = 'win',
  LOSE = 'lose',
}

// マッチ結果
export interface Match {
  pieces: Piece[];
  type: 'horizontal' | 'vertical' | 'l_shape' | 't_shape' | 'cross';
  length: number;
  specialGenerated: SpecialPieceType;
}

// スワイプ方向
export enum SwipeDirection {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
}

// ゲームイベント
export interface GameEvent {
  type: string;
  data: unknown;
  timestamp: number;
}

// アニメーション設定
export interface AnimationConfig {
  swapDuration: number;      // ピース交換アニメーション時間(ms)
  fallSpeed: number;         // 落下速度(px/frame)
  matchFadeDuration: number; // マッチ消去アニメーション時間(ms)
  specialEffectDuration: number; // 特殊効果アニメーション時間(ms)
}

// デフォルトアニメーション設定（Gardenscapesの計測値を再現）
export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  swapDuration: 150,
  fallSpeed: 12,
  matchFadeDuration: 200,
  specialEffectDuration: 400,
};

// スコア設定
export interface ScoreConfig {
  matchBase: number;         // 基本マッチスコア
  chainMultiplier: number;   // 連鎖倍率
  specialBonus: Record<SpecialPieceType, number>;
  obstacleBonus: Record<ObstacleType, number>;
}

// デフォルトスコア設定
export const DEFAULT_SCORE_CONFIG: ScoreConfig = {
  matchBase: 60,
  chainMultiplier: 1.5,
  specialBonus: {
    [SpecialPieceType.NONE]: 0,
    [SpecialPieceType.BOMB]: 100,
    [SpecialPieceType.ROCKET_H]: 80,
    [SpecialPieceType.ROCKET_V]: 80,
    [SpecialPieceType.RAINBOW]: 200,
    [SpecialPieceType.PAPER_PLANE]: 120,
  },
  obstacleBonus: {
    [ObstacleType.NONE]: 0,
    [ObstacleType.ICE_1]: 20,
    [ObstacleType.ICE_2]: 40,
    [ObstacleType.ICE_3]: 60,
    [ObstacleType.CHAIN]: 30,
    [ObstacleType.BOX_1]: 50,
    [ObstacleType.BOX_2]: 100,
    [ObstacleType.BOX_3]: 150,
    [ObstacleType.STONE]: 40,
    [ObstacleType.HONEY]: 80,
    [ObstacleType.CHOCOLATE]: 100,
    [ObstacleType.CARPET]: 20,
  },
};

// ブースターの種類
export enum BoosterType {
  HAMMER = 'hammer',           // 1個破壊
  EXTRA_MOVES = 'extra_moves', // +5手
  SHUFFLE = 'shuffle',         // シャッフル
  RAINBOW_BOMB = 'rainbow_bomb', // レインボー爆弾
}

// プレイヤー進行状態
export interface PlayerProgress {
  currentLevel: number;
  stars: number;
  coins: number;
  lives: number;
  boosters: Record<BoosterType, number>;
  gardenProgress: GardenProgress;
}

// 庭の進行状態
export interface GardenProgress {
  currentArea: number;
  unlockedAreas: number[];
  placedObjects: GardenObject[];
  storyProgress: number;
}

// 庭オブジェクト
export interface GardenObject {
  id: string;
  type: string;
  position: { x: number; y: number };
  variant: number;  // 選択されたバリアント
}
