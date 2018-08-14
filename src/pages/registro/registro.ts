import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform, AlertController, ViewController } from 'ionic-angular';
import { AngularFirestoreDocument, AngularFirestore } from 'angularfire2/firestore';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AngularFireAuth } from 'angularfire2/auth';
import { ClienteOptions } from '../../interfaces/cliente-options';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { AngularFireStorage } from 'angularfire2/storage';
import firebase from 'firebase';
import { finalize } from 'rxjs/operators';

/**
 * Generated class for the RegistroPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-registro',
  templateUrl: 'registro.html',
})
export class RegistroPage {

  usuario: ClienteOptions;
  mobile: boolean;
  private usuarioDoc: AngularFirestoreDocument<ClienteOptions>;
  nuevo: boolean = true;
  todo: FormGroup;
  username: string;
  filePathCliente = 'clientes/';

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public plt: Platform,
    private afs: AngularFirestore,
    private formBuilder: FormBuilder,
    private storage: AngularFireStorage,
    private camera: Camera,
    public alertCtrl: AlertController,
    public viewCtrl: ViewController,
    private afa: AngularFireAuth
  ) {
    this.mobile = !plt.is('core');
    this.usuario = this.navParams.get('usuario');
    this.username = this.navParams.get('username');
    this.updateUsuario();
  }

  updateUsuario() {
    if (!this.usuario) {
      this.usuario = {} as ClienteOptions;
      this.usuario.correoelectronico = this.username;
    }
    this.usuarioDoc = this.afs.doc<ClienteOptions>(this.filePathCliente + this.usuario.correoelectronico);
    this.usuarioDoc.valueChanges().subscribe(data => {
      if (data) {
        this.usuario = data;

        this.nuevo = false;

        this.form();
      }
    });

    this.form();
  }

  form() {
    this.todo = this.formBuilder.group({
      id: [this.usuario.id, Validators.required],
      nombre: [this.usuario.nombre, Validators.required],
      telefono: [this.usuario.telefono, Validators.required],
      correoelectronico: [this.usuario.correoelectronico, Validators.required],
      clave: ['', Validators.required],
      rclave: ['', Validators.required],
      imagen: [this.usuario.imagen],
      terminos: [true]
    });
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
      let fileRef = this.storage.ref(this.filePathCliente + this.todo.value.correoelectronico);
      fileRef.putString(imagen, firebase.storage.StringFormat.DATA_URL).then(() => {
        fileRef.getDownloadURL().subscribe(data => {
          this.todo.patchValue({ imagen: data });
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
      let fileRef = this.storage.ref(this.filePathCliente + this.todo.value.correoelectronico);
      fileRef.putString(imagen, firebase.storage.StringFormat.DATA_URL).then(() => {
        fileRef.getDownloadURL().subscribe(data => {
          this.todo.patchValue({ imagen: data });
        });
      });
    }).catch(err => alert('Upload Failed' + err));
  }

  seleccionarImagen(event) {
    let imagen = event.target.files[0];
    let fileRef = this.storage.ref(this.filePathCliente + this.todo.value.correoelectronico);
    let task = this.storage.upload(this.filePathCliente + this.todo.value.correoelectronico, imagen);
    task.snapshotChanges().pipe(
      finalize(() => {
        fileRef.getDownloadURL().subscribe(data => {
          this.todo.patchValue({ imagen: data });
        });
      })
    ).subscribe();
  }

  private almacenar() {
    this.usuarioDoc.set(this.usuario).then(() => {
      let alert = this.nuevo ? this.alertCtrl.create({
        title: 'Usuario registrado',
        message: 'El usuario ha sido registrado exitosamente, se ha enviado un correo eléctronico a tu email para verificar tu usuario.',
        buttons: ['OK']
      }) : this.alertCtrl.create({
        title: 'Usuario actualizado',
        message: 'El usuario ha sido actualizado exitosamente',
        buttons: ['OK']
      });
      alert.present();
      this.viewCtrl.dismiss();
    });
  }

  private registrar() {
    this.usuarioDoc = this.afs.doc<ClienteOptions>(this.filePathCliente + this.usuario.correoelectronico);

    if (this.nuevo) {
      this.usuarioDoc.ref.get().then(data => {
        if (data.exists) {
          this.alertCtrl.create({
            title: 'Usuario ya existe',
            message: 'El correo electrónico con el que intenta registrarte ya se encuentra en nuestro sistema, si tienes problemas para acceder a la aplicación intenta recuperar la clave.',
            buttons: [{
              text: 'Ok',
              handler: () => {
                this.navCtrl.pop();
              }
            }]
          }).present();
        } else {
          this.almacenar();
        }
      });
    } else {
      this.almacenar();
    }
  }

  guardar() {
    let usuario = this.todo.value;
    this.usuario = {
      id: usuario.id,
      nombre: usuario.nombre,
      telefono: usuario.telefono,
      correoelectronico: usuario.correoelectronico,
      imagen: usuario.imagen,
      uid: usuario.uid
    };

    if (this.nuevo) {
      this.afa.auth.createUserWithEmailAndPassword(usuario.correoelectronico, usuario.clave).then(data => {
        if (data) {
          this.usuario.uid = data.user.uid;
          data.user.sendEmailVerification().then(() => {
            this.registrar();
          });
        }
      }).catch(err => this.alertCtrl.create({
        title: 'Nuevo usuario',
        message: err,
        buttons: [{
          text: 'OK',
          role: 'cancel'
        }]
      }).present());
    } else {
      this.registrar();
    }
  }

  cerrar() {
    this.viewCtrl.dismiss();
  }

}
