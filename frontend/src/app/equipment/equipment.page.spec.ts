import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EquipmentPage } from './equipment.page';

describe('EquipmentPage', () => {
  let component: EquipmentPage;
  let fixture: ComponentFixture<EquipmentPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EquipmentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
