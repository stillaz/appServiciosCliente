import { UsuarioOptions } from "./usuario-options";

export interface DisponibilidadOptions {
  fechaInicio: any,
  fechaFin: any,
  estado: string,
  usuarios: UsuarioOptions[],
  evento: string,
  dentroDe: string
}
