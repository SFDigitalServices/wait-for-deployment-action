# Wait for deployment GitHub Action

This action blocks until a deployment is ready for your push, and outputs its
URL so that you can run tests and other checks against a live site without
running it in Actions.

This has only been tested with [Vercel](https://vercel.com), but it only uses
the GitHub Deployments API, so in theory it will work with any platform that
creates deployments on each push.

## Setup

```yml
name: Test
on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: SFDigitalServices/wait-for-deployment-action@master
        id: deployment
        with:
          token: ${{ github.token }}
          environment: Preview

      - run: echo "Deployed to: ${{ steps.deployment.outputs.url }}"
```

## Inputs

### `token`
This is your GitHub access token, typically accessible via `${{ github.token }}`.

### `environment`
This is the deployment environment to target. The Vercel integration deploys
every push to the `Preview` environment, and pushes to the default branch to
`Production`.

**TODO:** document how to set the environment conditionally.

### `timeout`
The number of seconds after which to give up with an error. Default: 30.

### `interval`
The number of seconds to wait between polls to the deployments API. Default: 5.

## Outputs

### `url`
The target URL of the deployment, if found.

### `id`
The id of the deployment.
