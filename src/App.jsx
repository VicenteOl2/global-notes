import { useState,useEffect } from 'react'
import './App.css'

function App() {
  const [notas, setNotas] = useState(() => {
    const guardadas = localStorage.getItem("mis-notas")
    if (guardadas) {
      return JSON.parse(guardadas) // Si hay, recuperamos la partida
    } else {
      return [] // Si no, partida nueva
    }
  })

  const [texto, setTexto] = useState("")

  useEffect(() => {
    localStorage.setItem("mis-notas", JSON.stringify(notas))
  }, [notas])

  const agregarNota = () => {
    if (!texto) return 
    
    const objetoNota = { 
      id: Date.now(),   // Usamos la hora como "pk"
      texto: texto, 
      completada: false // asi dejamos el checkbox sin tickear
    }
    const nuevasNotas = [...notas, objetoNota] 
    setNotas(nuevasNotas)
    setTexto("")
  }
  const toggleCompletada = (id) => {
    const nuevasNotas = notas.map((nota) => {
      if (nota.id === id) {
        //creamos una copia de ella pero invirtiendo su valor de "completada"
        return { ...nota, completada: !nota.completada }
      }
      // Si no es la que buscamos, la dejamos igual
      return nota
    })
    
    setNotas(nuevasNotas)
  }
  const eliminarNota = (id) => {
    const nuevasNotas = notas.filter((nota) => nota.id !== id) //si i es == al indice no lo incluye en la nuevasNotas
    setNotas(nuevasNotas)
  }
return (
    // 1. FONDO DE PANTALLA COMPLETA (Gris oscuro y centrado)
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      
      {/* 2. LA TARJETA PRINCIPAL (Gris un poco más claro, sombra, bordes redondos) */}
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
        
        {/* TÍTULO */}
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 text-center mb-8">
          Notas de Vicente 🚀
        </h1>

        {/* INPUT Y BOTÓN AGREGAR */}
        <div className="flex gap-2 mb-8">
            <input 
              type="text" 
              className="w-full p-3 rounded-lg bg-slate-700 text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="¿Qué vamos a hacer hoy?"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && agregarNota()}
            />
            <button 
              onClick={agregarNota}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-blue-500/30 active:scale-95"
            >
              +
            </button>
        </div>

        {/* LISTA DE NOTAS */}
        <ul className="space-y-3">
          {notas.map((nota) => (
            <li 
              key={nota.id} 
              className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg hover:bg-slate-700 transition-colors group"
            >
              {/* Parte Izquierda: Checkbox y Texto */}
              <div className="flex items-center gap-3 overflow-hidden">
                <input 
                  type="checkbox" 
                  checked={nota.completada} 
                  onChange={() => toggleCompletada(nota.id)} 
                  className="w-5 h-5 accent-blue-500 cursor-pointer rounded"
                />
                
                <span 
                  className={`truncate ${
                    nota.completada 
                      ? 'line-through text-slate-500 decoration-slate-500' 
                      : 'text-slate-100'
                  }`}
                >
                  {nota.texto}
                </span>
              </div>

              {/* Botón Borrar (Solo aparece al pasar el mouse gracias a 'group-hover') */}
              <button 
                onClick={() => eliminarNota(nota.id)}
                className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                title="Borrar nota"
              >
                🗑️
              </button>
            </li>
          ))}
          
          {/* Un mensajito si no hay notas */}
          {notas.length === 0 && (
            <p className="text-center text-slate-500 text-sm mt-4">
              No hay tareas pendientes. ¡A descansar! 😴
            </p>
          )}
        </ul>

      </div>
    </div>
  )
}

export default App