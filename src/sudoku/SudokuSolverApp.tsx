import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  countFilledCells,
  createEmptyBoard,
  solveSudoku,
  sudokuPresets,
  type SudokuBoard,
  type SudokuPreset,
  validateBoard,
} from './solver';

export function SudokuSolverApp() {
  const [selectedPreset, setSelectedPreset] = useState<SudokuPreset | null>(null);
  const [board, setBoard] = useState<SudokuBoard>(createEmptyBoard(sudokuPresets[0].size));
  const [solution, setSolution] = useState<SudokuBoard | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { width } = useWindowDimensions();

  const horizontalPadding = width < 540 ? 18 : 28;

  const handleSelectPreset = (preset: SudokuPreset) => {
    setSelectedPreset(preset);
    setBoard(createEmptyBoard(preset.size));
    setSolution(null);
    setMessage(null);
  };

  const handleChangeCell = (row: number, col: number, rawValue: string) => {
    if (!selectedPreset) {
      return;
    }

    const sanitizedValue = rawValue.replace(/[^0-9]/g, '');
    const nextValue = sanitizedValue === '' ? 0 : Number(sanitizedValue[sanitizedValue.length - 1]);

    if (nextValue > selectedPreset.size) {
      return;
    }

    setBoard((previousBoard) =>
      previousBoard.map((boardRow, rowIndex) =>
        boardRow.map((cell, colIndex) => {
          if (rowIndex === row && colIndex === col) {
            return nextValue;
          }

          return cell;
        }),
      ),
    );
    setSolution(null);
    setMessage(null);
  };

  const handleSolve = () => {
    if (!selectedPreset) {
      return;
    }

    if (countFilledCells(board) === 0) {
      setSolution(null);
      setMessage('Enter the Sudoku problem values first, then tap Solve Sudoku.');
      return;
    }

    const validationMessage = validateBoard(board, selectedPreset);

    if (validationMessage) {
      setSolution(null);
      setMessage(validationMessage);
      return;
    }

    const solvedBoard = solveSudoku(board, selectedPreset);

    if (!solvedBoard) {
      setSolution(null);
      setMessage('This Sudoku puzzle could not be solved. Please review the entered numbers.');
      return;
    }

    setSolution(solvedBoard);
    setMessage('Solved successfully. Your entries stay black and bold. Solver values appear in green.');
  };

  const handleClearBoard = () => {
    if (!selectedPreset) {
      return;
    }

    setBoard(createEmptyBoard(selectedPreset.size));
    setSolution(null);
    setMessage(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View pointerEvents="none" style={styles.backgroundGlowTop} />
      <View pointerEvents="none" style={styles.backgroundGlowBottom} />

      <ScrollView contentContainerStyle={[styles.page, { paddingHorizontal: horizontalPadding }]}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Sudoku Solver</Text>
          <Text style={styles.heroTitle}>Solve Sudoku on web and mobile from one app.</Text>
          <Text style={styles.heroSubtitle}>
            Choose a board size, enter your puzzle in the empty grid, and see the solved result in the same block format.
          </Text>
        </View>

        {!selectedPreset ? (
          <View style={styles.surfaceCard}>
            <Text style={styles.sectionTitle}>Choose Sudoku size</Text>
            <Text style={styles.sectionCopy}>
              `9 x 9` uses `3 x 3` subgrids and `6 x 6` uses `2 x 3` subgrids.
            </Text>

            <View style={styles.presetGrid}>
              {sudokuPresets.map((preset) => (
                <Pressable key={preset.id} onPress={() => handleSelectPreset(preset)} style={styles.presetCard}>
                  <Text style={styles.presetLabel}>{preset.label}</Text>
                  <Text style={styles.presetSubtitle}>{preset.subtitle}</Text>
                  <Text style={styles.presetHint}>Open empty board</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.surfaceCard}>
            <View style={styles.workspaceHeader}>
              <View style={styles.headerCopy}>
                <Text style={styles.sectionTitle}>Enter Sudoku problem</Text>
                <Text style={styles.sectionCopy}>
                  Fill the empty block below using values from `1` to `{selectedPreset.size}`.
                </Text>
              </View>

              <View style={styles.headerActions}>
                <Pressable onPress={() => setSelectedPreset(null)} style={[styles.secondaryButton, styles.smallButton]}>
                  <Text style={styles.secondaryButtonText}>Change size</Text>
                </Pressable>
                <Pressable onPress={handleClearBoard} style={[styles.secondaryButton, styles.smallButton]}>
                  <Text style={styles.secondaryButtonText}>Clear</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.boardSection}>
              <Text style={styles.boardTitle}>Problem board</Text>
              <SudokuBoardView
                board={board}
                editable
                preset={selectedPreset}
                onChangeCell={handleChangeCell}
                width={width}
              />
            </View>

            <Pressable onPress={handleSolve} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Solve Sudoku</Text>
            </Pressable>

            {message ? (
              <View style={styles.messageCard}>
                <Text style={styles.messageText}>{message}</Text>
              </View>
            ) : null}

            {solution ? (
              <View style={styles.boardSection}>
                <Text style={styles.boardTitle}>Solved board</Text>

                <SudokuBoardView
                  board={solution}
                  editable={false}
                  originalBoard={board}
                  preset={selectedPreset}
                  width={width}
                />
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type SudokuBoardViewProps = {
  board: SudokuBoard;
  editable: boolean;
  originalBoard?: SudokuBoard;
  preset: SudokuPreset;
  onChangeCell?: (row: number, col: number, value: string) => void;
  width: number;
};

function SudokuBoardView({
  board,
  editable,
  originalBoard,
  preset,
  onChangeCell,
  width,
}: SudokuBoardViewProps) {
  const maxBoardWidth = preset.size === 9 ? 396 : 360;
  const minimumBoardWidth = preset.size === 9 ? 252 : 240;
  const availableWidth = Math.max(minimumBoardWidth, Math.min(width - 52, maxBoardWidth));
  const cellSize = Math.floor(availableWidth / preset.size);
  const boardSize = cellSize * preset.size;

  return (
    <View style={[styles.boardShell, { width: boardSize + 18 }]}>
      <View style={[styles.board, { width: boardSize, height: boardSize }]}>
        {board.map((row, rowIndex) =>
          row.map((value, colIndex) => {
            const givenValue = originalBoard?.[rowIndex][colIndex] ?? 0;
            const isUserInput = givenValue > 0;
            const borderTopWidth = rowIndex === 0 ? 3 : rowIndex % preset.blockRows === 0 ? 3 : 1;
            const borderLeftWidth = colIndex === 0 ? 3 : colIndex % preset.blockCols === 0 ? 3 : 1;
            const borderRightWidth =
              colIndex === preset.size - 1 ? 3 : (colIndex + 1) % preset.blockCols === 0 ? 3 : 1;
            const borderBottomWidth =
              rowIndex === preset.size - 1 ? 3 : (rowIndex + 1) % preset.blockRows === 0 ? 3 : 1;

            if (editable) {
              return (
                <TextInput
                  accessibilityLabel={`Row ${rowIndex + 1} column ${colIndex + 1}`}
                  autoCapitalize="none"
                  autoCorrect={false}
                  importantForAutofill="no"
                  keyboardType={Platform.select({ ios: 'number-pad', android: 'numeric', default: 'numeric' })}
                  key={`${rowIndex}-${colIndex}`}
                  maxLength={1}
                  onChangeText={(nextValue) => onChangeCell?.(rowIndex, colIndex, nextValue)}
                  style={[
                    styles.cellInput,
                    {
                      width: cellSize,
                      height: cellSize,
                      borderTopWidth,
                      borderLeftWidth,
                      borderRightWidth,
                      borderBottomWidth,
                    },
                  ]}
                  value={value === 0 ? '' : String(value)}
                />
              );
            }

            return (
              <View
                key={`${rowIndex}-${colIndex}`}
                style={[
                  styles.cellOutput,
                  {
                    width: cellSize,
                    height: cellSize,
                    borderTopWidth,
                    borderLeftWidth,
                    borderRightWidth,
                    borderBottomWidth,
                  },
                ]}
              >
                <Text style={[styles.cellOutputText, isUserInput ? styles.givenValue : styles.solvedValue]}>
                  {value === 0 ? '' : value}
                </Text>
              </View>
            );
          }),
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundGlowBottom: {
    backgroundColor: '#f5c96f',
    borderRadius: 220,
    bottom: 60,
    height: 220,
    left: -92,
    opacity: 0.18,
    position: 'absolute',
    width: 220,
  },
  backgroundGlowTop: {
    backgroundColor: '#7ed4bd',
    borderRadius: 180,
    height: 180,
    opacity: 0.24,
    position: 'absolute',
    right: -32,
    top: 70,
    width: 180,
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  boardSection: {
    gap: 12,
  },
  boardShell: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#fffdf8',
    borderRadius: 28,
    padding: 9,
  },
  boardTitle: {
    color: '#132226',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  cellInput: {
    backgroundColor: '#fffdf8',
    borderColor: '#111111',
    color: '#111111',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  cellOutput: {
    alignItems: 'center',
    backgroundColor: '#fffdf8',
    borderColor: '#111111',
    justifyContent: 'center',
  },
  cellOutputText: {
    fontSize: 20,
    textAlign: 'center',
  },
  eyebrow: {
    color: '#4dd0a8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  givenValue: {
    color: '#111111',
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  headerCopy: {
    flex: 1,
    gap: 6,
    minWidth: 240,
  },
  heroCard: {
    backgroundColor: '#132226',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  heroSubtitle: {
    color: '#d5e3de',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 700,
  },
  heroTitle: {
    color: '#fffdf8',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
    marginBottom: 10,
    maxWidth: 700,
  },
  messageCard: {
    backgroundColor: '#fff7e6',
    borderColor: '#f0ca76',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  messageText: {
    color: '#5b4410',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  page: {
    gap: 20,
    minHeight: '100%',
    paddingBottom: 32,
    paddingTop: 18,
  },
  presetCard: {
    backgroundColor: '#fffdf8',
    borderColor: '#dae2dd',
    borderRadius: 24,
    borderWidth: 1,
    flex: 1,
    minHeight: 170,
    minWidth: 240,
    padding: 22,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  presetHint: {
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 'auto',
  },
  presetLabel: {
    color: '#111827',
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 10,
  },
  presetSubtitle: {
    color: '#556169',
    fontSize: 15,
    lineHeight: 22,
  },
  primaryButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#0f766e',
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: '#fffdf8',
    fontSize: 16,
    fontWeight: '800',
  },
  safeArea: {
    backgroundColor: '#f3ecdf',
    flex: 1,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#d5ddd8',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#132226',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionCopy: {
    color: '#556169',
    fontSize: 15,
    lineHeight: 22,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  smallButton: {
    minHeight: 42,
    paddingHorizontal: 18,
  },
  solvedValue: {
    color: '#15803d',
    fontWeight: '700',
  },
  surfaceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderColor: '#e4ded1',
    borderRadius: 28,
    borderWidth: 1,
    gap: 18,
    padding: 24,
  },
  workspaceHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
});
