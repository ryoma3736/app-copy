/**
 * Gardenscapes Clone - Match Detection System
 * マッチング検出アルゴリズム（3,4,5マッチ、L/T字対応）
 */

import {
  Piece,
  PieceType,
  SpecialPieceType,
  Match,
} from '../../types';
import { GridManager } from '../grid/Grid';

/**
 * マッチ検出クラス
 */
export class MatchDetector {
  private gridManager: GridManager;

  constructor(gridManager: GridManager) {
    this.gridManager = gridManager;
  }

  /**
   * 全てのマッチを検出
   */
  findAllMatches(): Match[] {
    const horizontalMatches = this.findHorizontalMatches();
    const verticalMatches = this.findVerticalMatches();

    // L字・T字マッチを検出
    const combinedMatches = this.combineMatches([
      ...horizontalMatches,
      ...verticalMatches,
    ]);

    return combinedMatches;
  }

  /**
   * 横方向のマッチを検出
   */
  private findHorizontalMatches(): Match[] {
    const matches: Match[] = [];
    const grid = this.gridManager.getGrid();

    for (let row = 0; row < grid.rows; row++) {
      let matchStart = 0;
      let matchLength = 1;
      let currentType: PieceType | null = null;

      for (let col = 0; col <= grid.cols; col++) {
        const piece = this.gridManager.getPieceAt(row, col);
        const pieceType = piece?.type ?? null;

        if (
          pieceType &&
          pieceType !== PieceType.EMPTY &&
          pieceType === currentType
        ) {
          matchLength++;
        } else {
          // マッチ終了、3以上なら記録
          if (matchLength >= 3 && currentType !== null) {
            const matchedPieces: Piece[] = [];
            for (let c = matchStart; c < matchStart + matchLength; c++) {
              const p = this.gridManager.getPieceAt(row, c);
              if (p) matchedPieces.push(p);
            }

            matches.push({
              pieces: matchedPieces,
              type: 'horizontal',
              length: matchLength,
              specialGenerated: this.getSpecialForMatch(matchLength, 'horizontal'),
            });
          }

          // リセット
          matchStart = col;
          matchLength = 1;
          currentType = pieceType;
        }
      }
    }

    return matches;
  }

  /**
   * 縦方向のマッチを検出
   */
  private findVerticalMatches(): Match[] {
    const matches: Match[] = [];
    const grid = this.gridManager.getGrid();

    for (let col = 0; col < grid.cols; col++) {
      let matchStart = 0;
      let matchLength = 1;
      let currentType: PieceType | null = null;

      for (let row = 0; row <= grid.rows; row++) {
        const piece = this.gridManager.getPieceAt(row, col);
        const pieceType = piece?.type ?? null;

        if (
          pieceType &&
          pieceType !== PieceType.EMPTY &&
          pieceType === currentType
        ) {
          matchLength++;
        } else {
          // マッチ終了、3以上なら記録
          if (matchLength >= 3 && currentType !== null) {
            const matchedPieces: Piece[] = [];
            for (let r = matchStart; r < matchStart + matchLength; r++) {
              const p = this.gridManager.getPieceAt(r, col);
              if (p) matchedPieces.push(p);
            }

            matches.push({
              pieces: matchedPieces,
              type: 'vertical',
              length: matchLength,
              specialGenerated: this.getSpecialForMatch(matchLength, 'vertical'),
            });
          }

          // リセット
          matchStart = row;
          matchLength = 1;
          currentType = pieceType;
        }
      }
    }

    return matches;
  }

  /**
   * マッチを結合してL字・T字を検出
   */
  private combineMatches(matches: Match[]): Match[] {
    if (matches.length <= 1) return matches;

    const combinedMatches: Match[] = [];
    const usedIndices: Set<number> = new Set();

    for (let i = 0; i < matches.length; i++) {
      if (usedIndices.has(i)) continue;

      const match1 = matches[i];
      let combined = false;

      for (let j = i + 1; j < matches.length; j++) {
        if (usedIndices.has(j)) continue;

        const match2 = matches[j];

        // 同じタイプのピースかチェック
        if (match1.pieces[0]?.type !== match2.pieces[0]?.type) continue;

        // 交差点を探す
        const intersection = this.findIntersection(match1, match2);

        if (intersection) {
          // L字またはT字マッチを作成
          const allPieces = this.mergePiecesUnique([
            ...match1.pieces,
            ...match2.pieces,
          ]);
          const isT = this.isTShape(match1, match2);

          combinedMatches.push({
            pieces: allPieces,
            type: isT ? 't_shape' : 'l_shape',
            length: allPieces.length,
            specialGenerated: SpecialPieceType.PAPER_PLANE,
          });

          usedIndices.add(i);
          usedIndices.add(j);
          combined = true;
          break;
        }
      }

      if (!combined) {
        combinedMatches.push(match1);
        usedIndices.add(i);
      }
    }

    return combinedMatches;
  }

