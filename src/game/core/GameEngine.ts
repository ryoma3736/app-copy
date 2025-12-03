/**
 * Gardenscapes Clone - Game Engine
 * メインゲームエンジン
 */

import {
  GameState,
  LevelConfig,
  PieceType,
  SpecialPieceType,
  Match,
  Goal,
  GoalType,
  SwipeDirection,
  DEFAULT_SCORE_CONFIG,
  DEFAULT_ANIMATION_CONFIG,
  BoosterType,
} from '../types';
import { GridManager } from './grid/Grid';
import { MatchDetector } from './matching/MatchDetector';

/**
 * ゲームエンジンクラス
 */
export class GameEngine {
  private gridManager: GridManager;
  private matchDetector: MatchDetector;
  private state: GameState = GameState.LOADING;
  private levelConfig: LevelConfig;
  private score: number = 0;
  private movesRemaining: number = 0;
  private goals: Goal[] = [];
  private chainCount: number = 0;
  private selectedPiece: { row: number; col: number } | null = null;
  private eventListeners: Map<string, Array<(data: unknown) => void>> =
    new Map();

  constructor(levelConfig: LevelConfig) {
    this.levelConfig = levelConfig;
    this.gridManager = new GridManager(levelConfig);
    this.matchDetector = new MatchDetector(this.gridManager);
    this.movesRemaining = levelConfig.moves;
    this.goals = levelConfig.goals.map((g) => ({ ...g, current: 0 }));
  }

  /**
   * ゲームを初期化
   */
  initialize(): void {
    this.state = GameState.LOADING;
    this.gridManager.initializeGrid();
    this.score = 0;
    this.movesRemaining = this.levelConfig.moves;
    this.chainCount = 0;

    // 初期マッチを解消
    this.resolveInitialMatches();

    this.state = GameState.READY;
    this.emit('initialized', { level: this.levelConfig.id });
  }

  /**
   * 初期配置のマッチを解消
   */
  private resolveInitialMatches(): void {
    let hasMatches = true;
    let attempts = 0;
    const maxAttempts = 100;

    while (hasMatches && attempts < maxAttempts) {
      const matches = this.matchDetector.findAllMatches();
      if (matches.length === 0) {
        hasMatches = false;
      } else {
        // マッチしたピースをランダムに置き換え
        for (const match of matches) {
          for (const piece of match.pieces) {
            const validTypes = this.levelConfig.availablePieces.filter(
              (t) => t !== piece.type
            );
            piece.type =
              validTypes[Math.floor(Math.random() * validTypes.length)];
          }
        }
        attempts++;
      }
    }
  }

  /**
   * ゲームを開始
   */
  start(): void {
    if (this.state !== GameState.READY) return;
    this.state = GameState.PLAYING;
    this.emit('started', {});
  }

  /**
   * ピースをタップ
   */
  selectPiece(row: number, col: number): void {
    if (this.state !== GameState.PLAYING) return;

    const piece = this.gridManager.getPieceAt(row, col);
    if (!piece) return;

    if (this.selectedPiece) {
      const { row: selRow, col: selCol } = this.selectedPiece;

      if (row === selRow && col === selCol) {
        // 同じピースをタップ → 選択解除
        this.deselectPiece();
      } else if (this.gridManager.isAdjacent(selRow, selCol, row, col)) {
        // 隣接ピースをタップ → スワップ
        this.trySwap(selRow, selCol, row, col);
      } else {
        // 離れたピースをタップ → 選択変更
        this.selectedPiece = { row, col };
        this.emit('pieceSelected', { row, col });
      }
    } else {
      // 新規選択
      this.selectedPiece = { row, col };
      this.emit('pieceSelected', { row, col });
    }
  }

