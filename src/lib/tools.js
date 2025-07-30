// Gestión de estudiantes
import { readFileSync, writeFileSync } from 'fs';

const DATA_FILE = './data/alumnos.json';

class Tools {
  constructor() {
    this.estudiantes = [];
    this.cargarEstudiantesDesdeJson();
  }
  
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
  }
}

export { Tools }