import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { UsuarioProvider } from '../../providers/usuario';
import { ClienteOptions } from '../../interfaces/cliente-options';
import { CameraOptions, Camera } from '@ionic-native/camera';
import firebase from 'firebase';
import { AngularFireStorage } from 'angularfire2/storage';
import { AngularFirestoreDocument, AngularFirestore } from 'angularfire2/firestore';
import { UsuarioOptions } from '../../interfaces/usuario-options';

/**
 * Generated class for the PerfilPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-perfil',
  templateUrl: 'perfil.html',
})
export class PerfilPage {

  usuario: ClienteOptions;
  camera: Camera;
  storage: AngularFireStorage;
  usuarioDoc: AngularFirestoreDocument<UsuarioOptions>;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private usuarioServicio: UsuarioProvider,
    private afs: AngularFirestore,
    public alertCtrl: AlertController
  ) {
    this.usuario = this.usuarioServicio.getUsuario();
    this.usuarioDoc = this.afs.doc(this.usuarioServicio.getFilePathCliente());
  }

  sacarFoto() {
    let cameraOptions: CameraOptions = {
      quality: 50,
      encodingType: this.camera.EncodingType.JPEG,
      targetWidth: 1000,
      targetHeight: 1000,
      destinationType: this.camera.DestinationType.DATA_URL,
      sourceType: this.camera.PictureSourceType.CAMERA,
      correctOrientation: true
    }

    this.camera.getPicture(cameraOptions).then((imageData) => {
      let imagen = "data:image/jpeg;base64," + imageData;
      let fileRef = this.storage.ref(this.usuarioServicio.getFilePathCliente());
      fileRef.putString(imagen, firebase.storage.StringFormat.DATA_URL).then(() => {
        fileRef.getDownloadURL().subscribe(data => {
          this.usuario.imagen = data;
          this.usuarioDoc.update({ imagen: this.usuario.imagen });
        });
      });
    }).catch(err => alert('Upload Failed' + err));
  }

  cargarImagen() {
    let cameraOptions: CameraOptions = {
      quality: 50,
      encodingType: this.camera.EncodingType.JPEG,
      destinationType: this.camera.DestinationType.DATA_URL,
      sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
      mediaType: this.camera.MediaType.PICTURE,
      correctOrientation: true
    }

    this.camera.getPicture(cameraOptions).then((imageData) => {
      let imagen = "data:image/jpeg;base64," + imageData;
      let fileRef = this.storage.ref(this.usuarioServicio.getFilePathCliente());
      fileRef.putString(imagen, firebase.storage.StringFormat.DATA_URL).then(() => {
        fileRef.getDownloadURL().subscribe(data => {
          this.usuario.imagen = data;
          this.usuarioDoc.update({ imagen: this.usuario.imagen });
        });
      });
    }).catch(err => alert('Upload Failed' + err));
  }

  imagen() {
    this.alertCtrl.create({
      title: 'Tu imagen',
      buttons: [{
        text: 'Selecciona una imagen',
        handler: () => {
          this.cargarImagen();
        }
      }, {
        text: 'Tomáte una foto',
        handler: () => {
          this.sacarFoto();
        }
      }, {
        text: 'Cancelar',
        role: 'cancel'
      }]
    }).present();
  }

  nombre() {
    this.alertCtrl.create({
      title: 'Tu nombre',
      message: 'Escribe aquí tu nombre.',
      inputs: [{
        name: 'nombre',
        type: 'text',
        max: 100,
        value: this.usuario.nombre
      }],
      buttons: [{
        text: 'Cancelar',
        role: 'cancel'
      }, {
        text: 'Guardar',
        handler: data => {
          this.usuario.nombre = data.nombre;
          this.usuarioDoc.update({ nombre: this.usuario.nombre });
        }
      }]
    }).present();
  }

  telefono() {
    this.alertCtrl.create({
      title: 'Tu número de celular',
      message: 'Escribe aquí tu número de celular.',
      inputs: [{
        name: 'telefono',
        type: 'text',
        max: 10,
        value: this.usuario.telefono
      }],
      buttons: [{
        text: 'Cancelar',
        role: 'cancel'
      }, {
        text: 'Guardar',
        handler: data => {
          this.usuario.telefono = data.telefono;
          this.usuarioDoc.update({ telefono: this.usuario.telefono });
        }
      }]
    }).present();
  }

}
