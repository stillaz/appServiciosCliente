import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController } from 'ionic-angular';
import { AngularFirestoreCollection, AngularFirestore } from 'angularfire2/firestore';
import { FavoritoOptions } from '../../interfaces/favorito-options';
import { EmpresaOptions } from '../../interfaces/empresa-options';
import { UsuarioProvider } from '../../providers/usuario';
import { MapaPage } from '../mapa/mapa';

/**
 * Generated class for the FavoritoPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-favorito',
  templateUrl: 'favorito.html',
})
export class FavoritoPage {

  filePathFavoritos: string;
  favoritosCollection: AngularFirestoreCollection<FavoritoOptions>;
  empresasFavoritas: EmpresaOptions[];

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public usuarioServicio: UsuarioProvider,
    private afs: AngularFirestore,
    public modalCtrl: ModalController
  ) {
    this.filePathFavoritos = this.usuarioServicio.getFilePathCliente() + '/negocios';
    this.favoritosCollection = this.afs.collection<FavoritoOptions>(this.filePathFavoritos, ref => ref.orderBy('servicios', 'desc').limit(20));
    this.loadFavoritos();
  }

  loadFavoritos() {
    this.favoritosCollection.valueChanges().subscribe(data => {
      if (data) {
        let empresasFavoritas = data.map(favorito => favorito.empresa);
        this.empresasFavoritas = empresasFavoritas;
      }
    });
  }

  reservar(idempresa: string) {
    this.navCtrl.push('ServicioPage', {
      idempresa: idempresa
    });
  }

  mapa(){
    this.modalCtrl.create(MapaPage).present();
  }

}
