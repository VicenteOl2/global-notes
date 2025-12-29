import { useState, useEffect, useCallback } from 'react' // 👈 Importamos useCallback
import { GoogleGenerativeAI } from "@google/generative-ai";

function Notes({ session, supabase }) {  
  const [notas, setNotas] = useState([])
  const [texto, setTexto] = useState("")
  
  // Estados para la IA
  const [mostrarIA, setMostrarIA] = useState(false);
  const [prompt, setPrompt] = useState("");          
  const [respuestaIA, setRespuestaIA] = useState("");
  const [cargando, setCargando] = useState(false);   

  // 1. Consulta que trae las notas desde Supabase
  const fetchNotas = useCallback(async () => {
    const { data } = await supabase
      .from('notas')
      .select('*')
      .eq('user_id', session.user.id)
      .order('id', { ascending: false })

    if (data) setNotas(data) 
  }, [session, supabase])

  // 2. EFECTO: Cargar notas al iniciar
  useEffect(() => {
    fetchNotas()
  }, [fetchNotas])

  // 3. AGREGAR NOTA (A LA NUBE)
  const agregarNota = async (e) => {
    if (e) e.preventDefault()
    if (!texto.trim()) return 

    await supabase
      .from('notas')
      .insert([{ texto: texto, user_id: session.user.id }])
    
    setTexto("")
    fetchNotas() // Recargar lista
  }

  // 4. COMPLETAR / DESCOMPLETAR (EN LA NUBE)
  const toggleCompletada = async (id, estadoActual) => {
    // Ya no usamos map local, le decimos a Supabase que actualice
    await supabase
      .from('notas')
      .update({ completada: !estadoActual })
      .eq('id', id)
    
    fetchNotas() // Recargar para ver el cambio
  }

  // 5. ELIMINAR NOTA (EN LA NUBE)
  const eliminarNota = async (id) => {
    await supabase.from('notas').delete().eq('id', id)
    fetchNotas()
  }

  // 6. IA: CHAT GENERAL
  const consultarIA = async () => {
    if (!prompt.trim()) return; 
    setCargando(true);
    setRespuestaIA("");

    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Actualizado a flash
      const result = await model.generateContent(prompt);
      const response = await result.response;
      setRespuestaIA(response.text());
    } catch (error) {
      console.error("Error IA:", error);
      setRespuestaIA("Error al conectar con la IA.");
    } finally {
      setCargando(false);
    }
  };

  // 7. IA: GENERAR RUTINA (Y GUARDARLA EN BD)
  // 7. IA: GENERAR RUTINA MEJORADA (Versión Robusta)
  const generarRutina = async () => {
    setCargando(true);
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Usamos 1.5 que es muy estable

      // Prompt más claro para evitar errores de formato
      const promptRutina = `
        Genera 3 tareas breves para un estudiante universitario de informática.
        Responde SOLO con una lista simple, una tarea por línea, empezando con un guion (-).
        Ejemplo:
        - Repasar SQL
        - Caminar 20 min
        - Dormir temprano
      `;

      const result = await model.generateContent(promptRutina);
      const text = result.response.text();
      
      console.log("Respuesta IA:", text); // Para ver en consola (F12) qué respondió

      // Separamos por líneas (enter) en vez de símbolos raros
      const lineas = text.split('\n');
      let contador = 0;
      let textoParaMostrar = "";

      for (const linea of lineas) {
        // Limpiamos guiones, asteriscos y espacios
        const tareaLimpia = linea.replace(/^[-*•]\s*/, '').trim();

        if (tareaLimpia.length > 3) {
            // Guardamos en Supabase
            const { error } = await supabase.from('notas').insert([
                { texto: tareaLimpia, user_id: session.user.id, completada: false }
            ]);
            
            if (!error) {
                contador++;
                textoParaMostrar += `✅ ${tareaLimpia}\n`;
            }
        }
      }

      // Refrescamos la lista visual
      fetchNotas(); 

      // Feedback real al usuario
      if (contador > 0) {
          setRespuestaIA(`¡Listo! Agregué estas ${contador} tareas:\n\n${textoParaMostrar}`);
      } else {
          setRespuestaIA("La IA respondió, pero no pude detectar tareas válidas. Intenta de nuevo.");
      }

    } catch (error) {
      console.error("Error rutina:", error);
      setRespuestaIA("Hubo un error al conectar con la IA.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
        
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 text-center mb-8">
          Notas de Vicente 🚀
        </h1>

        {/* INPUT */}
        <div className="flex gap-2 mb-8">
            <input 
              type="text" 
              className="w-full p-3 rounded-lg bg-slate-700 text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="¿Qué vamos a hacer hoy?"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && agregarNota(e)}
            />
            <button 
              onClick={agregarNota}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg"
            >
              +
            </button>
        </div>

        {/* LISTA DE NOTAS */}
        <ul className="space-y-3">
          {notas.map((nota) => (
            <li key={nota.id} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg hover:bg-slate-700 transition-colors group">
              <div className="flex items-center gap-3 overflow-hidden">
                <input 
                  type="checkbox" 
                  checked={nota.completada} 
                  // 👇 IMPORTANTE: Pasamos el estado actual para invertirlo
                  onChange={() => toggleCompletada(nota.id, nota.completada)} 
                  className="w-5 h-5 accent-blue-500 cursor-pointer rounded"
                />
                <span className={`break-words w-full ${nota.completada ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                  {nota.texto}
                </span>
              </div>
              <button 
                onClick={() => eliminarNota(nota.id)}
                className="text-red-400 hover:text-red-300 p-2 opacity-0 group-hover:opacity-100 transition-all"
              >
                🗑️
              </button>
            </li>
          ))}
          {notas.length === 0 && (
            <p className="text-center text-slate-500 text-sm mt-4">Lista vacía. ¡Agrega algo! 😴</p>
          )}
        </ul>

        <hr className="my-6 border-slate-700" />

        {/* BOTÓN IA */}
        <button 
          onClick={() => setMostrarIA(!mostrarIA)}
          className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg shadow-lg"
        >
          {mostrarIA ? 'Cerrar Asistente' : '✨ Generador de Ideas IA ✨'}
        </button>

        {/* PANEL IA */}
        {mostrarIA && (
          <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-purple-500/30">
             <div className="flex gap-2 mb-4">
              <button
                onClick={generarRutina}
                disabled={cargando}
                className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 px-3 rounded-lg w-full"
              >
                ⚡ Generar Rutina Diaria
              </button>
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                className="w-full p-2 rounded-lg bg-slate-800 text-white border border-slate-700 text-sm"
                placeholder="Pregunta algo..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <button 
                onClick={consultarIA}
                disabled={cargando}
                className="bg-purple-600 text-white p-2 rounded-lg text-sm"
              >
                Enviar
              </button>
            </div>

            {respuestaIA && (
              <div className="mt-4 p-3 bg-slate-800 rounded-lg border border-slate-700 text-slate-300 text-sm">
                {respuestaIA}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

export default Notes;