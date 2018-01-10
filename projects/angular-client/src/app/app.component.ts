import { Component } from '@angular/core';
import {
  HelloController, UsersController, TestController,
  ParentClass, ChildClass, ChildClass2
} from 'isomorphic-lib';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {


  constructor(
    private hello: HelloController,
    test: TestController,
    user: UsersController,
    parent: ParentClass,
    child: ChildClass,
    child2: ChildClass2
  ) {


    test.__model.getAll().received.subscribe(books => {
      console.log('books', books);
    });

    user.__model.getAll().received.subscribe(user => {
      console.log('users', user);
    });
    hello.deleteUser(1111).received.subscribe(d => console.log(d));
    hello.saveUSer(2222, { aa: 'aaa' }).received.subscribe(d => console.log(d));
    hello.updateUSer(333, 'super cookies').received.subscribe(d => console.log(d));

    hello.getUsersList(1).received.subscribe(d => {
      console.log('USER LIST', d);
      console.log('users', d.body.json);
    });

    const sub = hello.getUser(888).received.subscribe(d => {
      console.log(d);
      this.data.username = d.body.json.username;
      sub.unsubscribe();
    });


    parent.get().received.subscribe(data => console.log('parent:', data.body.text));
    child.get().received.subscribe(data => console.log('child:', data.body.text));
    child2.get().received.subscribe(data => console.log('child2:', data.body.text));
    child2.loveme().received.subscribe(data => console.log('child2 love :', data.body.text));
  }

  title = 'app';
  submit() {
    const sub = this.hello.modifyUser(1, this.data).received.subscribe(d => {
      console.log('modify ok', d);
      sub.unsubscribe();
    });
  }

  model = {
    user: this.hello.getUser(11).received.map(d => {
      return d.body.json;
    })
  };

  data = {
    username: '-'
  };

}
