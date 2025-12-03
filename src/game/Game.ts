/**
 * Gardenscapes Clone - Main Game Class
 * メインゲームクラス（全体統合）
 */

import { LevelConfig, SwipeDirection, GameState } from './types';
import { GameEngine } from './core/GameEngine';
import { Renderer } from './ui/Renderer';
import { getLevel, ALL_LEVELS } from './levels/Level1';

/**
 * メインゲームクラス
 */
export class Game {
  private canvas: HTMLCanvasElement;
  private engine: GameEngine | null = null;
  private renderer: Renderer | null = null;
  private currentLevelId: number = 1;
  private isRunning: boolean = false;

  // 入力管理
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchStartTime: number = 0;

  constructor(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error(`Canvas with id "${canvasId}" not found`);
    }
    this.canvas = canvas;

    this.setupEventListeners();
  }

  /**
   * ゲームを初期化・開始
   */
  start(levelId: number = 1): void {
    const levelConfig = getLevel(levelId);
    if (!levelConfig) {
      console.error(`Level ${levelId} not found`);
      return;
    }

    this.currentLevelId = levelId;
    this.engine = new GameEngine(levelConfig);
    this.renderer = new Renderer(this.canvas, this.engine.getGridManager());

    // イベントリスナー設定
    this.setupGameEvents();

    // 初期化
    this.engine.initialize();

    // UI初期値設定
    this.renderer.setScore(this.engine.getScore());
    this.renderer.setMoves(this.engine.getMovesRemaining());
    this.renderer.setGoals(this.engine.getGoals());

    // 描画開始
    this.renderer.startRenderLoop();
    this.isRunning = true;

    // ゲーム開始
    this.engine.start();

    console.log(`🎮 Level ${levelId} started!`);
  }

  /**
   * ゲームイベントのセットアップ
   */
  private setupGameEvents(): void {
    if (!this.engine || !this.renderer) return;

    this.engine.on('scoreUpdated', (data: any) => {
      this.renderer?.setScore(data.score);
      // スコアポップアップ追加
      if (data.added > 0) {
        const grid = this.engine!.getGridManager().getGrid();
        this.renderer?.addScorePopup(
          grid.offsetX + (grid.cols * grid.cellSize) / 2,
          grid.offsetY + (grid.rows * grid.cellSize) / 2,
          data.added
        );
      }
    });

    this.engine.on('moveMade', (data: any) => {
      this.renderer?.setMoves(data.movesRemaining);
    });

    this.engine.on('goalUpdated', (data: any) => {
      this.renderer?.setGoals(this.engine!.getGoals());
    });

    this.engine.on('pieceSelected', (data: any) => {
      this.renderer?.setSelectedPiece(data);
    });

    this.engine.on('pieceDeselected', () => {
      this.renderer?.setSelectedPiece(null);
    });

    this.engine.on('matchFound', (data: any) => {
      // マッチエフェクト
      for (const match of data.matches) {
        this.renderer?.addMatchEffect(match.pieces);
      }
    });

    this.engine.on('gameWon', (data: any) => {
      console.log('🎉 You Win!', data);
      this.showResult(true, data);
    });

    this.engine.on('gameLost', (data: any) => {
      console.log('😢 Game Over', data);
      this.showResult(false, data);
    });
  }

  /**
   * 結果表示
   */
  private showResult(won: boolean, data: any): void {
    // TODO: ポップアップUI実装
    const message = won
      ? `🎉 Congratulations! Score: ${data.score}, Stars: ${'⭐'.repeat(data.stars)}`
      : `😢 Game Over. Score: ${data.score}`;

    setTimeout(() => {
      alert(message);
      if (won && this.currentLevelId < ALL_LEVELS.length) {
        if (confirm('Next level?')) {
          this.start(this.currentLevelId + 1);
        }
      } else {
        if (confirm('Retry?')) {
          this.start(this.currentLevelId);
        }
      }
    }, 500);
  }

  /**
   * イベントリスナーのセットアップ
   */
  private setupEventListeners(): void {
    // タッチ/マウスイベント
    this.canvas.addEventListener('mousedown', (e) => this.handlePointerDown(e));
    this.canvas.addEventListener('mouseup', (e) => this.handlePointerUp(e));
    this.canvas.addEventListener('mousemove', (e) => this.handlePointerMove(e));

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.handlePointerDown({
        clientX: touch.clientX,
        clientY: touch.clientY,
      } as MouseEvent);
    });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        this.handlePointerUp({
          clientX: touch.clientX,
          clientY: touch.clientY,
        } as MouseEvent);
      }
    });

    // キーボードイベント
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  /**
   * ポインタダウン処理
   */
  private handlePointerDown(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.touchStartX = e.clientX - rect.left;
    this.touchStartY = e.clientY - rect.top;
    this.touchStartTime = Date.now();
  }

  /**
   * ポインタアップ処理
   */
  private handlePointerUp(e: MouseEvent): void {
    if (!this.engine) return;

    const rect = this.canvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    const deltaX = endX - this.touchStartX;
    const deltaY = endY - this.touchStartY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = Date.now() - this.touchStartTime;

    const gridManager = this.engine.getGridManager();
    const startPos = gridManager.getGridPositionFromScreen(
      this.touchStartX,
      this.touchStartY
    );

    if (!startPos) return;

    if (distance > 30 && duration < 500) {
      // スワイプ
      let direction: SwipeDirection;
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? SwipeDirection.RIGHT : SwipeDirection.LEFT;
      } else {
        direction = deltaY > 0 ? SwipeDirection.DOWN : SwipeDirection.UP;
      }
      this.engine.swipe(startPos.row, startPos.col, direction);
    } else {
      // タップ
      this.engine.selectPiece(startPos.row, startPos.col);
    }
  }

  /**
   * ポインタムーブ処理
   */
  private handlePointerMove(e: MouseEvent): void {
    // 必要に応じてホバーエフェクトなど
  }

  /**
   * キーダウン処理
   */
  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.engine) return;

    switch (e.key) {
      case 'p':
      case 'P':
        if (this.engine.getState() === GameState.PLAYING) {
          this.engine.pause();
        } else if (this.engine.getState() === GameState.PAUSED) {
          this.engine.resume();
        }
        break;

      case 'r':
      case 'R':
        this.start(this.currentLevelId);
        break;

      case 'Escape':
        this.engine.pause();
        break;
    }
  }

  /**
   * ゲームを停止
   */
  stop(): void {
    this.isRunning = false;
    this.renderer?.stopRenderLoop();
  }

  /**
   * 現在のレベルIDを取得
   */
  getCurrentLevel(): number {
    return this.currentLevelId;
  }

  /**
   * ゲームエンジンを取得
   */
  getEngine(): GameEngine | null {
    return this.engine;
  }
}

// グローバルにエクスポート
export default Game;
