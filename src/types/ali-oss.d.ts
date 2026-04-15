declare module 'ali-oss' {
  interface OSSOptions {
    accessKeyId: string
    accessKeySecret: string
    bucket: string
    region?: string
    endpoint?: string
    [key: string]: any
  }

  interface PutResult {
    name: string
    url: string
    res: any
  }

  interface SignatureUrlOptions {
    expires?: number
    response?: Record<string, string>
    [key: string]: any
  }

  class OSS {
    constructor(options: OSSOptions)
    put(name: string, file: Buffer | string, options?: any): Promise<PutResult>
    delete(name: string): Promise<any>
    signatureUrl(name: string, options?: SignatureUrlOptions): string
  }

  export = OSS
}
