import { MatDialog, MatDialogRef } from '@angular/material/dialog';
// other
import { Log, Level } from 'ng2-logger/browser';
const log = Log.create('dialog - wrapper');

import {
  Component, OnInit, Input, HostBinding, EventEmitter, Output
} from '@angular/core';

@Component({
  selector: 'dialog-wrapper',
  templateUrl: './dialog-wrapper.component.html',
  styleUrls: ['./dialog-wrapper.component.scss']
})
export class DialogWrapperComponent implements OnInit {
  // tslint:disable-next-line:no-output-on-prefix
  @Output() onClose: EventEmitter<any> = new EventEmitter();
  constructor(private dialog: MatDialog) { }

  @Input() dialogRef: MatDialogRef<any>;


  @Input() canClose = true;
  @Input() overflowYGradient = false;
  @Input() @HostBinding('style.padding.px') padding = 20;

  close() {

    log.i('close dialog!');
    this.onClose.next();
    this.dialog.closeAll();
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  ngOnInit() { }
}
