// In types/index.d.ts
declare module 'xmltojson' {
    export class XMLJSONTransformer {
      constructor(config?: object);
      xmlToJSON(xmlString: string, asString?: boolean): object | string;
      jsonToXML(jsonObj: object): string;
      jsonToString(jsonObj: object): string;
      getPath(obj: object, path: string, fallback?: any): any;
      generateJSONSchema(): object;
    }
  
    // Export other classes as well
    export class ConfigurationManager { /* ... */ }
    export class XMLToJSONConverter { /* ... */ }
    // etc.
  
    export default XMLJSONTransformer;
  }