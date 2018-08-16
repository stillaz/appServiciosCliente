import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { AngularFirestoreCollection, AngularFirestore } from 'angularfire2/firestore';
import { FavoritoOptions } from '../../interfaces/favorito-options';
import { EmpresaOptions } from '../../interfaces/empresa-options';
import { UsuarioProvider } from '../../providers/usuario';

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
    private afs: AngularFirestore
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
    this.navCtrl.push('AgendaEmpresaPage', {
      idempresa: idempresa
    });
  }

}
