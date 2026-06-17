import fetch from 'node-fetch'

async function test() {
  const url = 'https://cc.freemodel.dev/v1/messages'
  const key = 'fe_oa_aac63dcc3f85e3fa5358d256a2f8414878b9ab7429b24962'

  const headers = {
    'x-api-key': key,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
    'User-Agent': 'claude-code/2.1.131 (cli)'
  }

  const payload = {
    model: 'claude-sonnet-4-5',
    max_tokens: 10,
    messages: [{ role: 'user', content: 'hello' }]
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  })

  console.log(res.status)
  console.log(await res.text())
}

test()
