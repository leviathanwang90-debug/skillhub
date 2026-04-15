import OSS from 'ali-oss'

let _client: OSS | null = null

function getClient(): OSS {
  if (!_client) {
    _client = new OSS({
      accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
      bucket: process.env.OSS_BUCKET!,
      region: process.env.OSS_REGION!,
      endpoint: process.env.OSS_ENDPOINT!,
    })
  }
  return _client
}

const PREFIX = process.env.OSS_SKILL_PREFIX || 'skillhub/'

export async function uploadToOss(key: string, buffer: Buffer, mime: string) {
  const client = getClient()
  const ossKey = `${PREFIX}${key}`
  await client.put(ossKey, buffer, {
    headers: { 'Content-Type': mime },
  })
  return ossKey
}

export async function getDownloadUrl(ossKey: string, fileName: string): Promise<string> {
  const client = getClient()
  const url = client.signatureUrl(ossKey, {
    expires: 600,
    response: {
      'content-disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
    },
  })
  return url
}

export async function deleteFromOss(ossKey: string) {
  const client = getClient()
  await client.delete(ossKey)
}
