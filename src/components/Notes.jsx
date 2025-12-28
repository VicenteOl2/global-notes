import { useState,useEffect } from 'react'
import '../App.css'
import { GoogleGenerativeAI } from "@google/generative-ai";

function Notes() {  
  const [notas, setNotas] = useState(() => {
    const guardadas = localStorage.getItem("mis-notas")
    if (guardadas) {
      return JSON.parse(guardadas) // Si hay, recuperamos la partida
    } else {
      return [] // Si no, partida nueva
    }
  })

  const [texto, setTexto] = useState("")
  // Estados para la IA
  const [mostrarIA, setMostrarIA] = useState(false); // Para abrir/cerrar el panel
  const [prompt, setPrompt] = useState("");          // Lo que tú escribes
  const [respuestaIA, setRespuestaIA] = useState("");
  const consultarIA = async () => {
    if (!prompt.trim()) return; 

    setCargando(true);
    setRespuestaIA("");

    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      setRespuestaIA(text);
    } catch (error) {
      console.error("Error IA:", error);
      setRespuestaIA("Ups, intenta con otro nombre de modelo en el código.");
    } finally {
      setCargando(false);
    }
  };
const generarRutina = async () => {
    setCargando(true);
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY);
      
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

      // NUEVO PROMPT: Le pedimos JSON, que es el idioma nativo de las máquinas
      const promptRutina = `
        Actúa como una API JSON. Tu única tarea es generar 3 tareas breves para un estudiante universitario.
        Responde ESTRICTAMENTE con este formato de texto plano (sin markdown, sin json code blocks):
        Tarea 1 /// Tarea 2 /// Tarea 3
        
        Reglas:
        1. NO saludes.
        2. NO uses introducciones como "Aquí tienes".
        3. NO uses negritas ni asteriscos.
        4. Sé breve y directo.
      `;

      const result = await model.generateContent(promptRutina);
      const response = await result.response;
      const text = response.text();

      // Limpiamos por si acaso la IA puso comillas o cosas raras al principio
      const textoLimpio = text.replace(/```/g, '').replace('json', '').trim();

      // Cortamos usando nuestro nuevo separador ///
      const tareasSeparadas = textoLimpio.split('///');

      // Filtramos para quitar espacios vacíos
      const nuevasNotas = tareasSeparadas.map(t => t.trim()).filter(t => t.length > 5).map(tarea => ({
          id: Date.now() + Math.random(),
          texto: tarea,
          completada: false
        }));

      setNotas([...notas, ...nuevasNotas]);
      setRespuestaIA("¡Rutina lista! 😎");

    } catch (error) {
      console.error("Error al generar rutina:", error);
      setRespuestaIA("La IA está rebelde hoy. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  };
  const [cargando, setCargando] = useState(false);   // Para mostrar "Escribiendo..."

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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 text-center mb-8">
          Notas de Vicente 🚀
        </h1>
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
        <ul className="space-y-3">
          {notas.map((nota) => (
            <li 
              key={nota.id} 
              className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg hover:bg-slate-700 transition-colors group"
            >

              <div className="flex items-center gap-3 overflow-hidden">
                <input 
                  type="checkbox" 
                  checked={nota.completada} 
                  onChange={() => toggleCompletada(nota.id)} 
                  className="w-5 h-5 accent-blue-500 cursor-pointer rounded"
                />
                
               <span 
                  className={`break-words w-full ${ 
                    nota.completada 
                      ? 'line-through text-slate-500 decoration-slate-500' 
                      : 'text-slate-100'
                  }`}
                >
                  {nota.texto}
                </span>
              </div>
              <button 
                onClick={() => eliminarNota(nota.id)}
                className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                title="Borrar nota"
              >
                🗑️
              </button>
            </li>
          ))}
          {notas.length === 0 && (
            <p className="text-center text-slate-500 text-sm mt-4">
              No hay tareas pendientes. ¡A descansar! 😴
            </p>
          )}
        </ul>
        {/* --- SEPARADOR --- */}
        <hr className="my-6 border-slate-700" />

        {/* BOTÓN PARA ABRIR LA IA */}
        <button 
          onClick={() => setMostrarIA(!mostrarIA)}
          className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all"
        >
          {mostrarIA ? 'Cerrar Asistente' : '✨ Generador de Ideas IA ✨'}
        </button>

        {/* PANEL DE IA (Solo se ve si mostrarIA es true) */}
        {mostrarIA && (
          <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-purple-500/30 animation-fade-in">
            
            {/* Título del chat */}
            <p className="text-purple-300 text-sm mb-2 font-semibold">
              Pregúntame lo que sea o pídeme ideas:
            </p>
          {/* BOTONES DE ACCIÓN RÁPIDA (AGENTES) */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={generarRutina}
                disabled={cargando}
                className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1 transition-all shadow-lg border border-green-400/30"
              >
                ⚡ Generar Rutina Diaria
              </button>
            </div>
            {/* Input de la IA */}
            <div className="flex gap-2">
              <input 
                type="text" 
                className="w-full p-2 rounded-lg bg-slate-800 text-white border border-slate-700 focus:border-purple-500 outline-none text-sm"
                placeholder="consejos para organizarte mejor"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <button 
                onClick={consultarIA}
                className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-lg"
                disabled={cargando} 
              >
                {cargando ? 'cargando...' : 'Enviar'}
              </button>
            </div>

            {/* Respuesta de la IA */}
            {respuestaIA && (
              <div className="mt-4 p-3 bg-slate-800 rounded-lg border border-slate-700">
                <p className="text-slate-300 text-sm leading-relaxed">
                  {respuestaIA}
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

export default Notes;