import { Document, VectorStoreIndex } from "llamaindex";
import fs from "fs/promises";

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