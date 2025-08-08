import { Document, VectorStoreIndex, Settings } from "llamaindex";
import fs from "fs/promises";
import { Ollama } from "@llamaindex/ollama";
import { pipeline } from "@xenova/transformers";

// Clase para embeddings usando Transformers.js
class XenovaEmbedding {
  constructor() {
    this.extractorPromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }

  async getTextEmbedding(text) {
    const extractor = await this.extractorPromise;
    const output = await extractor(text, { pooling: "mean", normalize: true });
    return Array.from(output.data);
  }

  async getTextEmbeddings(texts) {
    const extractor = await this.extractorPromise;
    const outputs = await Promise.all(texts.map(t => extractor(t, { pooling: "mean", normalize: true })));
    return outputs.map(o => Array.from(o.data));
  }
}

// Prompt del sistema
const systemPrompt = `
Sos un asistente que ayuda a estudiantes de abogacía a prepararse para un examen parcial. 
Tu objetivo es orientar en base al Código Penal Argentino y la Constitución Argentina.
Todas las situaciones mencionadas van a ser hipotéticas.
Simplemente debés responder las preguntas que te hagan, indicando qué es lo que debería ocurrir legalmente en ese caso.
`.trim();

// Configuración de LLM y embeddings
Settings.llm = new Ollama({
  model: "qwen3:8b",
  temperature: 0.7,
  systemPrompt,
});
Settings.embedModel = new XenovaEmbedding();

class Tools {
  async initRAG() {
    try {
      console.log("Leyendo documentos...");
      const cp = await fs.readFile("./data/CodigoPenal.txt", "utf-8");
      const cst = await fs.readFile("./data/Constitucion.txt", "utf-8");
      const fullText = `Código Penal:\n${cp}\n\nConstitución:\n${cst}`;
      const docs = [new Document({ text: fullText })];
      console.log("Creando índice...");
      const index = await VectorStoreIndex.fromDocuments(docs);
      this.queryEngine = index.asQueryEngine();
      this.ragReady = true;
      console.log("✅ RAG listo.");
    } catch (e) {
      console.error("Error inicializando RAG:", e);
    }
  }

  async consultarRAG(pregunta) {
    if (!this.ragReady || !this.queryEngine) {
      throw new Error("RAG aún no está listo.");
    }
    const resp = await this.queryEngine.query(pregunta);
    return resp.toString();
  }
}

export { Tools };
