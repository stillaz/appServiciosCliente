import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, LoadingController } from 'ionic-angular';
import { AngularFireAuth } from 'angularfire2/auth';
import { LoginOptions } from '../../interfaces/login-options';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HomePage } from '../home/home';
import firebase from 'firebase';
import { Platform } from 'ionic-angular/platform/platform';
import { GooglePlus } from '@ionic-native/google-plus';
import { Facebook, FacebookLoginResponse } from '@ionic-native/facebook';

/**
 * Generated class for the LogueoPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-logueo',
  templateUrl: 'logueo.html'
})
export class LogueoPage {

  login = {} as LoginOptions;
  todo: FormGroup;
  authState: any = null;
  mobile: boolean;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private afa: AngularFireAuth,
    private formBuilder: FormBuilder,
    public alertCtrl: AlertController,
    public plt: Platform,
    private googlePlus: GooglePlus,
    private fb: Facebook,
    public loadingCtrl: LoadingController
  ) {
    this.mobile = this.plt.is('cordova');
    this.form();
  }

  form() {
    this.todo = this.formBuilder.group({
      username: [this.login.username, Validators.required],
      password: [this.login.password, Validators.required]
    });
  }

  registrar() {
    this.navCtrl.push('RegistroPage', {
      username: this.todo.value.username
    });
  }

  async logueo() {
    this.login = this.todo.value;
    this.afa.auth.signInWithEmailAndPassword(this.login.username, this.login.password).then(() => {
      this.navCtrl.push(HomePage);
    }).catch(e => {
      switch (e.code) {
        case 'auth/user-not-found':
          this.alertCtrl.create({
            title: 'El usuario no existe en el sistema',
            message: '¿Deseas registrarte?',
            buttons: [{
              text: 'No',
              handler: () => {
                this.todo.patchValue({ username: '', password: '' });
              }
            }, {
              text: 'Si',
              handler: () => {
                this.registrar();
              }
            }]
          }).present();
          break;

        case 'auth/wrong-password':
          this.todo.patchValue({ password: '' });
          this.alertCtrl.create({
            title: 'Error de autenticación',
            message: 'La contraseña no es válida',
            buttons: [{ text: 'OK' }]
          }).present();
          break;
      }
    });
  }

  loguearFacebook() {
    if (this.mobile) {
      this.fb.login(['public_profile', 'user_friends', 'email'])
        .then((res: FacebookLoginResponse) => console.log('Logged into Facebook!', res))
        .catch(e => console.log('Error logging into Facebook', e));
    } else {
      return this.afa.auth.signInWithPopup(new firebase.auth.FacebookAuthProvider())
        .catch(error => alert(error));
    }
  }

  loguearGoogle() {
    if (this.mobile) {
      this.googlePlus.login({
        scopes: 'profile',
        webClientId: '603689567449-76jevp0h6d5m9lktlitibouc5ocf2547.apps.googleusercontent.com',
        offline: true
      })
        .then(res => {
          this.afa.auth.signInWithCredential(firebase.auth.GoogleAuthProvider.credential(res.idToken)).then(() => {
          }).catch(err => alert(err));
        })
        .catch(err => alert('Ha ocurrido un error conectando con el servicio. Error: ' + err));
    } else {
      return this.afa.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
        .catch(error => alert(error));
    }
  }


}
