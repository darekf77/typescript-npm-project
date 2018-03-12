
// prevHeight = 0;


// constructor() {

// }

// ngOnInit() {
// }

// ngAfterViewInit() {
//   this.is.afterViewInit = true;
//   this.calculateHeight()
// }


// get elem(): HTMLElement {
//   return this.wrapper ? this.wrapper.nativeElement : undefined;
// }

// get head(): HTMLElement {
//   return this.header ? this.header.nativeElement : undefined;
// }





// public onMouseWheelFirefox(e: MouseEvent) {
//   let delta = parseInt(e['wheelDelta'] || -e.detail, undefined);
//   this.onMouseWheel(e as any, delta)
// }

// public onMouseWheel(e: WheelEvent, delta: number = undefined) {
//   // log.i('e.deltaY;', e.deltaY)
//   e.preventDefault();
//   if (!delta) delta = e.deltaY;
//   let prev = this.is.scroll;
//   this.is.scroll = (this.elem.scrollTop > this.thresholdScroll)
//   if (prev !== this.is.scroll) this.calculateHeight()
//   if (this.elem.scrollTop + delta < 0) {
//     this.elem.scrollTop = 0;
//   } else {
//     this.elem.scrollTop += delta;
//   }

//   // log.i('this.elem.scrollTop', this.elem.scrollTop)
//   // log.i('this.thresholdScroll', this.thresholdScroll)
// }



// @HostListener('window:resize', ['$event'])
// onResize(event) {
//   if (!this.is.afterViewInit) {
//     return;
//   }
//   this.calculateHeight()
// }



// calculateHeight() {
//   setTimeout(() => {
//     if (!this.is.afterViewInit) {
//       return;
//     }
//     const target = this.head.firstElementChild;
//     if (!target) {
//       return;
//     }
//     const header = window.getComputedStyle(target, null);
//     const heightMinus = parseInt(header.height.replace('px', ''), 2);
//     log.i('heightMinus', heightMinus);
//     log.i('target', target);

//     log.i('this.head', this.head);

//     let h = (document.body.clientHeight);
//     log.i('h', h)
//     this.paddingTop = heightMinus;
//     this.height = h;
//     // $(this.elem).slimScroll({
//     //     height: `${this.height - heightMinus}px`
//     // });
//   })
// }
