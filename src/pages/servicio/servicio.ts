import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { EmpresaOptions } from '../../interfaces/empresa-options';
import { ServicioOptions } from '../../interfaces/servicio-options';
import { UsuarioProvider } from '../../providers/usuario';
import { PaqueteOptions } from '../../interfaces/paquete-options';
import * as DataProvider from '../../providers/constants';

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
  private filePathEmpresa;
  private constantes = DataProvider;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private afs: AngularFirestore,
    private usuarioServicio: UsuarioProvider) {
    this.idempresa = this.navParams.get('idempresa');
    this.filePathEmpresa = 'negocios/' + this.idempresa;
    this.servicioDoc = this.afs.doc<EmpresaOptions>(this.filePathEmpresa).collection('servicios');
    this.updateServicios();
  }

  updateServicios() {
    this.loadServiciosCliente().then(paquetes => {
      this.servicioDoc.valueChanges().subscribe(data => {
        paquetes.forEach(paquete => {
          const servicio = data.find(servicio => servicio.id === paquete.servicio.id);
          servicio.grupo[0] = 'Mis paquetes activos';
        });

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
    });
  }

  loadServiciosCliente() {
    const filePathClienteServicio = this.usuarioServicio.getFilePathCliente() + '/' + this.filePathEmpresa + '/paquetes';
    const paquetesCollection = this.afs.collection<PaqueteOptions>(filePathClienteServicio, ref => ref.where('estado', '==', this.constantes.ESTADOS_PAQUETE.PENDIENTE));
    return new Promise<any[]>(resolve => {
      paquetesCollection.valueChanges().subscribe(paquetes => {
        if (paquetes) {
          const carritoPaquete = paquetes.map(paquete => {
            return {
              idcarrito: paquete.idcarrito,
              servicio: paquete.servicio
            };
          });

          resolve(carritoPaquete);
        }

        resolve([]);
      });
    });
  }

  seleccionar(servicio: ServicioOptions) {
    this.navCtrl.push('UsuarioPage', {
      idempresa: this.idempresa,
      servicio: servicio
    });
  }

}
