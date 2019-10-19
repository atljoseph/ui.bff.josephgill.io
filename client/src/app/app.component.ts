import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent { 
  title = 'client';
  response: any;

  constructor(private httpClient: HttpClient) {

  }

  clickBFFTest() {
    this.response = {}
    this.httpClient.get('api/test').subscribe(
      (success) => {
      console.log('success')
      this.response = success
    }, (failure) => {
      console.log('failure')
      this.response = failure;
    }, () => {
      console.log('completed')
    })
  }

  clickGoTest() {
    this.response = {}
    this.httpClient.get('go/test?name=GO').subscribe(
      (success) => {
      console.log('success')
      this.response = success
    }, (failure) => {
      console.log('failure')
      this.response = failure;
    }, () => {
      console.log('completed')
    })
  }

  clickGoError() {
    this.response = {}
    this.httpClient.get('go/error').subscribe(
      (success) => {
      console.log('success')
      this.response = success
    }, (failure) => {
      console.log('failure')
      this.response = failure;
    }, () => {
      console.log('completed')
    })
  }
}
