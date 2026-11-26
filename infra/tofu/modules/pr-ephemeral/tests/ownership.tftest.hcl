mock_provider "cloudflare" {}

variables {
  account_id          = "0123456789abcdef0123456789abcdef"
  repository_id       = 123456
  pull_request_number = 42
}

run "isolated_databases_without_bucket" {
  command = plan

  assert {
    condition     = output.owner == "factory-repo-123456-pr-42"
    error_message = "Resources must be identified by repository and pull request."
  }

  assert {
    condition     = output.auth_database.name == "factory-repo-123456-pr-42-auth" && output.analytics_database.name == "factory-repo-123456-pr-42-analytics"
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
    condition     = output.artifacts_bucket == "factory-repo-123456-pr-42-artifacts"
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
