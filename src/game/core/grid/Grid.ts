/**
 * Gardenscapes Clone - Grid System
 * Match-3グリッド管理システム
 */

import {
  Grid,
  GridCell,
  Piece,
  PieceType,
  SpecialPieceType,
  ObstacleType,
  LevelConfig,
  DEFAULT_ANIMATION_CONFIG,
} from '../../types';

// ユニークID生成
let pieceIdCounter = 0;
const generatePieceId = (): string => `piece_${++pieceIdCounter}`;

/**
 * グリッド管理クラス
 */
export class GridManager {
  private grid: Grid;
  private levelConfig: LevelConfig;
  private availablePieces: PieceType[];

  constructor(config: LevelConfig) {
    this.levelConfig = config;
    this.availablePieces = config.availablePieces;
    this.grid = this.createGrid(config);
  }

  /**
   * グリッドを作成
   */
  private createGrid(config: LevelConfig): Grid {
    const cells: GridCell[][] = [];
    const cellSize = 64; // ピクセル
    const offsetX = 50;
    const offsetY = 100;

    for (let row = 0; row < config.rows; row++) {
      cells[row] = [];
      for (let col = 0; col < config.cols; col++) {
        const isPlayable = config.grid[row]?.[col] !== null;
        const isSpawner = config.spawners.some(
          ([r, c]) => r === row && c === col
        );

        const cell: GridCell = {
          row,
          col,
          piece: null,
          isPlayable,
          spawner: isSpawner,
        };

        cells[row][col] = cell;
      }
    }

    return {
      rows: config.rows,
      cols: config.cols,
      cells,
      cellSize,
      offsetX,
      offsetY,
    };
  }

