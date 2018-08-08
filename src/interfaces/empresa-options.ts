import { ConfiguracionOptions } from "./configuracion-options";

export interface EmpresaOptions {
    id: string,
    nombre: string,
    telefono: string,
    direccion: any,
    imagen: string,
    negocio: string,
    nombreRepresentante: string,
    telefonoRepresentante: string,
    correoRepresentante: string,
    configuracion: ConfiguracionOptions
}