  /**
   * スワイプ入力
   */
  swipe(
    startRow: number,
    startCol: number,
    direction: SwipeDirection
  ): void {
    if (this.state !== GameState.PLAYING) return;

    let targetRow = startRow;
    let targetCol = startCol;

    switch (direction) {
      case SwipeDirection.UP:
        targetRow--;
        break;
      case SwipeDirection.DOWN:
        targetRow++;
        break;
      case SwipeDirection.LEFT:
        targetCol--;
        break;
      case SwipeDirection.RIGHT:
        targetCol++;
        break;
    }

    if (this.gridManager.isValidPosition(targetRow, targetCol)) {
      this.trySwap(startRow, startCol, targetRow, targetCol);
    }
  }

  /**
   * ピース交換を試行
   */
  private async trySwap(
    row1: number,
    col1: number,
    row2: number,
    col2: number
  ): Promise<void> {
    this.deselectPiece();
    this.state = GameState.ANIMATING;

    // スワップ実行
    const swapped = this.gridManager.swapPieces(row1, col1, row2, col2);
    if (!swapped) {
      this.state = GameState.PLAYING;
      return;
    }

    this.emit('swapStarted', { from: { row: row1, col: col1 }, to: { row: row2, col: col2 } });

    // アニメーション待機
    await this.waitForAnimations();

    // マッチチェック
    const matches = this.matchDetector.findAllMatches();

    if (matches.length === 0) {
      // マッチなし → 元に戻す
      this.gridManager.swapPieces(row1, col1, row2, col2);
      await this.waitForAnimations();
      this.emit('swapReverted', {});
      this.state = GameState.PLAYING;
      return;
    }

    // マッチあり → 手数消費
    this.movesRemaining--;
    this.emit('moveMade', { movesRemaining: this.movesRemaining });

    // マッチ処理開始
    this.chainCount = 0;
    await this.processMatches(matches);
  }

  /**
   * マッチを処理（連鎖対応）
   */
  private async processMatches(matches: Match[]): Promise<void> {
    while (matches.length > 0) {
      this.chainCount++;
      this.state = GameState.CHECKING;

      // スコア計算
      const matchScore = this.calculateMatchScore(matches);
      this.score += matchScore;
      this.emit('scoreUpdated', { score: this.score, added: matchScore });

      // 目標更新
      this.updateGoals(matches);

      // マッチしたピースを記録
      const matchedPositions = matches.flatMap((m) =>
        m.pieces.map((p) => ({ row: p.row, col: p.col }))
      );

      // 特殊ピース生成
      for (const match of matches) {
        if (match.specialGenerated !== SpecialPieceType.NONE) {
          const centerPiece = match.pieces[Math.floor(match.pieces.length / 2)];
          centerPiece.special = match.specialGenerated;
          // この位置は削除しない
          const idx = matchedPositions.findIndex(
            (p) => p.row === centerPiece.row && p.col === centerPiece.col
          );
          if (idx !== -1) {
            matchedPositions.splice(idx, 1);
          }
        }
      }

      this.emit('matchFound', {
        matches,
        chain: this.chainCount,
      });

      // ピース削除
      this.gridManager.removeMatches(matchedPositions);

      // 落下アニメーション
      this.state = GameState.ANIMATING;
      const fallenPieces = this.gridManager.fillEmptyCells();
      this.emit('piecesFallen', { count: fallenPieces.length });

      await this.waitForAnimations();

      // 連鎖チェック
      matches = this.matchDetector.findAllMatches();
    }

    // ゲーム状態チェック
    this.checkGameState();
  }

  /**
   * スコア計算
   */
  private calculateMatchScore(matches: Match[]): number {
    let totalScore = 0;
    const config = DEFAULT_SCORE_CONFIG;
    const chainMultiplier = Math.pow(config.chainMultiplier, this.chainCount);

    for (const match of matches) {
      // 基本スコア
      const baseScore = match.pieces.length * config.matchBase;

      // 特殊ピースボーナス
      const specialBonus = config.specialBonus[match.specialGenerated] || 0;

      // 連鎖倍率適用
      totalScore += Math.floor((baseScore + specialBonus) * chainMultiplier);
    }

    return totalScore;
  }

