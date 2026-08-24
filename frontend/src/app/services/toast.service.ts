import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircle,
  alertCircleOutline,
  checkmarkCircle,
  checkmarkCircleOutline,
  informationCircle,
  informationCircleOutline,
  warning,
  warningOutline,
} from 'ionicons/icons';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  constructor(private toastCtrl: ToastController) {
    addIcons({
      alertCircle,
      alertCircleOutline,
      checkmarkCircle,
      checkmarkCircleOutline,
      informationCircle,
      informationCircleOutline,
      warning,
      warningOutline,
    });
  }

  async show(message: string, type: ToastType = 'info', duration = 3000): Promise<void> {
    if (!message) return;

    let icon = 'information-circle';
    if (type === 'success') icon = 'checkmark-circle';
    else if (type === 'error') icon = 'alert-circle';
    else if (type === 'warning') icon = 'warning';

    const toast = await this.toastCtrl.create({
      message,
      duration,
      position: 'top',
      swipeGesture: 'vertical',
      icon,
      cssClass: `fordago-mobile-toast toast-${type}`,
    });

    await toast.present();
  }

  success(message: string, duration = 3000): Promise<void> {
    return this.show(message, 'success', duration);
  }

  error(message: string, duration = 3500): Promise<void> {
    return this.show(message, 'error', duration);
  }

  warning(message: string, duration = 3000): Promise<void> {
    return this.show(message, 'warning', duration);
  }

  info(message: string, duration = 3000): Promise<void> {
    return this.show(message, 'info', duration);
  }
}
