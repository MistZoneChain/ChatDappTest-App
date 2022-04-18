import request from 'request';

export class WebRequest {
  requestUrl: string;

  constructor(requestUrl: string) {
    this.requestUrl = requestUrl;
  }

  get(stringArgs: string): Promise<any> {
    return new Promise((resolve, reject) => {
      request(
        {
          url: `${this.requestUrl}${stringArgs}`,
          method: 'GET',
        },
        function(error: any, response: any, body: any) {
          if (error) {
            reject(error);
          }
          let res: any;
          try {
            res = JSON.parse(body);
            resolve(res);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  post(stringArgs: string, headers: any, body: any, host?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      request(
        {
          url: `${host ? host : this.requestUrl}${stringArgs}`,
          method: 'POST',
          headers: headers,
          body: body,
        },
        function(error: any, response: any, body: any) {
          if (error) {
            reject(error);
          }
          let res: any;
          try {
            res = JSON.parse(body);
            resolve(res);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }
}
