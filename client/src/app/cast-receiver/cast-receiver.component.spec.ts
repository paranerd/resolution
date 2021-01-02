import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastReceiverComponent } from './cast-receiver.component';

describe('CastReceiverComponent', () => {
  let component: CastReceiverComponent;
  let fixture: ComponentFixture<CastReceiverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastReceiverComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastReceiverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
