import { Component, OnInit, ViewChild, ElementRef, HostBinding, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-moveable-popup',
  templateUrl: './moveable-popup.component.html',
  styleUrls: ['./moveable-popup.component.scss']
})
export class MoveablePopupComponent implements OnInit {

  @ViewChild('modal') modalRef: ElementRef;
  @Input() title = 'Modal title'
  @Output() pin = new EventEmitter();
  @Output() close = new EventEmitter();
  @Input() public pinned = false;

  changePinned(e) {
    console.log('pinned', e.target.checked)
    this.pin.next(e.target.checked)
  }


  modalTop = 100;
  modalLeft = 100;
  modalHeight = 300;
  modalWidth = 640;

  get wrapper(): HTMLElement {
    return this.modalRef && this.modalRef.nativeElement;
  }

  constructor() { }

  ngOnInit() {
  }

  closePopup(): void {
    this.close.next()
  }
  mousedown(e: MouseEvent) {
    this.StartDragAt(e.x, e.y);
  }
  onDragEnd(e: DragEvent) {
    console.log('drag end', e);
    e.preventDefault();
    if (e.x > 0 && e.y > 0) {
      this.moveTo(e.clientX, e.clientY);
    }
  }


  dragging(e: DragEvent): void {
    e.preventDefault();
    if (e.x > 0 && e.y > 0) {
      this.moveTo(e.clientX, e.clientY);
    }

  }

  popup = {
    dragYOffset: 0,
    dragXOffset: 0
  }
  StartDragAt(startX: number, startY: number) {

    this.popup.dragYOffset = startY - this.modalTop;
    this.popup.dragXOffset = startX - this.modalLeft;
  }

  moveTo(x: number, y: number) {

    this.modalTop = (y - this.popup.dragYOffset)
    this.modalLeft = (x - this.popup.dragXOffset)

    // window.localStorage.setItem(`${coordinateX}${this.id}`, (x - popup.dragXOffset).toString());
    // window.localStorage.setItem(`${coordinateY}${this.id}`, (y - popup.dragYOffset).toString());
  }

}
