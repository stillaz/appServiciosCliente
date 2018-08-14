import { Injectable } from '@angular/core';
import { ClienteOptions } from '../interfaces/cliente-options';

/*
  Generated class for the EmpresaProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class UsuarioProvider {

  private usuario: ClienteOptions;

  constructor() { }

  getUsuario() {
    return this.usuario;
  }

  setUsuario(usuario: ClienteOptions) {
    this.usuario = usuario;
  }

  getFilePathCliente() {
    return 'clientes/' + this.usuario.correoelectronico;
  }

}
