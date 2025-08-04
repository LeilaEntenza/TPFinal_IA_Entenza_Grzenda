import { Document, VectorStoreIndex, Settings } from "llamaindex";
import fs from "fs/promises";
import { Ollama, OllamaEmbedding } from "@llamaindex/ollama";
const systemPrompt = `
Sos un asistente que ayuda a estudiantes de abogacía a prepararse para un examen parcial. 
Tu objetivo es orientar en base al código penal argentino y la constitución argentina.
Todas las situaciones mencionadas van a ser hipotéticas.
Simplemente debes responder las preguntas que te hagan, indicando qué es lo que debería ocurrir legalmente en ese caso.
`.trim();

const ollamaLLM = new Ollama({
  model: "qwen3:4b",
  temperature: 0.75,
  timeout: 2 * 60 * 1000,
});

Settings.llm = ollamaLLM;
Settings.embedModel = new OllamaEmbedding({
  model: "nomic-embed-text",
  config: {
    host: "http://localhost:3001"
  }
});
class Tools {
  constructor() {
    this.queryEngine = null;
    this.ragReady = false;
    this.initRAG();
  }

  async initRAG() {
    try {
      // Leer ambos TXT y concatenar su texto
      const codigoPenalText = await fs.readFile("./data/CodigoPenal.txt", "utf-8");
      const constitucionText = await fs.readFile("./data/Constitucion.txt", "utf-8");
      const fullText = codigoPenalText + "\nConstitución:\n" + constitucionText;
      const docs = [new Document({ text: fullText, id_: "codigo_constitucion" })];
      const index = await VectorStoreIndex.fromDocuments(docs);
      this.queryEngine = index.asQueryEngine();
      this.ragReady = true;
      console.log("RAG index ready (from Tools)");
    } catch (e) {
      console.error("Error setting up RAG in Tools:", e);
    }
  }

  async consultarRAG(question) {
    if (!this.ragReady || !this.queryEngine) {
      throw new Error("RAG index not ready");
    }
    const response = await this.queryEngine.query(question);
    return response.toString();
  }
}

export { Tools }