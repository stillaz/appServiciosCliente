import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { EmpresaOptions } from '../../interfaces/empresa-options';
import { ServicioOptions } from '../../interfaces/servicio-options';

/**
 * Generated class for the ServicioPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-servicio',
  templateUrl: 'servicio.html',
})
export class ServicioPage {
  private idempresa;
  private servicioDoc: AngularFirestoreCollection<ServicioOptions>;
  public servicios: any[];

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private afs: AngularFirestore) {
    this.idempresa = this.navParams.get('idempresa');
    const filePathEmpresa = 'negocios/' + this.idempresa;
    this.servicioDoc = this.afs.doc<EmpresaOptions>(filePathEmpresa).collection('servicios');
    this.updateServicios();
  }

  updateServicios() {
    this.servicioDoc.valueChanges().subscribe(data => {
      this.servicios = [];
      let grupos: any[] = [];
      data.forEach(servicio => {
        if (!grupos[servicio.grupo[0]]) {
          grupos[servicio.grupo[0]] = [];
        }
        grupos[servicio.grupo[0]].push(servicio);
      });

      for (let grupo in grupos) {
        this.servicios.push({ grupo: grupo, servicios: grupos[grupo] });
      }
    });
  }

  seleccionar(servicio: ServicioOptions) {
    this.navCtrl.push('UsuarioPage', {
      idempresa: this.idempresa,
      servicio: servicio
    });
  }

}
