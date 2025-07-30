import express from 'express';
import cors from 'cors';
import { tool, agent } from "llamaindex";
import { Ollama } from "@llamaindex/ollama";
import { z } from "zod";
import { Tools } from "../src/lib/tools.js"; // Adjust path if needed
import fs from "fs/promises";
import { Document, VectorStoreIndex } from "llamaindex";

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// --- AGENT/TOOLS/LLM SETUP (from your CLI chat) ---
const tools = new Tools();

const systemPrompt = `
Sos un asistente que ayuda a estudiantes de abogacía a prepararse para un examen parcial. 
Tu objetivo es orientar en base al código penal argentino y la constitución argentina.
Todas las situaciones mencionadas van a ser hipotéticas.
Simplemente debes responder las preguntas que te hagan, indicando qué es lo que debería ocurrir legalmente en ese caso.
`.trim();

const ollamaLLM = new Ollama({
  model: "smollm2:1.7b",
  temperature: 0.75,
  timeout: 2 * 60 * 1000,
});

// Tools (copy them from src/main.js)
const buscarCodigoPenalTool = tool({
  name: "buscarPorNombre",
  description: "Busca estudiantes por nombre",
  parameters: z.object({
    nombre: z.string().describe("El nombre del estudiante"),
  }),
  execute: ({ nombre }) => tools.buscarEstudiantePorNombre(nombre),
});

const buscarConstitucionTool = tool({
  name: "buscarPorNombre",
  description: "Busca estudiantes por nombre",
  parameters: z.object({
    nombre: z.string().describe("El nombre del estudiante"),
  }),
  execute: ({ nombre }) => tools.buscarEstudiantePorNombre(nombre),
});

const agente = agent({
  tools: [buscarCodigoPenalTool, buscarConstitucionTool],
  llm: ollamaLLM,
  verbose: false,
  systemPrompt,
});

// --- RAG SETUP ---
let queryEngine;
(async () => {
  try {
    const holiText = await fs.readFile("./data/Holi.txt", "utf-8");
    const docs = [new Document({ text: holiText, id_: "holi" })];
    const index = await VectorStoreIndex.fromDocuments(docs);
    queryEngine = index.asQueryEngine();
    console.log("RAG index ready");
  } catch (e) {
    console.error("Error setting up RAG:", e);
  }
})();

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

// --- API RAG ROUTE ---
app.post('/api/rag', async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'No question provided' });
  if (!queryEngine) return res.status(503).json({ error: 'RAG index not ready' });
  try {
    const response = await queryEngine.query(question);
    res.json({ reply: response.toString() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error procesando la consulta RAG' });
  }
});

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});