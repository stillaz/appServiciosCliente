import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, ViewController } from 'ionic-angular';
import { UsuarioOptions } from '../../interfaces/usuario-options';
import { ServicioOptions } from '../../interfaces/servicio-options';
import { AngularFirestoreCollection, AngularFirestore } from 'angularfire2/firestore';
import { EmpresaOptions } from '../../interfaces/empresa-options';

/**
 * Generated class for the UsuarioPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-usuario',
  templateUrl: 'usuario.html',
})
export class UsuarioPage {

  servicio: ServicioOptions;
  usuarios: UsuarioOptions[];
  usuariosCollection: AngularFirestoreCollection<UsuarioOptions>;
  idempresa: string;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public alertCtrl: AlertController,
    public viewCtrl: ViewController,
    private afs: AngularFirestore
  ) {
    this.servicio = this.navParams.get('servicio');
    this.idempresa = this.navParams.get('idempresa');
    const filePathEmpresa = 'negocios/' + this.idempresa;
    const empresaDoc = this.afs.doc<EmpresaOptions>(filePathEmpresa);
    this.usuariosCollection = empresaDoc.collection('/usuarios/', ref => ref.orderBy('nombre'));
    this.updateUsuarios();
  }

  updateUsuarios() {
    this.usuariosCollection.valueChanges().subscribe(data => {
      this.usuarios = data.filter(usuario => usuario.perfiles.some(perfil => {
        if (perfil.servicios) {
          return perfil.servicios.some(servicioUsuario => servicioUsuario.id === this.servicio.id);
        }
      }));
    });
  }

  seleccionar(usuario: UsuarioOptions) {
    this.navCtrl.push('AgendaEmpresaPage', {
      idusuario: usuario.id,
      idempresa: this.idempresa,
      servicio: this.servicio
    });
  }

}
