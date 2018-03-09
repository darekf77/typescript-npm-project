
import {
    Component, OnInit, HostBinding, AfterViewInit,
    HostListener, Input, ElementRef, ViewChild
} from '@angular/core';

import { Log, Level } from "ng2-logger";


const log = Log.create('slider vertical layout', Level.__NOTHING)



@Component({
    selector: 'slider-vertical',
    templateUrl: 'slider-vertical.component.html',
    styleUrls: ['slider-vertical.component.scss']
})

export class SliderVerticalComponent implements AfterViewInit, OnInit {
    constructor() {

    }

    ngOnInit() {
    }

    ngAfterViewInit() {
        this.is.afterViewInit = true;
        this.calculateHeight()
    }

    @ViewChild('wrapper') public wrapper: ElementRef;

    @ViewChild('header') public header: ElementRef;
    get elem(): HTMLElement {
        return this.wrapper ? this.wrapper.nativeElement : undefined
    }

    get head(): HTMLElement {
        return this.header ? this.header.nativeElement : undefined
    }

    @Input() thresholdScroll = 0;
    @HostBinding('style.height.px') height: number = 0;
    @HostBinding('style.paddingTop.px') paddingTop: number = 0;



    public onMouseWheelFirefox(e: MouseEvent) {
        let delta = parseInt(e['wheelDelta'] || -e.detail, undefined);
        this.onMouseWheel(e as any, delta)
    }

    public onMouseWheel(e: WheelEvent, delta: number = undefined) {
        // log.i('e.deltaY;', e.deltaY)
        e.preventDefault();
        if (!delta) delta = e.deltaY;
        let prev = this.is.scroll;
        this.is.scroll = (this.elem.scrollTop > this.thresholdScroll)
        if (prev !== this.is.scroll) this.calculateHeight()
        if (this.elem.scrollTop + delta < 0) {
            this.elem.scrollTop = 0;
        } else {
            this.elem.scrollTop += delta;
        }

        // log.i('this.elem.scrollTop', this.elem.scrollTop)
        // log.i('this.thresholdScroll', this.thresholdScroll)
    }


    is = {
        scroll: false,
        afterViewInit: false
    }

    @HostListener('window:resize', ['$event'])
    onResize(event) {
        if (!this.is.afterViewInit) return;
        this.calculateHeight()
    }


    prevHeight: number = 0;
    calculateHeight() {
        setTimeout(() => {
            if (!this.is.afterViewInit) return;
            let target = this.head.firstElementChild;
            if (!target) return;
            let header = window.getComputedStyle(target, null);
            let heightMinus = parseInt(header.height.replace('px', ""))
            log.i('heightMinus', heightMinus)
            log.i('target', target)

            log.i('this.head', this.head)

            let h = (document.body.clientHeight)
            log.i('h', h)
            this.paddingTop = heightMinus;
            this.height = h;
            // $(this.elem).slimScroll({
            //     height: `${this.height - heightMinus}px`
            // });
        })
    }


}