  /**
   * 2つのマッチの交差点を探す
   */
  private findIntersection(match1: Match, match2: Match): Piece | null {
    for (const p1 of match1.pieces) {
      for (const p2 of match2.pieces) {
        if (p1.row === p2.row && p1.col === p2.col) {
          return p1;
        }
      }
    }
    return null;
  }

  /**
   * T字形状かどうかをチェック
   */
  private isTShape(match1: Match, match2: Match): boolean {
    // 一方が3以上、もう一方も3以上で、交差点が端でない場合
    const intersection = this.findIntersection(match1, match2);
    if (!intersection) return false;

    const isMiddle1 = this.isMiddlePiece(match1, intersection);
    const isMiddle2 = this.isMiddlePiece(match2, intersection);

    return isMiddle1 || isMiddle2;
  }

  /**
   * ピースがマッチの中央にあるかチェック
   */
  private isMiddlePiece(match: Match, piece: Piece): boolean {
    if (match.pieces.length < 3) return false;

    const index = match.pieces.findIndex(
      (p) => p.row === piece.row && p.col === piece.col
    );

    return index > 0 && index < match.pieces.length - 1;
  }

  /**
   * ピースを重複なくマージ
   */
  private mergePiecesUnique(pieces: Piece[]): Piece[] {
    const seen = new Set<string>();
    const unique: Piece[] = [];

    for (const piece of pieces) {
      const key = `${piece.row},${piece.col}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(piece);
      }
    }

    return unique;
  }

  /**
   * マッチ長から生成される特殊ピースを決定
   */
  private getSpecialForMatch(
    length: number,
    direction: 'horizontal' | 'vertical'
  ): SpecialPieceType {
    if (length >= 5) {
      return SpecialPieceType.RAINBOW;
    } else if (length === 4) {
      return direction === 'horizontal'
        ? SpecialPieceType.ROCKET_V
        : SpecialPieceType.ROCKET_H;
    }
    return SpecialPieceType.NONE;
  }

  /**
   * 特定の位置でマッチが発生するかチェック
   */
  checkMatchAt(row: number, col: number): Match | null {
    const piece = this.gridManager.getPieceAt(row, col);
    if (!piece || piece.type === PieceType.EMPTY) return null;

    const horizontal = this.getHorizontalMatchAt(row, col, piece.type);
    const vertical = this.getVerticalMatchAt(row, col, piece.type);

    // マッチがあれば返す
    if (horizontal.length >= 3 || vertical.length >= 3) {
      const allPieces = this.mergePiecesUnique([...horizontal, ...vertical]);
      const isLOrT = horizontal.length >= 3 && vertical.length >= 3;

      let type: Match['type'] = 'horizontal';
      if (isLOrT) {
        type = this.isTShapeFromPieces(horizontal, vertical, piece)
          ? 't_shape'
          : 'l_shape';
      } else if (vertical.length >= horizontal.length) {
        type = 'vertical';
      }

      let special = SpecialPieceType.NONE;
      if (isLOrT) {
        special = SpecialPieceType.PAPER_PLANE;
      } else if (allPieces.length >= 5) {
        special = SpecialPieceType.RAINBOW;
      } else if (allPieces.length === 4) {
        special =
          type === 'horizontal'
            ? SpecialPieceType.ROCKET_V
            : SpecialPieceType.ROCKET_H;
      }

      return {
        pieces: allPieces,
        type,
        length: allPieces.length,
        specialGenerated: special,
      };
    }

    return null;
  }

  /**
   * 横方向の連続マッチを取得
   */
  private getHorizontalMatchAt(
    row: number,
    col: number,
    type: PieceType
  ): Piece[] {
    const pieces: Piece[] = [];
    const centerPiece = this.gridManager.getPieceAt(row, col);
    if (centerPiece) pieces.push(centerPiece);

    // 左方向
    for (let c = col - 1; c >= 0; c--) {
      const piece = this.gridManager.getPieceAt(row, c);
      if (piece && piece.type === type) {
        pieces.unshift(piece);
      } else {
        break;
      }
    }

    // 右方向
    for (let c = col + 1; c < this.gridManager.getGrid().cols; c++) {
      const piece = this.gridManager.getPieceAt(row, c);
      if (piece && piece.type === type) {
        pieces.push(piece);
      } else {
        break;
      }
    }

    return pieces;
  }

  /**
   * 縦方向の連続マッチを取得
   */
  private getVerticalMatchAt(
    row: number,
    col: number,
    type: PieceType
  ): Piece[] {
    const pieces: Piece[] = [];
    const centerPiece = this.gridManager.getPieceAt(row, col);
    if (centerPiece) pieces.push(centerPiece);

    // 上方向
    for (let r = row - 1; r >= 0; r--) {
      const piece = this.gridManager.getPieceAt(r, col);
      if (piece && piece.type === type) {
        pieces.unshift(piece);
      } else {
        break;
      }
    }

    // 下方向
    for (let r = row + 1; r < this.gridManager.getGrid().rows; r++) {
      const piece = this.gridManager.getPieceAt(r, col);
      if (piece && piece.type === type) {
        pieces.push(piece);
      } else {
        break;
      }
    }

    return pieces;
  }

  /**
   * ピース配列からT字形状かチェック
   */
  private isTShapeFromPieces(
    horizontal: Piece[],
    vertical: Piece[],
    center: Piece
  ): boolean {
    const hIndex = horizontal.findIndex(
      (p) => p.row === center.row && p.col === center.col
    );
    const vIndex = vertical.findIndex(
      (p) => p.row === center.row && p.col === center.col
    );

    const isHMiddle = hIndex > 0 && hIndex < horizontal.length - 1;
    const isVMiddle = vIndex > 0 && vIndex < vertical.length - 1;

    return isHMiddle || isVMiddle;
  }

  /**
   * 可能なスワップを検索（ヒント機能用）
   */
  findPossibleSwaps(): Array<{
    from: { row: number; col: number };
    to: { row: number; col: number };
  }> {
    const possibleSwaps: Array<{
      from: { row: number; col: number };
      to: { row: number; col: number };
    }> = [];
    const grid = this.gridManager.getGrid();

    for (let row = 0; row < grid.rows; row++) {
      for (let col = 0; col < grid.cols; col++) {
        // 右隣とのスワップをチェック
        if (col < grid.cols - 1) {
          if (this.wouldCreateMatch(row, col, row, col + 1)) {
            possibleSwaps.push({
              from: { row, col },
              to: { row, col: col + 1 },
            });
          }
        }

        // 下隣とのスワップをチェック
        if (row < grid.rows - 1) {
          if (this.wouldCreateMatch(row, col, row + 1, col)) {
            possibleSwaps.push({
              from: { row, col },
              to: { row: row + 1, col },
            });
          }
        }
      }
    }

    return possibleSwaps;
  }

  /**
   * スワップでマッチが発生するかチェック
   */
  private wouldCreateMatch(
    row1: number,
    col1: number,
    row2: number,
    col2: number
  ): boolean {
    const piece1 = this.gridManager.getPieceAt(row1, col1);
    const piece2 = this.gridManager.getPieceAt(row2, col2);

    if (!piece1 || !piece2) return false;
    if (piece1.type === PieceType.EMPTY || piece2.type === PieceType.EMPTY)
      return false;

    // 一時的にスワップ
    this.gridManager.swapPieces(row1, col1, row2, col2);

    // マッチをチェック
    const match1 = this.checkMatchAt(row1, col1);
    const match2 = this.checkMatchAt(row2, col2);

    // 元に戻す
    this.gridManager.swapPieces(row1, col1, row2, col2);

    return match1 !== null || match2 !== null;
  }
}
