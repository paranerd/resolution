import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastSenderComponent } from './cast-sender.component';

describe('CastSenderComponent', () => {
  let component: CastSenderComponent;
  let fixture: ComponentFixture<CastSenderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastSenderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastSenderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
