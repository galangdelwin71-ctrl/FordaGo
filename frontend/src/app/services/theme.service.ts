import { Injectable } from '@angular/core';
import {
  Capacitor,
  SystemBars,
  SystemBarsStyle,
} from '@capacitor/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly storageKey = 'fordago-theme-mode';

  initTheme(): void {
    const saved = this.getSavedMode();
    this.applyTheme(saved ?? 'dark');
  }

  isDarkMode(): boolean {
    return document.documentElement.classList.contains('ion-palette-dark');
  }

  setTheme(mode: ThemeMode): void {
    this.applyTheme(mode);
    localStorage.setItem(this.storageKey, mode);
  }

  private getSavedMode(): ThemeMode | null {
    const raw = localStorage.getItem(this.storageKey);
    return raw === 'light' || raw === 'dark' ? raw : null;
  }

  private applyTheme(mode: ThemeMode): void {
    const dark = mode === 'dark';
    const html = document.documentElement;
    const body = document.body;

    html.classList.toggle('ion-palette-dark', dark);
    body.classList.toggle('ion-palette-dark', dark);

    html.classList.toggle('light-theme', !dark);
    body.classList.toggle('light-theme', !dark);

    html.style.colorScheme = mode;

    if (Capacitor.isNativePlatform()) {
      void SystemBars.setStyle({
        style: dark ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
      }).catch(() => undefined);
    }
  }
}
