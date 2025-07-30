// Gestión de estudiantes
import { readFileSync, writeFileSync } from 'fs';
import { Document, VectorStoreIndex } from "llamaindex";
import fs from "fs/promises";

// const DATA_FILE = './data/alumnos.json';

class Tools {
  constructor() {
    this.estudiantes = [];
    // this.cargarEstudiantesDesdeJson();
    this.queryEngine = null;
    this.ragReady = false;
    this.initRAG();
  }

  async initRAG() {
    try {
      // Leer ambos PDFs y concatenar su texto
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
      const readPdfText = async (filePath) => {
        const data = await fs.readFile(filePath);
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(' ') + '\n';
        }
        return text;
      };
      const codigoPenalText = await readPdfText("./data/CodigoPenal.pdf");
      const constitucionText = await readPdfText("./data/Constitucion.pdf");
      const fullText = codigoPenalText + "\n" + constitucionText;
      const docs = [new Document({ text: fullText, id_: "codigo_constitucion" })];
      const index = await VectorStoreIndex.fromDocuments(docs);
      this.queryEngine = index.asQueryEngine();
      this.ragReady = true;
      console.log("RAG index ready (from Tools, PDF)");
    } catch (e) {
      console.error("Error setting up RAG in Tools (PDF):", e);
    }
  }

  async consultarRAG(question) {
    if (!this.ragReady || !this.queryEngine) {
      throw new Error("RAG index not ready");
    }
    const response = await this.queryEngine.query(question);
    return response.toString();
  }

  /*
  cargarEstudiantesDesdeJson() {
    try {
      const data = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
      this.estudiantes = data.alumnos || [];
    } catch (e) {
      console.error("Error al leer el archivo de datos:", e);
      this.estudiantes = [];
    }
  }

  guardarEstudiantes() {
    try {
      writeFileSync(DATA_FILE, JSON.stringify({ alumnos: this.estudiantes }, null, 2));
      this.cargarEstudiantesDesdeJson();
    } catch (e) {
      console.error("Error al guardar los estudiantes:", e);
      throw new Error("No se pudo guardar la lista de estudiantes.");
    }
  }

  agregarEstudiante(nombre, apellido, curso) {
    // Validación simple
    if (!nombre || !apellido || !curso) {
      throw new Error("Faltan datos para agregar el estudiante.");
    }
    // Check for duplicates
    const exists = this.estudiantes.some(
      e =>
        e.nombre.toLowerCase() === nombre.toLowerCase() &&
        e.apellido.toLowerCase() === apellido.toLowerCase() &&
        e.curso.toLowerCase() === curso.toLowerCase()
    );
    if (exists) {
      throw new Error("El alumno ya existe en la lista.");
    }
    const nuevo = { nombre, apellido, curso };
    this.estudiantes.push(nuevo);
    this.guardarEstudiantes();
    return nuevo;
  }

  buscarEstudiantePorNombre(nombre) {
    return this.estudiantes.filter(e => e.nombre.toLowerCase() === nombre.toLowerCase());
  }

  buscarEstudiantePorApellido(apellido) {
    return this.estudiantes.filter(e => e.apellido.toLowerCase() === apellido.toLowerCase());
  }

  listarEstudiantes() {
    return this.estudiantes;
  }*/
}

export { Tools }