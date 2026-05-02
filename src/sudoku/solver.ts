export type SudokuPreset = {
  id: string;
  size: number;
  blockRows: number;
  blockCols: number;
  label: string;
  subtitle: string;
};

export type SudokuBoard = number[][];

export const sudokuPresets: SudokuPreset[] = [
  {
    id: '6x6',
    size: 6,
    blockRows: 2,
    blockCols: 3,
    label: '6 x 6',
    subtitle: '6 rows, 6 columns, 2 x 3 subgrid',
  },
  {
    id: '9x9',
    size: 9,
    blockRows: 3,
    blockCols: 3,
    label: '9 x 9',
    subtitle: '9 rows, 9 columns, 3 x 3 subgrid',
  },
];

export function createEmptyBoard(size: number): SudokuBoard {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
}

export function cloneBoard(board: SudokuBoard): SudokuBoard {
  return board.map((row) => [...row]);
}

export function countFilledCells(board: SudokuBoard): number {
  return board.reduce((count, row) => count + row.filter((value) => value > 0).length, 0);
}

export function validateBoard(
  board: SudokuBoard,
  preset: Pick<SudokuPreset, 'size' | 'blockRows' | 'blockCols'>,
): string | null {
  const { size, blockRows, blockCols } = preset;

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const value = board[row][col];

      if (value === 0) {
        continue;
      }

      if (value < 1 || value > size) {
        return `Only values from 1 to ${size} are allowed.`;
      }

      if (!isPlacementValid(board, row, col, value, blockRows, blockCols, true)) {
        return `There is a conflict near row ${row + 1}, column ${col + 1}.`;
      }
    }
  }

  return null;
}

export function solveSudoku(
  board: SudokuBoard,
  preset: Pick<SudokuPreset, 'size' | 'blockRows' | 'blockCols'>,
): SudokuBoard | null {
  const workingBoard = cloneBoard(board);
  const didSolve = solveCell(workingBoard, preset.size, preset.blockRows, preset.blockCols);

  return didSolve ? workingBoard : null;
}

function solveCell(
  board: SudokuBoard,
  size: number,
  blockRows: number,
  blockCols: number,
): boolean {
  const nextCell = findBestEmptyCell(board, size, blockRows, blockCols);

  if (!nextCell) {
    return true;
  }

  const { row, col, candidates } = nextCell;

  for (const candidate of candidates) {
    board[row][col] = candidate;

    if (solveCell(board, size, blockRows, blockCols)) {
      return true;
    }
  }

  board[row][col] = 0;
  return false;
}

function findBestEmptyCell(
  board: SudokuBoard,
  size: number,
  blockRows: number,
  blockCols: number,
): { row: number; col: number; candidates: number[] } | null {
  let bestCell: { row: number; col: number; candidates: number[] } | null = null;

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (board[row][col] !== 0) {
        continue;
      }

      const candidates = getCandidates(board, row, col, size, blockRows, blockCols);

      if (candidates.length === 0) {
        return { row, col, candidates };
      }

      if (!bestCell || candidates.length < bestCell.candidates.length) {
        bestCell = { row, col, candidates };

        if (candidates.length === 1) {
          return bestCell;
        }
      }
    }
  }

  return bestCell;
}

function getCandidates(
  board: SudokuBoard,
  row: number,
  col: number,
  size: number,
  blockRows: number,
  blockCols: number,
): number[] {
  const candidates: number[] = [];

  for (let value = 1; value <= size; value += 1) {
    if (isPlacementValid(board, row, col, value, blockRows, blockCols)) {
      candidates.push(value);
    }
  }

  return candidates;
}

function isPlacementValid(
  board: SudokuBoard,
  row: number,
  col: number,
  value: number,
  blockRows: number,
  blockCols: number,
  allowSameCell = false,
): boolean {
  for (let index = 0; index < board.length; index += 1) {
    if (index !== col && board[row][index] === value) {
      return false;
    }

    if (index !== row && board[index][col] === value) {
      return false;
    }
  }

  const startRow = Math.floor(row / blockRows) * blockRows;
  const startCol = Math.floor(col / blockCols) * blockCols;

  for (let blockRow = startRow; blockRow < startRow + blockRows; blockRow += 1) {
    for (let blockCol = startCol; blockCol < startCol + blockCols; blockCol += 1) {
      const isSameCell = blockRow === row && blockCol === col;

      if ((!allowSameCell || !isSameCell) && board[blockRow][blockCol] === value) {
        return false;
      }
    }
  }

  return true;
}
