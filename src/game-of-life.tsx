"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card } from "@/components/ui/card"
import { Play, Pause, RotateCcw } from "lucide-react"

const CELL_SIZE = 20

export default function ConwaysGameOfLife() {
  const [grid, setGrid] = useState<boolean[][]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [generation, setGeneration] = useState(0)
  const [speed, setSpeed] = useState([500])
  const [isDragging, setIsDragging] = useState(false)
  const [dragMode, setDragMode] = useState<"paint" | "erase">("paint")
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const gridRef = useRef<HTMLDivElement>(null)

  // Calculate grid dimensions based on container size
  const getGridDimensions = useCallback(() => {
    const containerHeight = window.innerHeight - 40 // Account for padding
    const containerWidth = (window.innerWidth * 0.75) - 40 // 75% width minus padding
    const rows = Math.floor(containerHeight / CELL_SIZE)
    const cols = Math.floor(containerWidth / CELL_SIZE)
    return { rows, cols }
  }, [])

  // Initialize empty grid
  const initializeGrid = useCallback(() => {
    const { rows, cols } = getGridDimensions()
    return Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(false))
  }, [getGridDimensions])

  // Initialize grid on component mount
  useEffect(() => {
    setGrid(initializeGrid())
  }, [initializeGrid])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setGrid(initializeGrid())
      setGeneration(0)
      setIsRunning(false)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [initializeGrid])

  // Count live neighbors for a cell
  const countNeighbors = useCallback((grid: boolean[][], row: number, col: number) => {
    let count = 0
    const directions = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ]

    for (const [dx, dy] of directions) {
      const newRow = row + dx
      const newCol = col + dy
      if (newRow >= 0 && newRow < grid.length && newCol >= 0 && newCol < grid[0].length) {
        if (grid[newRow][newCol]) count++
      }
    }
    return count
  }, [])

  // Apply Conway's Game of Life rules
  const nextGeneration = useCallback(
    (currentGrid: boolean[][]) => {
      const newGrid = currentGrid.map((row) => [...row])

      for (let row = 0; row < currentGrid.length; row++) {
        for (let col = 0; col < currentGrid[0].length; col++) {
          const neighbors = countNeighbors(currentGrid, row, col)
          const isAlive = currentGrid[row][col]

          // Conway's rules (B3/S23)
          if (isAlive) {
            // Live cell with 2-3 neighbors survives
            newGrid[row][col] = neighbors === 2 || neighbors === 3
          } else {
            // Dead cell with exactly 3 neighbors becomes alive
            newGrid[row][col] = neighbors === 3
          }
        }
      }

      return newGrid
    },
    [countNeighbors],
  )

  // Count total population
  const getPopulation = useCallback((grid: boolean[][]) => {
    return grid.flat().filter((cell) => cell).length
  }, [])

  // Game loop
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setGrid((currentGrid) => {
          const newGrid = nextGeneration(currentGrid)
          setGeneration((gen) => gen + 1)
          return newGrid
        })
      }, speed[0])
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, speed, nextGeneration])

  // Toggle cell state
  const toggleCell = useCallback((row: number, col: number) => {
    setGrid((currentGrid) => {
      const newGrid = [...currentGrid]
      newGrid[row] = [...newGrid[row]]
      newGrid[row][col] = !newGrid[row][col]
      return newGrid
    })
  }, [])

  // Handle cell interaction
  const handleCellInteraction = useCallback(
    (row: number, col: number, isClick = false) => {
      if (isRunning) return

      if (isClick) {
        toggleCell(row, col)
        setDragMode(grid[row][col] ? "erase" : "paint")
      } else if (isDragging) {
        setGrid((currentGrid) => {
          const newGrid = [...currentGrid]
          newGrid[row] = [...newGrid[row]]
          newGrid[row][col] = dragMode === "paint"
          return newGrid
        })
      }
    },
    [isRunning, isDragging, dragMode, toggleCell, grid],
  )

  // Mouse event handlers
  const handleMouseDown = useCallback(
    (row: number, col: number) => {
      if (isRunning) return
      setIsDragging(true)
      handleCellInteraction(row, col, true)
    },
    [isRunning, handleCellInteraction],
  )

  const handleMouseEnter = useCallback(
    (row: number, col: number) => {
      handleCellInteraction(row, col)
    },
    [handleCellInteraction],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Clear grid
  const clearGrid = useCallback(() => {
    setGrid(initializeGrid())
    setGeneration(0)
    setIsRunning(false)
  }, [initializeGrid])

  // Toggle play/pause
  const toggleRunning = useCallback(() => {
    setIsRunning(!isRunning)
  }, [isRunning])

  if (grid.length === 0) return null

  return (
    <div className="min-h-screen bg-gray-50 flex align-middle p-5 justify-between items-center gap-10 m-auto">
      {/* Left Control Panel - 25% */}
      <div className="min-w-[29vw] max-w-[30vw] bg-white shadow-lg border-r border-gray-200 rounded-3xl  max-h-[83vh]">
        <div className="p-3 h-full flex flex-col">
          <div className="mb-8">
            <h1 className="text-sm font-bold text-gray-800 mb-2">Game of Life</h1>
            <p className="text-sm text-gray-600">A cellular automaton simulation</p>
          </div>

          {/* Statistics */}
          <div className="mb-8 space-y-4">
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{generation}</div>
                <div className="text-sm text-blue-700">Generation</div>
              </div>
            </Card>
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{getPopulation(grid)}</div>
                <div className="text-sm text-green-700">Live Cells</div>
              </div>
            </Card>
          </div>

          {/* Controls */}
          <div className="space-y-6 flex-1">
            <div className="space-y-4">
              <Button
                onClick={toggleRunning}
                variant={isRunning ? "destructive" : "default"}
                size="lg"
                className="w-full flex items-center justify-center gap-2"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-5 h-5" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Start
                  </>
                )}
              </Button>

              <Button 
                onClick={clearGrid} 
                variant="outline" 
                size="lg" 
                className="w-full flex items-center justify-center gap-2 text-white"
              >
                <RotateCcw className="w-5 h-5" />
                Clear Grid
              </Button>
            </div>

            {/* Speed Control */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Speed</span>
                <span className="text-sm text-gray-500">{speed[0]}ms</span>
              </div>
              <Slider 
                value={speed} 
                onValueChange={setSpeed} 
                max={2000} 
                min={100} 
                step={100} 
                className="w-full" 
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>Fast</span>
                <span>Slow</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 pt-6 border-t border-gray-200 hidden">
            <h3 className="font-semibold text-gray-700 mb-3">How to Use</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Click cells to toggle them on/off</p>
              <p>• Drag to paint multiple cells</p>
              <p>• Press Start to begin simulation</p>
            </div>
            
            <h3 className="font-semibold text-gray-700 mb-2 mt-4">Rules</h3>
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Live cells with 2-3 neighbors survive</p>
              <p>• Dead cells with exactly 3 neighbors become alive</p>
              <p>• All other cells die or stay dead</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Grid Area - 75% */}
      <div className=" flex items-center justify-center align-middle ">
        <div
          ref={gridRef}
          className="bg-white border-2 border-gray-300 rounded-3xl overflow-hidden select-none shadow-lg p-4 max-w-[58vw] max-h-[85vh]"
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="grid gap-0 h-full w-full overflow-hidden">
            {grid.map((row, rowIndex) => (
              <div key={rowIndex} className="flex">
                {row.map((cell, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`
                      border border-gray-200 cursor-pointer transition-all duration-75
                      hover:bg-gray-100 flex items-center justify-center
                      ${cell ? "bg-black" : "bg-white"}
                    `}
                    style={{
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      minWidth: CELL_SIZE,
                      minHeight: CELL_SIZE,
                    }}
                    onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                    onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                  >
                    {cell && (
                      <div
                        className="w-full h-full bg-black rounded-sm transition-all duration-150"
                        style={{ transform: "scale(0.9)" }}
                      />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}