  /**
   * グリッドを初期化（ピースを配置）
   */
  initializeGrid(): void {
    const { rows, cols, cells } = this.grid;

    // 障害物を配置
    for (const obstacle of this.levelConfig.obstacles) {
      const cell = cells[obstacle.row]?.[obstacle.col];
      if (cell && cell.piece) {
        cell.piece.obstacle = obstacle.type;
      }
    }

    // ランダムにピースを配置（マッチが発生しないように）
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cell = cells[row][col];
        if (cell.isPlayable && !cell.piece) {
          cell.piece = this.createRandomPiece(row, col, true);
        }
      }
    }
  }

  /**
   * ランダムなピースを作成
   * @param avoidMatches マッチを避けるか
   */
  private createRandomPiece(
    row: number,
    col: number,
    avoidMatches: boolean = false
  ): Piece {
    let type: PieceType;

    if (avoidMatches) {
      // 左2つと上2つをチェックしてマッチを避ける
      const invalidTypes: Set<PieceType> = new Set();

      // 左方向チェック
      if (col >= 2) {
        const left1 = this.getPieceAt(row, col - 1);
        const left2 = this.getPieceAt(row, col - 2);
        if (left1 && left2 && left1.type === left2.type) {
          invalidTypes.add(left1.type);
        }
      }

      // 上方向チェック
      if (row >= 2) {
        const up1 = this.getPieceAt(row - 1, col);
        const up2 = this.getPieceAt(row - 2, col);
        if (up1 && up2 && up1.type === up2.type) {
          invalidTypes.add(up1.type);
        }
      }

      // 有効なピースタイプからランダム選択
      const validTypes = this.availablePieces.filter(
        (t) => !invalidTypes.has(t)
      );
      type =
        validTypes.length > 0
          ? validTypes[Math.floor(Math.random() * validTypes.length)]
          : this.availablePieces[
              Math.floor(Math.random() * this.availablePieces.length)
            ];
    } else {
      type =
        this.availablePieces[
          Math.floor(Math.random() * this.availablePieces.length)
        ];
    }

    const { cellSize, offsetX, offsetY } = this.grid;
    const x = offsetX + col * cellSize + cellSize / 2;
    const y = offsetY + row * cellSize + cellSize / 2;

    return {
      id: generatePieceId(),
      type,
      special: SpecialPieceType.NONE,
      obstacle: ObstacleType.NONE,
      collectible: null,
      row,
      col,
      x,
      y,
      targetX: x,
      targetY: y,
      isMoving: false,
      isMatched: false,
      isSelected: false,
    };
  }

  /**
   * 指定位置のピースを取得
   */
  getPieceAt(row: number, col: number): Piece | null {
    if (!this.isValidPosition(row, col)) return null;
    return this.grid.cells[row][col].piece;
  }

  /**
   * 指定位置にピースを設定
   */
  setPieceAt(row: number, col: number, piece: Piece | null): void {
    if (!this.isValidPosition(row, col)) return;
    this.grid.cells[row][col].piece = piece;
    if (piece) {
      piece.row = row;
      piece.col = col;
    }
  }

  /**
   * 2つのピースを交換
   */
  swapPieces(
    row1: number,
    col1: number,
    row2: number,
    col2: number
  ): boolean {
    const piece1 = this.getPieceAt(row1, col1);
    const piece2 = this.getPieceAt(row2, col2);

    if (!piece1 || !piece2) return false;

    // 障害物チェック
    if (
      piece1.obstacle !== ObstacleType.NONE ||
      piece2.obstacle !== ObstacleType.NONE
    ) {
      return false;
    }

    // 位置を交換
    this.setPieceAt(row1, col1, piece2);
    this.setPieceAt(row2, col2, piece1);

    // アニメーション目標を設定
    const { cellSize, offsetX, offsetY } = this.grid;

    piece1.targetX = offsetX + col2 * cellSize + cellSize / 2;
    piece1.targetY = offsetY + row2 * cellSize + cellSize / 2;
    piece1.isMoving = true;

    piece2.targetX = offsetX + col1 * cellSize + cellSize / 2;
    piece2.targetY = offsetY + row1 * cellSize + cellSize / 2;
    piece2.isMoving = true;

    return true;
  }

  /**
   * 位置が有効かチェック
   */
  isValidPosition(row: number, col: number): boolean {
    return (
      row >= 0 &&
      row < this.grid.rows &&
      col >= 0 &&
      col < this.grid.cols &&
      this.grid.cells[row][col].isPlayable
    );
  }

  /**
   * 隣接しているかチェック
   */
  isAdjacent(
    row1: number,
    col1: number,
    row2: number,
    col2: number
  ): boolean {
    const rowDiff = Math.abs(row1 - row2);
    const colDiff = Math.abs(col1 - col2);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  }

  /**
   * 空のセルを埋める（ピースを落下）
   */
  fillEmptyCells(): Piece[] {
    const movedPieces: Piece[] = [];
    const { rows, cols, cells, cellSize, offsetX, offsetY } = this.grid;

    // 各列を下から上に処理
    for (let col = 0; col < cols; col++) {
      let emptyRow = -1;

      // 下から空セルを探す
      for (let row = rows - 1; row >= 0; row--) {
        const cell = cells[row][col];
        if (!cell.isPlayable) continue;

        if (!cell.piece) {
          if (emptyRow === -1) emptyRow = row;
        } else if (emptyRow !== -1) {
          // ピースを落下させる
          const piece = cell.piece;
          this.setPieceAt(emptyRow, col, piece);
          this.setPieceAt(row, col, null);

          piece.targetX = offsetX + col * cellSize + cellSize / 2;
          piece.targetY = offsetY + emptyRow * cellSize + cellSize / 2;
          piece.isMoving = true;
          movedPieces.push(piece);

          // 次の空セルを探す
          emptyRow--;
          while (
            emptyRow >= 0 &&
            (!cells[emptyRow][col].isPlayable || cells[emptyRow][col].piece)
          ) {
            emptyRow--;
          }
          if (emptyRow < 0) emptyRow = -1;
        }
      }

      // スポーナーから新しいピースを生成
      if (emptyRow !== -1) {
        for (let row = emptyRow; row >= 0; row--) {
          const cell = cells[row][col];
          if (!cell.isPlayable) continue;
          if (!cell.piece) {
            // 上から落下してくるように初期位置を設定
            const newPiece = this.createRandomPiece(row, col, false);
            newPiece.y = offsetY - cellSize * (emptyRow - row + 1);
            newPiece.isMoving = true;
            this.setPieceAt(row, col, newPiece);
            movedPieces.push(newPiece);
          }
        }
      }
    }

    return movedPieces;
  }

  /**
   * マッチしたピースを削除
   */
  removeMatches(matches: { row: number; col: number }[]): void {
    for (const { row, col } of matches) {
      const cell = this.grid.cells[row]?.[col];
      if (cell) {
        cell.piece = null;
      }
    }
  }

  /**
   * 全ピースのアニメーションを更新
   */
  updateAnimations(): boolean {
    let anyMoving = false;
    const speed = DEFAULT_ANIMATION_CONFIG.fallSpeed;

    for (let row = 0; row < this.grid.rows; row++) {
      for (let col = 0; col < this.grid.cols; col++) {
        const piece = this.getPieceAt(row, col);
        if (!piece || !piece.isMoving) continue;

        // 目標位置に向かって移動
        const dx = piece.targetX - piece.x;
        const dy = piece.targetY - piece.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < speed) {
          piece.x = piece.targetX;
          piece.y = piece.targetY;
          piece.isMoving = false;
        } else {
          piece.x += (dx / distance) * speed;
          piece.y += (dy / distance) * speed;
          anyMoving = true;
        }
      }
    }

    return anyMoving;
  }

  /**
   * グリッド全体を取得
   */
  getGrid(): Grid {
    return this.grid;
  }

  /**
   * 全ピースを取得
   */
  getAllPieces(): Piece[] {
    const pieces: Piece[] = [];
    for (let row = 0; row < this.grid.rows; row++) {
      for (let col = 0; col < this.grid.cols; col++) {
        const piece = this.getPieceAt(row, col);
        if (piece) pieces.push(piece);
      }
    }
    return pieces;
  }

  /**
   * 画面座標からグリッド位置を取得
   */
  getGridPositionFromScreen(
    screenX: number,
    screenY: number
  ): { row: number; col: number } | null {
    const { cellSize, offsetX, offsetY, rows, cols } = this.grid;

    const col = Math.floor((screenX - offsetX) / cellSize);
    const row = Math.floor((screenY - offsetY) / cellSize);

    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      if (this.grid.cells[row][col].isPlayable) {
        return { row, col };
      }
    }

    return null;
  }

  /**
   * デバッグ用：グリッドを文字列で出力
   */
  debugPrint(): string {
    let result = '';
    for (let row = 0; row < this.grid.rows; row++) {
      for (let col = 0; col < this.grid.cols; col++) {
        const piece = this.getPieceAt(row, col);
        if (!piece) {
          result += '. ';
        } else {
          result += piece.type.charAt(0).toUpperCase() + ' ';
        }
      }
      result += '\n';
    }
    return result;
  }
}
