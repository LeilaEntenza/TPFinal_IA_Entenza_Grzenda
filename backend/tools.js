import { Document, VectorStoreIndex, Settings } from "llamaindex";
import fs from "fs/promises";
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

class Tools {
  async initRAG() {
    try {
      console.log("📚 Leyendo documentos...");
      const cp = await fs.readFile("./data/CodigoPenal.txt", "utf-8");
      const cst = await fs.readFile("./data/Constitucion.txt", "utf-8");
      
      console.log(`📖 Código Penal: ${cp.length} caracteres`);
      console.log(`📖 Constitución: ${cst.length} caracteres`);
      
      const fullText = `Código Penal Argentino:\n${cp}\n\nConstitución Nacional Argentina:\n${cst}`;
      const docs = [new Document({ text: fullText })];
      
      console.log("🔧 Configurando embeddings...");
      const embedModel = new XenovaEmbedding();
      Settings.embedModel = embedModel;
      
      console.log("🏗️ Creando índice vectorial...");
      const index = await VectorStoreIndex.fromDocuments(docs);
      this.queryEngine = index.asQueryEngine();
      this.ragReady = true;
      
      console.log("✅ RAG listo con embeddings!");
    } catch (e) {
      console.error("❌ Error inicializando RAG:", e);
      throw e;
    }
  }

  async consultarRAG(pregunta) {
    if (!this.ragReady || !this.queryEngine) {
      throw new Error("RAG aún no está listo.");
    }
    
    console.log(`🔍 Consultando RAG: "${pregunta}"`);
    const resp = await this.queryEngine.query(pregunta);
    console.log(`📝 Respuesta RAG obtenida`);
    return resp.toString();
  }
}

export { Tools };
