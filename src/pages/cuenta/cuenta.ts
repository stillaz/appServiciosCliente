import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform } from 'ionic-angular';
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
    private usuarioServicio: UsuarioProvider,
    public platform: Platform
  ) {
    this.usuario = this.usuarioServicio.getUsuario();
  }

  perfil() {
    this.navCtrl.push('PerfilPage');
  }

  citas(modo: string) {
    this.navCtrl.push('CitaPage', {
      modo: modo
    });
  }

  favoritos(){
    this.navCtrl.push('FavoritoPage');
  }

  salir(){
    this.usuarioServicio.signOut();
    this.platform.exitApp();
  }
}
