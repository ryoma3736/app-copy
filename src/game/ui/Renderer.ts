/**
 * Gardenscapes Clone - Canvas Renderer
 * HTML5 Canvas描画システム
 */

import {
  Grid,
  Piece,
  PieceType,
  SpecialPieceType,
  ObstacleType,
  Goal,
  GoalType,
} from '../types';
import { GridManager } from '../core/grid/Grid';

// ピースの色定義（Gardenscapesカラーパレット再現）
const PIECE_COLORS: Record<PieceType, string> = {
  [PieceType.RED]: '#E74C3C',
  [PieceType.BLUE]: '#3498DB',
  [PieceType.GREEN]: '#27AE60',
  [PieceType.YELLOW]: '#F1C40F',
  [PieceType.PURPLE]: '#9B59B6',
  [PieceType.ORANGE]: '#E67E22',
  [PieceType.EMPTY]: 'transparent',
};

// 特殊ピースのアイコン
const SPECIAL_ICONS: Record<SpecialPieceType, string> = {
  [SpecialPieceType.NONE]: '',
  [SpecialPieceType.BOMB]: '💣',
  [SpecialPieceType.ROCKET_H]: '🚀',
  [SpecialPieceType.ROCKET_V]: '🚀',
  [SpecialPieceType.RAINBOW]: '🌈',
  [SpecialPieceType.PAPER_PLANE]: '✈️',
};

/**
 * Canvas描画クラス
 */
