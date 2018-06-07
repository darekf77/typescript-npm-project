import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-course-introduction',
  templateUrl: './course-introduction.component.html',
  styleUrls: ['./course-introduction.component.scss']
})
export class CourseIntroductionComponent implements OnInit {

  htmlContent = ''

  editorConfig = {
    // "editable": true,
    // "spellcheck": true,
    // "height": "1000px",
    "minHeight": "500px",
    // "width": "auto",
    // "minWidth": "0",
    // "translate": "yes",
    // "enableToolbar": true,
    // "showToolbar": true,
    // "placeholder": "Enter text here...",
    // "imageEndPoint": "",
    // "toolbar": [
    //   ["bold", "italic", "underline", "strikeThrough", "superscript", "subscript"],
    //   ["fontName", "fontSize", "color"],
    //   ["justifyLeft", "justifyCenter", "justifyRight", "justifyFull", "indent", "outdent"],
    //   ["cut", "copy", "delete", "removeFormat", "undo", "redo"],
    //   ["paragraph", "blockquote", "removeBlockquote", "horizontalLine", "orderedList", "unorderedList"],
    //   ["link", "unlink", "image", "video"]
    // ]
  }
  constructor() { }

  ngOnInit() {
  }

}
