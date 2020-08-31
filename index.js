const core = require('@actions/core')
const github = require('@actions/github')

const options = {
  token: core.getInput('github-token'),
  environment: core.getInput('environment'),
  timeout: core.getInput('timeout'),
  interval: core.getInput('interval')
}

waitForDeployment(options)
  .then(res => {
    core.setOutput('id', res.deployment.id)
    core.setOutput('url', res.url)
  })
  .catch(error => {
    core.setFailed(error.message)
  })

async function waitForDeployment (options) {
  const {
    token,
    interval,
    environment
  } = options

  const waitGroup = 'Waiting...'
  const timeout = parseInt(options.timeout) || 30

  const { sha } = github.context
  const octokit = github.getOctokit(token)
  const start = Date.now()

  const params = {
    ...github.context.repo,
    environment,
    sha
  }

  core.info(`Deployment parameters: ${JSON.stringify(params, null, 2)}`)
  // throw new Error('DERP')

  core.startGroup(waitGroup)
  while (true) {
    const { data: deployments } = await octokit.repos.listDeployments(params)
    let n = deployments.length
    core.info(`Found ${n} deployment${n === 1 ? '' : 's'}...`)

    for (const deployment of deployments) {
      core.info(`  getting statuses for deployment ${deployment.id}...`)

      const { data: statuses } = await octokit.request('GET /repos/:owner/:repo/deployments/:deployment/statuses', {
        ...github.context.repo,
        deployment: deployment.id
      })

      n = statuses.length
      core.info(`  found ${n} status${n === 1 ? '' : 'es'}`)

      const [success] = statuses
        .filter(status => status.state === 'success')
      if (success) {
        core.endGroup(waitGroup)
        core.group('Deployment payload', () => {
          core.info(JSON.stringify(success, null, 2)})
        })
        return {
          deployment,
          status: success,
          url: success.target_url
        }
      } else {
        core.info(`No statuses with state === "success": "${statuses.map(status => status.state).join('", "')}"`)
      }

      await sleep(interval)
    }

    const elapsed = (Date.now() - start) / 1000
    if (elapsed >= timeout) {
      throw new Error(`Timing out after ${timeout} seconds (${elapsed} elapsed)`)
    }
  }
}

function sleep (seconds) {
  const ms = parseInt(seconds) / 1000 || 1
  return new Promise(resolve => setTimeout(resolve, ms))
}
