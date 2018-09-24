import { Component } from '@angular/core';
import { NavController, ModalController } from 'ionic-angular';
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { EmpresaOptions } from '../../interfaces/empresa-options';
import { UsuarioProvider } from '../../providers/usuario';
import { MapaPage } from '../mapa/mapa';
import { LocalizacionProvider } from '../../providers/localizacion';
import { FavoritoPage } from '../favorito/favorito';

declare var google: any;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  filePathEmpresas: string;
  negociosCollection: AngularFirestoreCollection<EmpresaOptions>;
  empresasEncontradas: EmpresaOptions[];

  constructor(
    public navCtrl: NavController,
    private afs: AngularFirestore,
    public localizacionServicio: LocalizacionProvider,
    public usuarioServicio: UsuarioProvider,
    public modalCtrl: ModalController
  ) {
    this.filePathEmpresas = 'negocios';
    this.negociosCollection = this.afs.collection<EmpresaOptions>(this.filePathEmpresas);
    this.loadNegocios();
  }

  loadNegocios() {
    this.negociosCollection = this.afs.collection<EmpresaOptions>(this.filePathEmpresas, ref => ref.limit(20));
    let read = this.negociosCollection.valueChanges().subscribe(data => {
      this.empresasEncontradas = data.filter(empresa => empresa.id && empresa.id !== 'DIS');
    });

    let miposicion = this.localizacionServicio.getPosicion();
    if (miposicion && miposicion.coords) {
      read.unsubscribe();
      let location = new google.maps.LatLng(miposicion.coords.latitude, miposicion.coords.longitude);
      this.negociosCollection = this.afs.collection<EmpresaOptions>(this.filePathEmpresas);
      this.negociosCollection.valueChanges().subscribe(data => {
        this.empresasEncontradas = data.filter(empresa => empresa.id && empresa.id !== 'DIS');
        this.empresasEncontradas = this.empresasEncontradas.sort((a, b) => {
          let latLnga = a.direccion.latLng;
          let loca = new google.maps.LatLng(latLnga.latitude, latLnga.longitude);
          let latLngb = b.direccion.latLng;
          let locb = new google.maps.LatLng(latLngb.latitude, latLngb.longitude);
          let dista = google.maps.geometry.spherical.computeDistanceBetween(location, loca);
          let distb = google.maps.geometry.spherical.computeDistanceBetween(location, locb);
          if (dista > distb) {
            return 1;
          } else if (dista < distb) {
            return -1;
          } else {
            return 0;
          }
        }).slice(0, 19);
      });
    }
  }

  reservar(idempresa: string) {
    this.navCtrl.push('ServicioPage', {
      idempresa: idempresa
    });
  }

  mapa() {
    this.modalCtrl.create(MapaPage).present();
  }

  favoritos(){
    this.navCtrl.push(FavoritoPage);
  }

}
