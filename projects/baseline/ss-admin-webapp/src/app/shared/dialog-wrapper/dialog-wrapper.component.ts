import { MatDialog } from "@angular/material";


import {
    Component, OnInit, Input, HostBinding, EventEmitter, Output
} from '@angular/core';

@Component({
    selector: 'dialog-wrapper',
    templateUrl: './dialog-wrapper.component.html',
    styleUrls: ['./dialog-wrapper.component.scss']
})
export class DialogWrapperComponent implements OnInit {
    constructor(private dialog: MatDialog) { }

    @Output() onClose: EventEmitter<any> = new EventEmitter();
    @Input() canClose: boolean = true;
    @Input() overflowYGradient: boolean = false;
    @Input() @HostBinding('style.padding.px') padding: number = 20;

    close() {
        this.onClose.next()
        this.dialog.closeAll()
    }

    ngOnInit() { }
}
