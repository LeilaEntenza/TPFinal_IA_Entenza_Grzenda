import axios from "axios";

const API_URL = "http://localhost:3001"; // Cambia el puerto si tu backend expone otro

export const listarEstudiantes = () => axios.get(`${API_URL}/estudiantes`);
export const agregarEstudiante = (data) => axios.post(`${API_URL}/estudiantes`, data);
export const buscarPorNombre = (nombre) => axios.get(`${API_URL}/estudiantes?nombre=${nombre}`);
export const buscarPorApellido = (apellido) => axios.get(`${API_URL}/estudiantes?apellido=${apellido}`);