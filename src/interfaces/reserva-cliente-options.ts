import { ServicioOptions } from "./servicio-options";
import { UsuarioOptions } from "./usuario-options";

export interface ReservaClienteOptions {
    fechaInicio: any,
    fechaFin: any,
    estado: string,
    idcarrito: number,
    servicio: ServicioOptions[],
    usuario: UsuarioOptions
}