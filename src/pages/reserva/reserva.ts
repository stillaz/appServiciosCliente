import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, ModalController, ViewController } from 'ionic-angular';
import { DisponibilidadOptions } from '../../interfaces/disponibilidad-options';
import { ServicioOptions } from '../../interfaces/servicio-options';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '../../../node_modules/angularfire2/firestore';
import { IndiceOptions } from '../../interfaces/indice-options';
import { UsuarioOptions } from '../../interfaces/usuario-options';
import { EmpresaOptions } from '../../interfaces/empresa-options';
import moment from 'moment';
import { Observable } from '../../../node_modules/rxjs';

/**
 * Generated class for the ReservaPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-reserva',
  templateUrl: 'reserva.html',
})
export class ReservaPage {

  disponibilidad: DisponibilidadOptions;
  horario: DisponibilidadOptions[];
  servicios: ServicioOptions[];
  idempresa: string;
  filePathEmpresa: string;
  empresaDoc: AngularFirestoreDocument<EmpresaOptions>;
  idcarrito: number;
  filePathUsuarios: string;
  usuariosCollection: AngularFirestoreCollection<UsuarioOptions>;
  usuario: UsuarioOptions;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private afs: AngularFirestore,
    public alertCtrl: AlertController,
    public modalCtrl: ModalController,
    public viewCtrl: ViewController
  ) {
    this.disponibilidad = this.navParams.get('disponibilidad');
    this.idempresa = this.navParams.get('idempresa');
    this.horario = this.navParams.get('horario');
    this.filePathEmpresa = 'negocios/' + this.idempresa;
    this.empresaDoc = this.afs.doc<EmpresaOptions>(this.filePathEmpresa);
    this.usuariosCollection = this.empresaDoc.collection('/usuarios/');
    this.loadIdCarrito();
    this.updateServicios();
  }

  updateServicios() {
    this.servicios = [];
    let servicioMap = [];
    let perfilMap = [];
    let arraperfiles = this.disponibilidad.usuarios.map(usuario => {
      return usuario.perfiles
    });

    arraperfiles.forEach(arrperfiles => {
      arrperfiles.forEach(perfil => {
        if (!perfilMap[perfil.id]) {
          perfilMap[perfil.id] = perfil;
        }
      });
    });

    for (let perfil in perfilMap) {
      if (perfilMap[perfil].servicios) {
        perfilMap[perfil].servicios.forEach(servicio => {
          if (!servicioMap[servicio.id]) {
            servicioMap[servicio.id] = true;
            this.servicios.push(servicio);
          }
        });
      }
    }
  }

  loadIdCarrito() {
    let indiceCarritoDoc = this.afs.doc<IndiceOptions>(this.filePathEmpresa + '/indices/idcarrito');
    return new Promise(resolve => {
      indiceCarritoDoc.ref.get().then(data => {
        this.idcarrito = data.exists ? data.get('id') : 1;
        indiceCarritoDoc.set({ id: this.idcarrito + 1 });
        resolve('ok');
      });
    })
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

  loadUsuariosDisponibles(servicio: ServicioOptions) {
    return new Observable<UsuarioOptions[]>((observer) => {
      let usuarios: UsuarioOptions[];
      this.usuariosCollection.valueChanges().subscribe(data => {
        let usuariosI: UsuarioOptions[];
        usuariosI = data.filter(usuario => usuario.perfiles.some(perfil => {
          if (perfil.servicios) {
            return perfil.servicios.some(servicioUsuario => servicioUsuario.id === servicio.id);
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
                if (dataNoDisponible) {
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

  agregar(servicio: ServicioOptions) {
    this.loadUsuariosDisponibles(servicio).subscribe(data => {
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
        let usuarioModal = this.modalCtrl.create('UsuarioPage', {
          disponibilidad: this.disponibilidad,
          servicio: servicio,
          idempresa: this.idempresa
        });

        usuarioModal.onDidDismiss(data => {
          if (data) {
            this.usuario = data;
          } else {
            this.viewCtrl.dismiss();
          }
        });

        usuarioModal.present();
      }
    });
  }
}
