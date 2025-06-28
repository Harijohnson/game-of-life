"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, RotateCcw, Info } from "lucide-react"

const CELL_SIZE = 20

export default function ConwaysGameOfLife() {
  const [grid, setGrid] = useState<boolean[][]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [generation, setGeneration] = useState(0)
  const [speed, setSpeed] = useState([500])
  const [isDragging, setIsDragging] = useState(false)
  const [dragMode, setDragMode] = useState<"paint" | "erase">("paint")
  const [showRules, setShowRules] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const gridRef = useRef<HTMLDivElement>(null)

  // Calculate grid dimensions based on container size with responsive design
  const getGridDimensions = useCallback(() => {
    const windowHeight = typeof window !== "undefined" ? window.innerHeight : 800
    const windowWidth = typeof window !== "undefined" ? window.innerWidth : 1200

    // Responsive breakpoints
    const isMobile = windowWidth < 768
    const isTablet = windowWidth >= 768 && windowWidth < 1024
    const isDesktop = windowWidth >= 1024

    let containerHeight: number
    let containerWidth: number

    if (isMobile) {
      // Mobile: Stack vertically, smaller grid
      containerHeight = Math.max(windowHeight * 0.3, 250) // Reduced from 0.4 to 0.3 and 300 to 250
      containerWidth = Math.max(windowWidth - 40, 300)
    } else if (isTablet) {
      // Tablet: Medium sized grid
      containerHeight = Math.max(windowHeight - 200, 400)
      containerWidth = Math.max(windowWidth * 0.5, 400)
    } else {
      // Desktop: Larger grid, more square-shaped
      containerHeight = Math.max(windowHeight - 200, 500)
      containerWidth = Math.max(windowHeight - 200, 500) // Make it more square by using height
    }

    // Calculate grid dimensions with bounds
    const rows = Math.max(Math.min(Math.floor(containerHeight / CELL_SIZE), isMobile ? 25 : 40), 8) // Added mobile-specific limit
    const cols = Math.max(Math.min(Math.floor(containerWidth / CELL_SIZE), 40), 10)

    return { rows, cols, isMobile, isTablet, isDesktop }
  }, [])

  // Initialize empty grid with safety checks
  const initializeGrid = useCallback(() => {
    const { rows, cols } = getGridDimensions()

    if (rows <= 0 || cols <= 0 || rows > 100 || cols > 100) {
      console.warn("Invalid grid dimensions, using defaults")
      return Array(15)
        .fill(null)
        .map(() => Array(20).fill(false))
    }

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

          if (isAlive) {
            newGrid[row][col] = neighbors === 2 || neighbors === 3
          } else {
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

  const { isMobile, isTablet } = getGridDimensions()

  if (grid.length === 0) return null

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 lg:p-8 mx-auto">
      <div
        className={`
        relative z-10 w-full max-w-7xl
        ${isMobile ? "flex flex-col gap-6" : "flex items-center justify-center gap-8 lg:gap-16"}
      `}
      >
        {/* Left Control Panel */}
        <div
          className={`
          bg-transparent flex flex-col items-center space-y-4 lg:space-y-6
          ${isMobile ? "w-full order-2" : isTablet ? "w-72" : "w-80"}
        `}
        >
          <div className="text-center">
            <h1 className={`font-bold text-black mb-4 lg:mb-8 ${isMobile ? "text-xl" : "text-2xl"}`}>Game Of Life</h1>
          </div>

          {/* Control Buttons */}
          <div className={`space-y-3 lg:space-y-4 w-full ${isMobile ? "max-w-sm" : "max-w-xs"}`}>
            <Button
              onClick={toggleRunning}
              className={`w-full !bg-black !hover:bg-gray-800 text-white rounded-full font-medium
                ${isMobile ? "h-10 text-base" : "h-12 text-lg"}
              `}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                  Play
                </>
              )}
            </Button>

            <Button
              onClick={clearGrid}
              className={`w-full !bg-black !hover:bg-gray-800 text-white rounded-full font-medium
                ${isMobile ? "h-10 text-base" : "h-12 text-lg"}
              `}
            >
              <RotateCcw className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
              Clear Grid
            </Button>
          </div>

          {/* Speed Slider */}
          <div className={`w-full space-y-2 ${isMobile ? "max-w-sm" : "max-w-xs"}`}>
            <div className="flex justify-between items-center text-sm text-gray-700">
              <span>Slow</span>
              <span>Fast</span>
            </div>
            <div className="relative">
              <Slider
                value={[2100 - speed[0]]}
                onValueChange={(value) => setSpeed([2100 - value[0]])}
                max={2000}
                min={100}
                step={100}
                className="w-full"
              />
            </div>
            <div className="text-center text-xs text-gray-600">{speed[0]}ms</div>
          </div>

          {/* Statistics */}
          <div className={`space-y-2 lg:space-y-3 text-center ${isMobile ? "flex gap-8" : ""}`}>
            <div className={`text-black ${isMobile ? "text-base" : "text-lg"}`}>
              <span className="font-medium">Generations : </span>
              <span className="font-bold">{generation}</span>
            </div>
            <div className={`text-black ${isMobile ? "text-base" : "text-lg"}`}>
              <span className="font-medium">Population : </span>
              <span className="font-bold">{getPopulation(grid)}</span>
            </div>
          </div>

          {/* Info Button with Hover Rules */}
          <div className="relative bg-white">
            <Button
              variant="outline"
              size="icon"
              className="w-10 h-10 rounded-full !border-2 border-black !bg-white !hover:bg-gray-200 !hover:outline-none !focus:outline-none !focus:ring-2 !focus:ring-black !hover:border-transparent" 
              onMouseEnter={() => setShowRules(true)}
              onMouseLeave={() => setShowRules(false)}
            >
              <Info className="!w-8 !h-8 text-black" />
            </Button>

            {showRules && (
              <div
                className={`absolute bg-black text-white p-4 rounded-lg shadow-lg w-64 text-sm z-20
                ${isMobile ? "bottom-12 left-1/2 transform -translate-x-1/2" : "bottom-12 left-1/2 transform -translate-x-1/2"}
              `}
              >
                <h3 className="font-semibold mb-2">Conway's Rules:</h3>
                <ul className="space-y-1 text-xs">
                  <li>• Live cells with 2-3 neighbors survive</li>
                  <li>• Dead cells with exactly 3 neighbors become alive</li>
                  <li>• All other cells die or stay dead</li>
                </ul>
                <div className="mt-2 pt-2 border-t border-gray-600">
                  <p className="text-xs">Click cells to toggle • Drag to paint</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Grid Area */}
        <div className={`flex items-center justify-center ${isMobile ? "order-1" : ""}`}>
          <div
            ref={gridRef}
            className="bg-black rounded-xl lg:rounded-xl overflow-hidden select-none shadow-lg"
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              padding: isMobile ? "12px" : isTablet ? "16px" : "25px",
            }}
          >
            <div className="grid gap-0 h-full w-full overflow-hidden">
              {grid.map((row, rowIndex) => (
                <div key={rowIndex} className="flex">
                  {row.map((cell, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`
                        border border-gray-300 cursor-pointer transition-all duration-75
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
    </div>
  )
}
