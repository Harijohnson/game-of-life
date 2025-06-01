import './App.css'
import  ConwaysGameOfLife  from './game-of-life.tsx'

function App() {

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-100 mx-5 py-3'>  
    <ConwaysGameOfLife />
    </div>
  )
}

export default App
