import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-multimedia',
  templateUrl: './multimedia.component.html',
  styleUrls: ['./multimedia.component.scss']
})
export class MultimediaComponent implements OnInit {

  @ViewChild('dialog')
  private dialog: TemplateRef<any>;


  constructor(private materialDialog: MatDialog) { }

  open() {
    this.materialDialog.open(this.dialog, {
      minWidth: '900px'
    });
  }

  ngOnInit() {
    setTimeout(() => {
      this.open()
    })
  }

}
