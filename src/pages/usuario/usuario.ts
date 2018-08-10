import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, ViewController } from 'ionic-angular';
import { UsuarioOptions } from '../../interfaces/usuario-options';
import { DisponibilidadOptions } from '../../interfaces/disponibilidad-options';
import { ServicioOptions } from '../../interfaces/servicio-options';
import { Observable } from 'rxjs';
import { AngularFirestoreCollection, AngularFirestoreDocument, AngularFirestore } from 'angularfire2/firestore';
import moment from 'moment';
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

  disponibilidad: DisponibilidadOptions;
  servicio: ServicioOptions;
  usuarios: UsuarioOptions[];
  usuariosCollection: AngularFirestoreCollection<UsuarioOptions>;
  filePathEmpresa: string;
  empresaDoc: AngularFirestoreDocument<EmpresaOptions>;
  idempresa: string;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public alertCtrl: AlertController,
    public viewCtrl: ViewController,
    private afs: AngularFirestore
  ) {
    this.disponibilidad = this.navParams.get('disponibilidad');
    this.servicio = this.navParams.get('servicio');
    this.idempresa = this.navParams.get('idempresa');
    this.filePathEmpresa = 'negocios/' + this.idempresa;
    this.empresaDoc = this.afs.doc<EmpresaOptions>(this.filePathEmpresa);
    this.usuariosCollection = this.empresaDoc.collection('/usuarios/');
    this.updateUsuarios();
  }

  loadReservaFechaUsuario(usuario: UsuarioOptions) {
    let fecha = this.disponibilidad.fechaInicio;
    let dia = moment(fecha).startOf('day').toDate().getTime().toString();
    let usuarioDoc = this.empresaDoc.collection('usuarios').doc(usuario.id);
    let disponibilidadUsuarioDoc = usuarioDoc.collection('disponibilidades').doc(dia);
    let reservaUsuarioDoc = disponibilidadUsuarioDoc.collection('disponibilidades').doc(fecha.getTime().toString());
    return new Promise(resolve => {
      reservaUsuarioDoc.valueChanges().subscribe(data => {
        resolve(data);
      });
    });
  }

  loadNoDisponibleFechaUsuario(usuario: UsuarioOptions) {
    let fecha = this.disponibilidad.fechaInicio;
    let dia = moment(fecha).startOf('day').toDate().getTime();
    let usuarioDoc = this.empresaDoc.collection('usuarios').doc(usuario.id);
    let indisponibilidadCollection = usuarioDoc.collection('indisponibilidades');
    return new Promise<any[]>(resolve => {
      indisponibilidadCollection.valueChanges().subscribe(indisponibles => {
        let encontrados = indisponibles.filter(indisponible => {
          let fechaDesde: Date = moment(new Date(indisponible.fechaDesde)).startOf('day').toDate();
          let fechaFin: Date = indisponible.indefinido ?
            moment(new Date(indisponible.fechaDesde)).endOf('day').toDate() :
            moment(new Date(indisponible.fechaHasta)).endOf('day').toDate();

          let isFecha = moment(dia).isBetween(fechaDesde, fechaFin);

          if (isFecha && indisponible.todoDia) {
            return indisponible;
          } else if (isFecha) {
            let horaDesde = moment(indisponible.horaDesde, 'HH:mm').toDate().getHours();
            let horaHasta = moment(indisponible.horaHasta, 'HH:mm').toDate().getHours();
            let horaReserva = fecha.getHours();
            if (horaDesde <= horaReserva && horaHasta >= horaReserva) {
              return indisponible;
            }
          }
        });

        resolve(encontrados);
      });
    });
  }

  loadUsuariosDisponibles() {
    return new Observable<UsuarioOptions[]>((observer) => {
      let usuarios: UsuarioOptions[];
      this.usuariosCollection.valueChanges().subscribe(data => {
        let usuariosI: UsuarioOptions[];
        usuariosI = data.filter(usuario => usuario.perfiles.some(perfil => {
          if (perfil.servicios) {
            return perfil.servicios.some(servicioUsuario => servicioUsuario.id === this.servicio.id);
          }
        }));

        usuarios = usuariosI;
        usuariosI.forEach(usuario => {
          this.loadReservaFechaUsuario(usuario).then(data => {
            let item = usuarios.indexOf(usuario);
            if (data) {
              usuarios.splice(item, 1);
            } else {
              this.loadNoDisponibleFechaUsuario(usuario).then(dataNoDisponible => {
                if (dataNoDisponible && dataNoDisponible[0]) {
                  usuarios.splice(item, 1);
                }
              });
            }
          });
        });

        observer.next(usuarios);
        observer.complete();
      });

      return { unsubscribe() { } };
    });
  }

  updateUsuarios() {
    this.loadUsuariosDisponibles().subscribe(data => {
      if (!data || !data[0]) {
        this.alertCtrl.create({
          title: 'Reservar',
          message: 'No es posible continuar, ya que no hay usuarios disponibles a esta hora',
          buttons: [{
            text: 'Ok',
            handler: () => {
              this.viewCtrl.dismiss();
            }
          }]
        }).present();
      } else if (data[0]) {
        this.usuarios = data;
      }
    });
  }

}
