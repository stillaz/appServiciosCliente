import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { ClienteOptions } from '../../interfaces/cliente-options';
import { UsuarioProvider } from '../../providers/usuario';

/**
 * Generated class for the CuentaPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-cuenta',
  templateUrl: 'cuenta.html',
})
export class CuentaPage {

  usuario: ClienteOptions;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private usuarioServicio: UsuarioProvider
  ) {
    this.usuario = this.usuarioServicio.getUsuario();
  }

  perfil(){
    this.navCtrl.push('PerfilPage');
  }
}
