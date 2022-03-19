import { Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Injectable()
export class ApiService {
  constructor(private httpClient: HttpClient) { }
  getData(value) {
    return this.httpClient.get('https://api.icndb.com/jokes/random/3')
  }
}