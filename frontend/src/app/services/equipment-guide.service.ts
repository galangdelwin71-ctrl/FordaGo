import { Injectable } from '@angular/core';
import {
  EquipmentFullGuide,
  ExerciseVariation,
  EQUIPMENT_GUIDES_MAP,
  ALL_EQUIPMENT_GUIDES,
} from '../data/equipment-guides.data';

@Injectable({
  providedIn: 'root',
})
export class EquipmentGuideService {

  getAllGuides(): EquipmentFullGuide[] {
    return ALL_EQUIPMENT_GUIDES;
  }

  getGuideById(id: number | string): EquipmentFullGuide | null {
    const numericId = typeof id === 'string' ? parseInt(id.replace(/\D/g, ''), 10) : id;
    if (numericId && EQUIPMENT_GUIDES_MAP[numericId]) {
      return EQUIPMENT_GUIDES_MAP[numericId];
    }

    // Try name or keyword lookup
    const str = String(id).toLowerCase().trim();
    return this.findGuideByKeyword(str);
  }

  getGuideByName(name: string): EquipmentFullGuide | null {
    if (!name) return null;
    const lower = name.toLowerCase().trim();
    return this.findGuideByKeyword(lower);
  }

  private findGuideByKeyword(query: string): EquipmentFullGuide | null {
    if (!query) return null;

    // 1. Direct name match
    const exact = ALL_EQUIPMENT_GUIDES.find(
      (g) => g.name.toLowerCase() === query
    );
    if (exact) return exact;

    // 2. Keyword containment match
    const partial = ALL_EQUIPMENT_GUIDES.find((g) => {
      const gName = g.name.toLowerCase();
      const gCat = g.category.toLowerCase();
      return (
        gName.includes(query) ||
        query.includes(gName) ||
        gCat.includes(query)
      );
    });
    if (partial) return partial;

    // 3. Fallback matching standard categories
    if (query.includes('cable') || query.includes('pulley')) {
      return this.getGuideById(42) || this.getGuideById(29);
    }
    if (query.includes('bench') || query.includes('chest')) {
      return this.getGuideById(52) || this.getGuideById(36);
    }
    if (query.includes('squat') || query.includes('rack')) {
      return this.getGuideById(44) || this.getGuideById(31);
    }
    if (query.includes('leg') || query.includes('press')) {
      return this.getGuideById(45) || this.getGuideById(51);
    }
    if (query.includes('kettlebell')) {
      return this.getGuideById(54);
    }
    if (query.includes('shoulder')) {
      return this.getGuideById(40) || this.getGuideById(38);
    }
    if (query.includes('lat') || query.includes('pull')) {
      return this.getGuideById(48) || this.getGuideById(46);
    }

    return null;
  }
}
