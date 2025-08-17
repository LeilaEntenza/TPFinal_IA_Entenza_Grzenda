import express from 'express';
import cors from 'cors';
import { LLMAgent, Settings } from "llamaindex";
import { Ollama } from "@llamaindex/ollama";
import { z } from "zod";
import { Tools } from "./tools.js";

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

const tools = new Tools();

// Inicializar RAG al arrancar
(async () => {
  try {
    await tools.initRAG();
  } catch (error) {
    console.error("❌ Error inicializando RAG:", error);
  }
})();

const systemPrompt = `
Sos un asistente que ayuda a estudiantes de abogacía a prepararse para un examen parcial. 
Tu objetivo es orientar en base al código penal argentino y la constitución argentina.
Todas las situaciones mencionadas van a ser hipotéticas.
Simplemente debes responder las preguntas que te hagan, indicando qué es lo que debería ocurrir legalmente en ese caso.

IMPORTANTE: Siempre piensa paso a paso antes de responder. Usa el formato <think>...</think> para mostrar tu proceso de pensamiento.
`;

// Configuración de LLM
const llm = new Ollama({
  model: "qwen3:4b",
  temperature: 0.7,
  systemPrompt,
});

// Tool para consultar RAG
const consultarRAGTool = {
  name: "consultarRAG",
  description: "Consulta la constitución y el código penal usando RAG para responder preguntas legales.",
  parameters: {
    question: {
      type: "string",
      description: "La pregunta legal a responder usando la constitución y el código penal"
    }
  },
  execute: async ({ question }) => {
    return await tools.consultarRAG(question);
  },
};

// Crear agente con RAG
const agente = new LLMAgent({
  tools: [consultarRAGTool],
  llm: llm,
  verbose: true, // Mostrar pensamientos
  systemPrompt,
});

// --- API CHAT ROUTE ---
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'No message provided' });

  try {
    console.log('🤔 Pregunta recibida:', message);
    
    // Usar el agente con RAG
    let respuesta = await agente.run(message);
    
    console.log('🧠 Respuesta completa del agente:', respuesta);

    // Extraer pensamientos y respuesta final
    let pensamientos = "";
    let respuestaFinal = respuesta;

    // Buscar bloques <think>...</think>
    const thinkMatches = respuesta.match(/<think>([\s\S]*?)<\/think>/g);
    if (thinkMatches) {
      pensamientos = thinkMatches.map(think => 
        think.replace(/<\/?think>/g, '').trim()
      ).join('\n\n');
      
      // Remover bloques de pensamiento de la respuesta final
      respuestaFinal = respuesta.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    }

    // Limpiar la respuesta final
    if (typeof respuestaFinal === "string") {
      // Si la respuesta es JSON, extraer el contenido
      try {
        const parsed = JSON.parse(respuestaFinal);
        if (parsed && typeof parsed === 'object') {
          if (parsed.data && parsed.data.result) {
            respuestaFinal = parsed.data.result;
          } else if (parsed.result) {
            respuestaFinal = parsed.result;
          } else if (parsed.reply) {
            respuestaFinal = parsed.reply;
          } else {
            const firstString = Object.values(parsed).find(v => typeof v === 'string');
            respuestaFinal = firstString || JSON.stringify(parsed, null, 2);
          }
        }
      } catch (e) {
        // No es JSON, mantener como está
      }
    }

    // Eliminar espacios extra y saltos de línea
    respuestaFinal = String(respuestaFinal).trim();

    res.json({ 
      reply: respuestaFinal,
      thoughts: pensamientos,
      fullResponse: respuesta
    });

  } catch (error) {
    console.error('❌ Error en /api/chat:', error);
    res.status(500).json({ 
      error: 'Error procesando el mensaje: ' + error.message,
      thoughts: "Error al procesar la consulta"
    });
  }
});

// Ruta de prueba
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Backend funcionando correctamente!',
    ragStatus: tools.ragReady ? 'RAG activo' : 'RAG no disponible'
  });
});

// Ruta de estado del RAG
app.get('/rag-status', (req, res) => {
  res.json({ 
    ragReady: tools.ragReady,
    status: tools.ragReady ? 'RAG funcionando' : 'RAG no disponible'
  });
});

app.listen(3001, () => {
  console.log('✅ Backend funcionando en http://localhost:3001');
  console.log('🧠 Agente con RAG configurado');
  console.log('📚 Leyendo documentos de código penal y constitución...');
});