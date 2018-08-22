import { Component, OnInit, Input } from '@angular/core';
import { DialogType, DIALOG } from 'ss-common-logic/browser/entities/DIALOG';

@Component({
  selector: 'app-dialog-part',
  templateUrl: './dialog-part.component.html',
  styleUrls: ['./dialog-part.component.scss']
})
export class DialogPartComponent implements OnInit {

  @Input() dialog: DIALOG;

  text: string;

  constructor() { }

  ngOnInit() {

  }

}
