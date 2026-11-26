# OpenTofu

## Status

The `modules/pr-ephemeral` module defines separate auth and analytics D1
databases and an optional R2 bucket for a single pull request. Names include the
immutable GitHub repository ID and pull request number. Its outputs include the
database names and IDs, the optional bucket name, and the owner identifier.

This is not yet a deployable infrastructure configuration. Staging and
production roots, protected remote state, Access, Worker configuration, and
deployment and cleanup automation are not implemented. Do not deploy previews
or run cleanup from this module until those protections are in place.

## Ownership and isolation requirements

- Invoke the module from a root dedicated to one PR, in a staging-only
  Cloudflare account with credentials that cannot access production. The module
  cannot verify that an account or credentials are staging-only.
- Give each repository and PR a separate, protected, locked remote state key.
  Never place shared infrastructure in the PR state. Do not use a local state
  file for deployed resources.
- Before cleanup, verify the state key, repository ID, PR number, account and
  exact resource IDs against the recorded owner. Destroy only that PR's state;
  never select resources for deletion by name or prefix alone.
- A bucket prefix is not an isolation boundary. Enable the optional bucket when
  a preview needs isolated R2 data. Do not bind a production bucket or database.
- R2 state storage must be bootstrapped separately and protected as sensitive:
  state can contain credentials. Test concurrent locking against the actual
  backend before any real apply; this module does not configure or test it.

## Module checks

With OpenTofu 1.10.7 installed:

```sh
cd infra/tofu/modules/pr-ephemeral
tofu fmt -check -recursive
tofu init -backend=false -lockfile=readonly
tofu validate
tofu test
```

The tests use a mocked provider and do not contact Cloudflare or test remote
state concurrency.
