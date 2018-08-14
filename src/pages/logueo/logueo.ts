import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { AngularFireAuth } from 'angularfire2/auth';
import { LoginOptions } from '../../interfaces/login-options';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HomePage } from '../home/home';
import firebase from 'firebase';

/**
 * Generated class for the LogueoPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-logueo',
  templateUrl: 'logueo.html',
})
export class LogueoPage {

  login = {} as LoginOptions;
  todo: FormGroup;
  authState: any = null;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private afa: AngularFireAuth,
    private formBuilder: FormBuilder,
    public alertCtrl: AlertController
  ) {
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
    this.socialSignIn(new firebase.auth.FacebookAuthProvider());
  }

  loguearGoogle() {
    this.socialSignIn(new firebase.auth.GoogleAuthProvider());
  }

  private socialSignIn(provider) {
    return this.afa.auth.signInWithPopup(provider)
      .then((credential) => {
        console.log(credential.user);
      })
      .catch(error => console.log(error));
  }

}
