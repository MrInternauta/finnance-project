import { Component, OnDestroy, OnInit } from '@angular/core';
import { UserUpdateDto } from '@gymTrack/auth/model/user.dto';
import { AlertController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';

import { AuthService } from '../../auth/services/auth.service';
import { ModalInfoService } from '../../core/services/modal.service';
import { PictureService } from '../../core/services/picture.service';
import { CategoryItemResponse } from '../dashboard/models';
import { WorkoutService } from '../dashboard/services/workout.service';
import { ProfileService } from './services/profile.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
})
export class Tab3Page implements OnInit, OnDestroy {
  public editMode = false;
  $susctiption!: Subscription;
  public myCategories: CategoryItemResponse[] = [];
  private categoriesSub?: Subscription;
  private userToUpdate!: UserUpdateDto;
  constructor(
    private alertController: AlertController,
    public authService: AuthService,
    private userService: ProfileService,
    private toastController: ToastController,
    private modalInfoService: ModalInfoService,
    private pictureService: PictureService,
    private workoutService: WorkoutService
  ) {
    this.userToUpdate = {};
  }

  ngOnInit(): void {
    this.loadMyCategories();
  }

  loadMyCategories() {
    this.categoriesSub?.unsubscribe();
    this.categoriesSub = this.workoutService.getCategories().subscribe(res => {
      // `isDefault` marks global categories; "Mis categorías" shows only the user's own.
      this.myCategories = (res?.categories || []).filter(c => !c.isDefault);
    });
  }

  async deleteCategory(category: CategoryItemResponse) {
    const alert = await this.alertController.create({
      header: 'Eliminar categoría',
      message: `¿Eliminar "${category.name}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: () => {
            this.workoutService.deleteCategory(category.id).subscribe({
              next: () => this.loadMyCategories(),
              error: () => this.modalInfoService.error('No se pudo eliminar la categoría', ''),
            });
          },
        },
      ],
    });
    await alert.present();
  }

  async sendResetPassword() {
    //TODO: Send email to reset
    const alert = await this.alertController.create({
      header: 'Reset password',
      message: 'An email will be sent, please, confirm the email to proceed',
      buttons: ['OK'],
    });

    await alert.present();
  }

  updateUserPicture() {
    this.pictureService.changePicture(this.authService._auth?.user?.id?.toString() || '', 'user', () => {
      //update the image in the view
      if (this.authService._auth?.user?.image) {
        this.authService._auth.user.image = this.authService._auth.user.image + '?' + new Date().getTime();
      }
    });
  }

  async upgradePro() {
    const alert = await this.alertController.create({
      header: 'Upgrade to PRO',
      message: 'An email will be sent to proceed',
      buttons: ['OK'],
    });

    await alert.present();
  }

  public get areChangesAvalible() {
    return this.userToUpdate.name || this.userToUpdate.lastName || this.userToUpdate.phone || this.userToUpdate.role;
  }

  async editProfile() {
    if (this.areChangesAvalible) {
      this.userToUpdate = {
        ...this.authService._auth?.user,
        ...this.userToUpdate,
      };

      console.log(this.userToUpdate);
      //remove special characters from phone
      this.userToUpdate.phone = this.userToUpdate?.phone?.replace(/\D/g, '') || '';
      //Detect changes
      const usertoUpdate = {
        name: this.userToUpdate.name,
        lastName: this.userToUpdate.lastName,
        phone: this.userToUpdate.phone,
        role: this.userToUpdate.role,
      };
      console.log(usertoUpdate);
      this.$susctiption = this.userService.putUser(String(this.authService.user?.id), usertoUpdate).subscribe(res => {
        this.presentModal(res.message, 'success');
        this.authService.saveStorage(res?.user?.id?.toString() || '', this.authService._auth?.token || '', res.user);
        this.editMode = false;
      });
    } else {
      this.presentModal();
    }
  }

  changeName($event: any) {
    this.userToUpdate['name'] = $event as string;
  }
  changelastName($event: any) {
    this.userToUpdate['lastName'] = $event as string;
  }
  changePhone($event: any) {
    this.userToUpdate['phone'] = $event as string;
  }

  presentModal(text = '', type: 'warning' | 'success' = 'warning') {
    if (type == 'warning') {
      this.modalInfoService.warning(text || 'No hay cambios pendientes para guardar', '');
    } else {
      this.modalInfoService.success(text || 'Guardado correctamente', '');
    }
  }

  ngOnDestroy(): void {
    this.$susctiption?.unsubscribe();
    this.categoriesSub?.unsubscribe();
  }
}
