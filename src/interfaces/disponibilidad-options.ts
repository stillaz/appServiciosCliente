import { UsuarioOptions } from "./usuario-options";

export interface DisponibilidadOptions {
  fechaInicio: any,
  fechaFin: any,
  estado: string,
  evento: string,
  usuarios: UsuarioOptions[]
}