export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gridManager: GridManager;
  private animationFrameId: number | null = null;

  // UI要素
  private score: number = 0;
  private moves: number = 0;
  private goals: Goal[] = [];
  private selectedPiece: { row: number; col: number } | null = null;

  // アニメーション用
  private particles: Particle[] = [];
  private scorePopups: ScorePopup[] = [];

  constructor(canvas: HTMLCanvasElement, gridManager: GridManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.gridManager = gridManager;

    // キャンバスサイズ設定
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  /**
   * キャンバスリサイズ
   */
  private resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);

    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
  }

  /**
   * 描画ループ開始
   */
  startRenderLoop(): void {
    const loop = () => {
      this.render();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  /**
   * 描画ループ停止
   */
  stopRenderLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * メイン描画
   */
  private render(): void {
    const { width, height } = this.canvas.getBoundingClientRect();

    // クリア
    this.ctx.clearRect(0, 0, width, height);

    // 背景
    this.drawBackground(width, height);

    // ヘッダー（スコア、手数、目標）
    this.drawHeader();

    // グリッド
    this.drawGrid();

    // ピース
    this.drawPieces();

    // パーティクル
    this.updateAndDrawParticles();

    // スコアポップアップ
    this.updateAndDrawScorePopups();
  }

  /**
   * 背景描画
   */
  private drawBackground(width: number, height: number): void {
    // グラデーション背景
    const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#1a5f7a');
    gradient.addColorStop(1, '#0d3b4c');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);
  }

  /**
   * ヘッダー描画
   */
  private drawHeader(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, this.canvas.getBoundingClientRect().width, 80);

    // スコア
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.fillText(`Score: ${this.score}`, 20, 35);

    // 手数
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.fillText(`Moves: ${this.moves}`, 20, 65);

    // 目標
    let goalX = 200;
    for (const goal of this.goals) {
      this.drawGoal(goal, goalX, 25);
      goalX += 100;
    }
  }

  /**
   * 目標描画
   */
  private drawGoal(goal: Goal, x: number, y: number): void {
    // 目標アイコン
    const color = PIECE_COLORS[goal.target as PieceType] || '#FFFFFF';
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y + 15, 15, 0, Math.PI * 2);
    this.ctx.fill();

    // 進捗
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '16px Arial';
    this.ctx.fillText(
      `${goal.current}/${goal.required}`,
      x + 25,
      y + 20
    );

    // 完了チェック
    if (goal.current >= goal.required) {
      this.ctx.fillStyle = '#27AE60';
      this.ctx.font = '20px Arial';
      this.ctx.fillText('✓', x + 25, y + 40);
    }
  }

  /**
   * グリッド描画
   */
  private drawGrid(): void {
    const grid = this.gridManager.getGrid();
    const { cellSize, offsetX, offsetY, rows, cols } = grid;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cell = grid.cells[row][col];
        if (!cell.isPlayable) continue;

        const x = offsetX + col * cellSize;
        const y = offsetY + row * cellSize;

        // セル背景
        this.ctx.fillStyle = (row + col) % 2 === 0 ? '#2C3E50' : '#34495E';
        this.ctx.fillRect(x, y, cellSize, cellSize);

        // セル境界
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.strokeRect(x, y, cellSize, cellSize);
      }
    }
  }

  /**
   * ピース描画
   */
  private drawPieces(): void {
    const pieces = this.gridManager.getAllPieces();
    const grid = this.gridManager.getGrid();
    const radius = grid.cellSize * 0.4;

    for (const piece of pieces) {
      if (piece.type === PieceType.EMPTY) continue;

      // 選択状態
      const isSelected =
        this.selectedPiece &&
        this.selectedPiece.row === piece.row &&
        this.selectedPiece.col === piece.col;

      // ピース描画
      this.drawPiece(piece, radius, isSelected ?? false);
    }
  }

  /**
   * 個別ピース描画
   */
  private drawPiece(
    piece: Piece,
    radius: number,
    isSelected: boolean
  ): void {
    const { x, y, type, special, obstacle, isMatched } = piece;

    // 障害物があれば先に描画
    if (obstacle !== ObstacleType.NONE) {
      this.drawObstacle(x, y, radius, obstacle);
    }

    // マッチ時のフェードエフェクト
    if (isMatched) {
      this.ctx.globalAlpha = 0.5;
    }

    // 選択時のグロー
    if (isSelected) {
      this.ctx.shadowColor = '#FFD700';
      this.ctx.shadowBlur = 15;
    }

    // ピース本体
    this.ctx.fillStyle = PIECE_COLORS[type];
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();

    // ハイライト
    const gradient = this.ctx.createRadialGradient(
      x - radius * 0.3,
      y - radius * 0.3,
      0,
      x,
      y,
      radius
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();

    // 特殊ピースアイコン
    if (special !== SpecialPieceType.NONE) {
      this.ctx.font = `${radius}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(SPECIAL_ICONS[special], x, y);
    }

    // リセット
    this.ctx.shadowBlur = 0;
    this.ctx.globalAlpha = 1;
  }

  /**
   * 障害物描画
   */
  private drawObstacle(
    x: number,
    y: number,
    radius: number,
    type: ObstacleType
  ): void {
    const size = radius * 2.2;

    switch (type) {
      case ObstacleType.ICE_1:
      case ObstacleType.ICE_2:
      case ObstacleType.ICE_3:
        // 氷
        this.ctx.fillStyle = 'rgba(200, 230, 255, 0.6)';
        this.ctx.fillRect(x - size / 2, y - size / 2, size, size);
        this.ctx.strokeStyle = '#ADD8E6';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x - size / 2, y - size / 2, size, size);
        break;

      case ObstacleType.CHAIN:
        // 鎖
        this.ctx.strokeStyle = '#7F8C8D';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(x - size / 2, y);
        this.ctx.lineTo(x + size / 2, y);
        this.ctx.moveTo(x, y - size / 2);
        this.ctx.lineTo(x, y + size / 2);
        this.ctx.stroke();
        break;

      case ObstacleType.BOX_1:
      case ObstacleType.BOX_2:
      case ObstacleType.BOX_3:
        // 木箱
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x - size / 2, y - size / 2, size, size);
        this.ctx.strokeStyle = '#5D3A1A';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x - size / 2, y - size / 2, size, size);
        break;

      default:
        break;
    }
  }

  /**
   * パーティクル更新・描画
   */
  private updateAndDrawParticles(): void {
    this.particles = this.particles.filter((p) => p.life > 0);

    for (const particle of this.particles) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.2; // 重力
      particle.life--;
      particle.alpha = particle.life / particle.maxLife;

      this.ctx.globalAlpha = particle.alpha;
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.globalAlpha = 1;
  }

  /**
   * スコアポップアップ更新・描画
   */
  private updateAndDrawScorePopups(): void {
    this.scorePopups = this.scorePopups.filter((p) => p.life > 0);

    for (const popup of this.scorePopups) {
      popup.y -= 1;
      popup.life--;
      popup.alpha = popup.life / popup.maxLife;

      this.ctx.globalAlpha = popup.alpha;
      this.ctx.fillStyle = '#FFD700';
      this.ctx.font = 'bold 20px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`+${popup.score}`, popup.x, popup.y);
    }

    this.ctx.globalAlpha = 1;
  }

  /**
   * マッチエフェクトを追加
   */
  addMatchEffect(pieces: Piece[]): void {
    for (const piece of pieces) {
      const color = PIECE_COLORS[piece.type];
      for (let i = 0; i < 10; i++) {
        this.particles.push({
          x: piece.x,
          y: piece.y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8 - 3,
          size: Math.random() * 5 + 2,
          color,
          life: 30,
          maxLife: 30,
          alpha: 1,
        });
      }
    }
  }

  /**
   * スコアポップアップを追加
   */
  addScorePopup(x: number, y: number, score: number): void {
    this.scorePopups.push({
      x,
      y,
      score,
      life: 60,
      maxLife: 60,
      alpha: 1,
    });
  }

  // UI状態更新メソッド
  setScore(score: number): void {
    this.score = score;
  }

  setMoves(moves: number): void {
    this.moves = moves;
  }

  setGoals(goals: Goal[]): void {
    this.goals = goals;
  }

  setSelectedPiece(piece: { row: number; col: number } | null): void {
    this.selectedPiece = piece;
  }
}

// パーティクル型
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  alpha: number;
}

// スコアポップアップ型
interface ScorePopup {
  x: number;
  y: number;
  score: number;
  life: number;
  maxLife: number;
  alpha: number;
}
