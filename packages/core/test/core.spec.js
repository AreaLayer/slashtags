import test from 'ava'
import { Core } from '../src/index.js'

const TESTING_RELAY_SERVER = 'ws://testnet3.hyperdht.org:8910'

test('Core: Nonexistent method', async (t) => {
  const node1 = await Core()
  const destination = await node1.listen()

  const node2 = await Core()

  try {
    await node2.request(destination, 'ping', { test: 1 })
  } catch (error) {
    t.deepEqual(error, {
      error: {
        code: -32601,
        message: 'Method not found: ping'
      },
      id: 0,
      jsonrpc: '2.0'
    })
  }
})

test('Core: Existing method', async (t) => {
  const node1 = await Core()
  node1.addMethods({ ping: async () => 'pong' })

  const destination = await node1.listen()

  const node2 = await Core()

  const response = await node2.request(destination, 'ping', {})

  t.deepEqual(response.body, 'pong')
})

test('Core: Acting as server and client', async (t) => {
  const node1 = await Core()
  node1.addMethods({ ping: async () => 'pong' })
  const destination1 = await node1.listen()

  const node2 = await Core()
  node2.addMethods({ ping: async () => 'pong' })
  const destination2 = await node2.listen()

  t.deepEqual((await node2.request(destination1, 'ping', {})).body, 'pong')

  const node3 = await Core()
  t.deepEqual((await node3.request(destination2, 'ping', {})).body, 'pong')
})

test('Core: use relay for the DHT', async (t) => {
  const node1 = await Core()
  node1.addMethods({ ping: async () => 'pong' })
  const key = await node1.listen()

  const node2 = await Core({ relays: [TESTING_RELAY_SERVER] })
  const result = await node2.request(key, 'ping', {})

  t.deepEqual(result.body, 'pong')
})
