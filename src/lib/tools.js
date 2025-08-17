import { Document, VectorStoreIndex, Settings } from "llamaindex";
import fs from "fs/promises";

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
