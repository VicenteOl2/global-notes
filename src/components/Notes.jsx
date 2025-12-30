import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";

// COMPONENTE ACORDEÓN (Fuera del principal para optimizar rendimiento)
const Acordeon = ({ titulo, children }) => {
  const [abierto, setAbierto] = useState(true);

  return (
    <div className="mb-4 overflow-hidden rounded-lg border border-slate-700 bg-slate-800/50">
      <button
        onClick={() => setAbierto(!abierto)}
        className="flex w-full items-center justify-between bg-slate-700/50 p-3 text-left transition-colors hover:bg-slate-700"
      >
        <span className="font-semibold text-slate-200">{titulo}</span>
        <span className="text-slate-400">{abierto ? '➖' : '➕'}</span>
      </button>
      {abierto && <div className="p-2">{children}</div>}
    </div>
  );
};

// COMPONENTE PRINCIPAL
function Notes({ session, supabase }) {  
  const correo = session?.user?.email || "Usuario";
  const nombreUsuario = correo.split('@')[0];
  
  const nombreFinal = nombreUsuario.charAt(0).toUpperCase() + nombreUsuario.slice(1);
  const [notas, setNotas] = useState([]);
  const [texto, setTexto] = useState("");
  
  // --- NUEVOS ESTADOS PARA CATEGORÍAS ---
  const [categoriasDisponibles, setCategoriasDisponibles] = useState(["General"]); // Lista maestra
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("General"); // Selección actual
  const [nuevaCategoriaInput, setNuevaCategoriaInput] = useState(""); // Input para crear nueva

  // Estados para la IA
  const [mostrarIA, setMostrarIA] = useState(false);
  const [prompt, setPrompt] = useState("");          
  const [respuestaIA, setRespuestaIA] = useState("");
  const [cargando, setCargando] = useState(false);   

  // 1. CARGAR NOTAS
  const fetchNotas = useCallback(async () => {
    const { data } = await supabase
      .from('notas')
      .select('*')
      .eq('user_id', session.user.id)
      .order('id', { ascending: false });

    if (data) {
      setNotas(data);
      
      // Lógica Inteligente: Extraer categorías que ya existen en la BD
      const categoriasDeBD = [...new Set(data.map(n => n.categoria || "General"))];
      // Unimos las de la BD con las que tengamos por defecto, sin repetir
      setCategoriasDisponibles(prev => [...new Set([...prev, ...categoriasDeBD])]);
    }
  }, [session, supabase]);

  useEffect(() => {
    fetchNotas();
  }, [fetchNotas]);

  // --- FUNCIÓN PARA CREAR CATEGORÍA ---
  const handleCrearCategoria = () => {
    const nombreLimpio = nuevaCategoriaInput.trim();
    if (nombreLimpio && !categoriasDisponibles.includes(nombreLimpio)) {
      setCategoriasDisponibles([...categoriasDisponibles, nombreLimpio]);
      setCategoriaSeleccionada(nombreLimpio); // La seleccionamos automáticamente
      setNuevaCategoriaInput(""); // Limpiamos el input
    }
  };

  // 3. AGREGAR NOTA (Ahora con categoría)
  const agregarNota = async (e) => {
    if (e) e.preventDefault();
    if (!texto.trim()) return; 

    const { error } = await supabase
      .from('notas')
      .insert([{ 
        texto: texto, 
        user_id: session.user.id,
        categoria: categoriaSeleccionada // 👈 Guardamos la relación
      }]);
    
    if (!error) {
      setTexto("");
      fetchNotas(); 
    } else {
      console.error("Error al guardar:", error);
      alert("Error: ¿Creaste la columna 'categoria' en Supabase?");
    }
  }

  // 4. COMPLETAR / DESCOMPLETAR
  const toggleCompletada = async (id, estadoActual) => {
    await supabase
      .from('notas')
      .update({ completada: !estadoActual })
      .eq('id', id);
    fetchNotas(); 
  }

  // 5. ELIMINAR NOTA
  const eliminarNota = async (id) => {
    await supabase.from('notas').delete().eq('id', id);
    fetchNotas();
  }

// 6. IA: LIBERTAD (Pero con Formato Estricto)
  const crearTareasDesdePrompt = async () => {
    if (!prompt.trim()) return; 
    setCargando(true);
    setRespuestaIA(""); 

    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Asegúrate de usar 1.5

      // 🧠 EL TRUCO: Le pegamos una instrucción técnica al final de TU pedido.
      // El usuario no lo ve, pero la IA sí.
      const promptConFormato = `
        ${prompt}
        
        ---
        INSTRUCCIONES DE FORMATO OBLIGATORIAS:
        1. Responde ÚNICAMENTE con una lista de tareas cortas.
        2. NO incluyas saludos, introducciones ("Claro, aquí tienes..."), ni despedidas.
        3. NO uses negritas (**texto**) ni formatos raros.
        4. Cada tarea debe ser una línea nueva.
        5. Máximo 10 palabras por tarea.
      `;

      const result = await model.generateContent(promptConFormato);
      const text = result.response.text();
      
      const lineas = text.split('\n');
      let contador = 0;

      for (const linea of lineas) {
        // Limpiamos cualquier símbolo que la IA haya puesto (guiones, números, puntos)
        const tareaLimpia = linea.replace(/^[-*•\d]+\.?\s*/, '').replace(/\*\*/g, '').trim();

        // Filtramos: Solo si tiene texto y no parece una frase de despedida
        if (tareaLimpia.length > 2 && !tareaLimpia.includes("suerte") && !tareaLimpia.includes(":")) {
            await supabase.from('notas').insert([{ 
                texto: tareaLimpia, 
                user_id: session.user.id, 
                completada: false,
                categoria: categoriaSeleccionada 
            }]);
            contador++;
        }
      }

      fetchNotas(); 
      setPrompt(""); 
      setRespuestaIA(`🤖 ¡Listo! Se crearon ${contador} tareas concretas.`);

    } catch (error) {
      console.error("Error IA:", error);
      setRespuestaIA("Error al conectar.");
    } finally {
      setCargando(false);
    }
  };
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
        
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 text-center mb-6">
          Notas de {nombreFinal} 🚀
        </h1>

        {/* --- PANEL DE CATEGORÍAS --- */}
        <div className="mb-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
          <label className="text-xs text-blue-300 font-bold uppercase mb-2 block">1. Selecciona o Crea Categoría:</label>
          
          <div className="flex flex-col gap-3">
            {/* Selector */}
            <select 
              value={categoriaSeleccionada}
              onChange={(e) => setCategoriaSeleccionada(e.target.value)}
              className="w-full p-2 bg-slate-800 text-white rounded border border-slate-600 outline-none focus:border-blue-500"
            >
              {categoriasDisponibles.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Creador */}
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="Nueva categoría..."
                value={nuevaCategoriaInput}
                onChange={(e) => setNuevaCategoriaInput(e.target.value)}
                className="flex-1 p-2 bg-slate-800 text-sm text-white rounded border border-slate-600 outline-none"
              />
              <button 
                onClick={handleCrearCategoria}
                className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-sm font-bold transition-colors"
              >
                + Crear
              </button>
            </div>
          </div>
        </div>

        {/* --- INPUT DE TAREA --- */}
        <div className="flex gap-2 mb-8">
            <input 
              type="text" 
              className="w-full p-3 rounded-lg bg-slate-700 text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder={`Tarea para "${categoriaSeleccionada}"...`}
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

        {/* --- LISTA DE NOTAS (Con Acordeones) --- */}
        <div className="space-y-2">
          {categoriasDisponibles.map(cat => {
            // Filtramos las notas de esta categoría
            const notasDeCategoria = notas.filter(n => (n.categoria || "General") === cat);
            
            // Solo mostramos el acordeón si tiene notas O si es la categoría activa actualmente
            if (notasDeCategoria.length === 0 && cat !== categoriaSeleccionada) return null;

            return (
              <Acordeon key={cat} titulo={`${cat} (${notasDeCategoria.length})`}>
                {notasDeCategoria.length === 0 ? (
                  <p className="text-slate-500 text-sm italic p-2">Sin tareas aún...</p>
                ) : (
                  <ul className="space-y-2">
                    {notasDeCategoria.map((nota) => (
                      <li key={nota.id} className="flex items-center justify-between bg-slate-900 p-3 rounded hover:bg-black/20 transition-colors group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <input 
                            type="checkbox" 
                            checked={nota.completada} 
                            onChange={() => toggleCompletada(nota.id, nota.completada)} 
                            className="w-4 h-4 accent-blue-500 cursor-pointer"
                          />
                          <span className={`text-sm break-words w-full ${nota.completada ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                            {nota.texto}
                          </span>
                        </div>
                        <button 
                          onClick={() => eliminarNota(nota.id)}
                          className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                        >
                          🗑️
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Acordeon>
            );
          })}
          
          {notas.length === 0 && (
            <p className="text-center text-slate-500 text-sm mt-4">Lista vacía. ¡Agrega algo! 😴</p>
          )}
        </div>

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
            <div className="flex gap-2">
              <input 
                type="text" 
                className="w-full p-2 rounded-lg bg-slate-800 text-white border border-slate-700 text-sm outline-none focus:border-purple-500"
                placeholder="Escribe aquí (ej: 'Rutina de pesas para hombro')..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && crearTareasDesdePrompt()}
              />
              <button 
                onClick={crearTareasDesdePrompt}
                disabled={cargando}
                className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-lg text-sm font-bold min-w-[80px] transition-all"
              >
                {cargando ? '🤖...' : 'Enviar'}
              </button>
            </div>

            {respuestaIA && (
              <div className="mt-4 p-3 bg-slate-800 rounded-lg border border-slate-700 text-slate-300 text-sm whitespace-pre-wrap">
                {respuestaIA}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default Notes;