  /**
   * 目標を更新
   */
  private updateGoals(matches: Match[]): void {
    for (const match of matches) {
      for (const piece of match.pieces) {
        // ピースタイプ収集目標
        for (const goal of this.goals) {
          if (goal.type === GoalType.COLLECT && goal.target === piece.type) {
            goal.current = Math.min(goal.current + 1, goal.required);
            this.emit('goalUpdated', { goal });
          }
        }
      }
    }
  }

  /**
   * ゲーム状態チェック
   */
  private checkGameState(): void {
    // 勝利チェック
    const allGoalsComplete = this.goals.every(
      (g) => g.current >= g.required
    );

    if (allGoalsComplete) {
      this.state = GameState.WIN;
      this.emit('gameWon', {
        score: this.score,
        stars: this.calculateStars(),
        movesLeft: this.movesRemaining,
      });
      return;
    }

    // 敗北チェック
    if (this.movesRemaining <= 0) {
      this.state = GameState.LOSE;
      this.emit('gameLost', { score: this.score });
      return;
    }

    // 移動可能チェック
    const possibleSwaps = this.matchDetector.findPossibleSwaps();
    if (possibleSwaps.length === 0) {
      // シャッフルが必要
      this.emit('needsShuffle', {});
      // TODO: シャッフル実装
    }

    this.state = GameState.PLAYING;
  }

  /**
   * 星評価を計算
   */
  private calculateStars(): number {
    // 残り手数に基づいて星を計算
    const moveRatio = this.movesRemaining / this.levelConfig.moves;
    if (moveRatio >= 0.5) return 3;
    if (moveRatio >= 0.25) return 2;
    return 1;
  }

  /**
   * アニメーション完了を待機
   */
  private waitForAnimations(): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        const isAnimating = this.gridManager.updateAnimations();
        if (isAnimating) {
          requestAnimationFrame(check);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(check);
    });
  }

  /**
   * ピース選択解除
   */
  private deselectPiece(): void {
    if (this.selectedPiece) {
      this.emit('pieceDeselected', this.selectedPiece);
      this.selectedPiece = null;
    }
  }

  /**
   * ブースターを使用
   */
  useBooster(type: BoosterType, row?: number, col?: number): boolean {
    if (this.state !== GameState.PLAYING) return false;

    switch (type) {
      case BoosterType.HAMMER:
        if (row === undefined || col === undefined) return false;
        const piece = this.gridManager.getPieceAt(row, col);
        if (!piece) return false;
        this.gridManager.removeMatches([{ row, col }]);
        this.emit('boosterUsed', { type, position: { row, col } });
        return true;

      case BoosterType.EXTRA_MOVES:
        this.movesRemaining += 5;
        this.emit('boosterUsed', { type, movesAdded: 5 });
        return true;

      case BoosterType.SHUFFLE:
        // TODO: シャッフル実装
        this.emit('boosterUsed', { type });
        return true;

      default:
        return false;
    }
  }

  /**
   * ゲーム一時停止
   */
  pause(): void {
    if (this.state === GameState.PLAYING) {
      this.state = GameState.PAUSED;
      this.emit('paused', {});
    }
  }

  /**
   * ゲーム再開
   */
  resume(): void {
    if (this.state === GameState.PAUSED) {
      this.state = GameState.PLAYING;
      this.emit('resumed', {});
    }
  }

  /**
   * イベントリスナー登録
   */
  on(event: string, callback: (data: unknown) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * イベント発火
   */
  private emit(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      for (const callback of listeners) {
        callback(data);
      }
    }
  }

  // ゲッター
  getState(): GameState {
    return this.state;
  }

  getScore(): number {
    return this.score;
  }

  getMovesRemaining(): number {
    return this.movesRemaining;
  }

  getGoals(): Goal[] {
    return this.goals;
  }

  getGridManager(): GridManager {
    return this.gridManager;
  }

  getSelectedPiece(): { row: number; col: number } | null {
    return this.selectedPiece;
  }

  /**
   * 更新処理（毎フレーム呼び出し）
   */
  update(): void {
    if (this.state === GameState.ANIMATING) {
      this.gridManager.updateAnimations();
    }
  }
}
