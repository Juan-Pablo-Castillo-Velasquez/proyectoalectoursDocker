import { apiFetch } from "../api/v1/api";

export interface ContactoRequest {
  nombre: string;
  correo: string;
  asunto: string;
  mensaje: string;
}

export interface ContactoResponse {
  ok: boolean;
  message: string;
}

export const contactoService = {
  enviar: (data: ContactoRequest) =>
    apiFetch<ContactoResponse>("/contacto", { method: "POST", body: data }),
};
