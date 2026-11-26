mock_provider "cloudflare" {}

# Plan-only fixtures: the mocked provider never contacts Cloudflare. The account
# and repository IDs are the real, nonsecret IDs for this project so ownership
# names match what a PR root would produce. Deployment roots must still supply
# their own staging account and repository inputs.
variables {
  account_id          = "16e8f7c4ab9857745900067adaee038a"
  repository_id       = 1466017304
  pull_request_number = 42
}

run "isolated_databases_without_bucket" {
  command = plan

  assert {
    condition     = output.owner == "factory-repo-1466017304-pr-42"
    error_message = "Resources must be identified by repository and pull request."
  }

  assert {
    condition     = output.auth_database.name == "factory-repo-1466017304-pr-42-auth" && output.analytics_database.name == "factory-repo-1466017304-pr-42-analytics"
    error_message = "Authentication and analytics must use distinct PR-owned databases."
  }

  assert {
    condition     = output.artifacts_bucket == null
    error_message = "An artifacts bucket must not be created by default."
  }
}

run "isolated_bucket" {
  command = plan

  variables {
    create_artifacts_bucket = true
  }

  assert {
    condition     = output.artifacts_bucket == "factory-repo-1466017304-pr-42-artifacts"
    error_message = "The optional bucket must be owned by this repository and pull request."
  }
}

run "reject_invalid_owner" {
  command = plan

  variables {
    pull_request_number = 0
  }

  expect_failures = [var.pull_request_number]
}
