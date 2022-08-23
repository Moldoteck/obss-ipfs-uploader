import Fastify from 'fastify'
import Crypto from 'crypto'
import { create as createIPFSNode } from 'ipfs-core'
import env from "./env.js";

const PORT = 420
const HOST = '0.0.0.0'

const fastify = Fastify({
  logger: true
})

async function main() {
  const ipfsNode = await createIPFSNode({
    repo: env.ENV === 'production'? '/var/ipfs/data' : './ipfs-data'
  })
  const version = await ipfsNode.version()

  console.log('IPFS Version:', version.version)

  fastify.post('/', async (request, reply) => {
    const filename = `obss_${Crypto.randomUUID()}.txt`
    const file = await ipfsNode.add({
      path: filename,
      content: new TextEncoder().encode(JSON.stringify(request.body))
    }, {pin: true})

    console.log('Added file:', file.path, file.cid.toString())
    return { file: file.path, cid: file.cid.toString() }
  })

  try {
    await fastify.listen({ port: PORT, host: HOST })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }

  const exitHandler = async (evtOrExitCodeOrError) => {
    console.log("shutdown! code: " + evtOrExitCodeOrError);
    if (ipfsNode.isOnline())
      await ipfsNode.stop()
    fastify.close(() => {
      process.exit(isNaN(+evtOrExitCodeOrError) ? 1 : +evtOrExitCodeOrError)
    });
  };

  [
    'beforeExit', 'uncaughtException', 'unhandledRejection',
    'SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP',
    'SIGABRT','SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV',
    'SIGUSR2', 'SIGTERM',
  ].forEach(evt => process.on(evt, exitHandler));
}

main().catch(console.error)