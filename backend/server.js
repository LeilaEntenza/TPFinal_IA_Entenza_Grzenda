import express from 'express';
import cors from 'cors';
import { tool, agent } from "llamaindex";
import { Ollama } from "@llamaindex/ollama";
import { z } from "zod";
import { Estudiantes } from "../src/lib/estudiantes.js"; // Adjust path if needed

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// --- AGENT/TOOLS/LLM SETUP (from your CLI chat) ---
const estudiantes = new Estudiantes();

const systemPrompt = `
Sos un asistente para gestionar estudiantes.
Tu tarea es ayudar a consultar o modificar una base de datos de alumnos.
Usá las herramientas disponibles para:
- Buscar estudiantes por nombre o apellido
- Agregar nuevos estudiantes
- Mostrar la lista completa de estudiantes
Respondé de forma clara y breve.
Si hay registros duplicados, eliminalos.
`.trim();

const ollamaLLM = new Ollama({
  model: "qwen3:4b",
  temperature: 0.75,
  timeout: 2 * 60 * 1000,
});

// Tools (copy them from src/main.js)
const buscarPorNombreTool = tool({
  name: "buscarPorNombre",
  description: "Busca estudiantes por nombre",
  parameters: z.object({
    nombre: z.string().describe("El nombre del estudiante"),
  }),
  execute: ({ nombre }) => estudiantes.buscarEstudiantePorNombre(nombre),
});

const buscarPorApellidoTool = tool({
  name: "buscarPorApellido",
  description: "Busca estudiantes por apellido",
  parameters: z.object({
    apellido: z.string().describe("El apellido del estudiante"),
  }),
  execute: ({ apellido }) => estudiantes.buscarEstudiantePorApellido(apellido),
});

const agregarEstudianteTool = tool({
  name: "agregarEstudiante",
  description: "Agrega un estudiante a la base",
  parameters: z.object({
    nombre: z.string().describe("El nombre del estudiante"),
    apellido: z.string().describe("El apellido del estudiante"),
    curso: z.string().describe("El curso del estudiante"),
  }),
  execute: ({ nombre, apellido, curso }) => {
    try {
      estudiantes.agregarEstudiante(nombre, apellido, curso);
      return `El alumno ${nombre}, ${apellido}, ${curso} ha sido agregado correctamente.`;
    } catch (e) {
      // If duplicate or other error, show user-friendly message
      return e.message === "El alumno ya existe en la lista."
        ? "Este alumno ya existe en la lista."
        : "No se pudo agregar el alumno: " + e.message;
    }
  },
});

const listarEstudiantesTool = tool({
  name: "listarEstudiantes",
  description: "Lista todos los estudiantes",
  parameters: z.object({}),
  execute: () => estudiantes.listarEstudiantes(),
});

const agente = agent({
  tools: [buscarPorNombreTool, buscarPorApellidoTool, agregarEstudianteTool, listarEstudiantesTool],
  llm: ollamaLLM,
  verbose: false,
  systemPrompt,
});

// --- API CHAT ROUTE ---
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'No message provided' });

  try {
    let respuesta = await agente.run(message);

    // Remove <think>...</think> blocks and leading/trailing whitespace/newlines
    if (typeof respuesta === "string") {
      respuesta = respuesta.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      // If the response is a JSON string, try to extract a 'result' or similar field
      try {
        const parsed = JSON.parse(respuesta);
        if (parsed && typeof parsed === 'object') {
          // Extraer el texto más humano posible, sin mostrar 'data', 'result', ni JSON
          if (parsed.data && parsed.data.result) {
            respuesta = parsed.data.result;
          } else if (parsed.result) {
            respuesta = parsed.result;
          } else if (parsed.reply) {
            respuesta = parsed.reply;
          } else {
            // Si no hay campo claro, buscar el primer string dentro del objeto
            const firstString = Object.values(parsed).find(v => typeof v === 'string');
            respuesta = firstString || JSON.stringify(parsed, null, 2);
          }
        }
      } catch (e) {
        // Not JSON, keep as is
      }
    } else {
      respuesta = JSON.stringify(respuesta);
    }

    // Limpiar cualquier bloque <think> y espacios extra
    respuesta = respuesta.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    // Si la respuesta sigue pareciendo JSON, intentar extraer solo el texto
    if (/^\{.*\}$/.test(respuesta)) {
      try {
        const parsed = JSON.parse(respuesta);
        if (parsed && typeof parsed === 'object') {
          if (parsed.data && parsed.data.result) {
            respuesta = parsed.data.result;
          } else if (parsed.result) {
            respuesta = parsed.result;
          } else if (parsed.reply) {
            respuesta = parsed.reply;
          } else {
            const firstString = Object.values(parsed).find(v => typeof v === 'string');
            respuesta = firstString || respuesta;
          }
        }
      } catch (e) {
        // keep as is
      }
    }
    // Eliminar saltos de línea iniciales/finales
    respuesta = String(respuesta).trim();

    res.json({ reply: respuesta });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error procesando el mensaje' });
  }
});

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});