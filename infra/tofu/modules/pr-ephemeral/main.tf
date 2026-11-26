terraform {
  required_version = ">= 1.10.0, < 2.0.0"

  required_providers {
    cloudflare = {
      source  = "registry.terraform.io/cloudflare/cloudflare"
      version = ">= 5.29.0, < 6.0.0"
    }
  }
}

locals {
  owner = "factory-repo-${var.repository_id}-pr-${var.pull_request_number}"
}

resource "cloudflare_d1_database" "auth" {
  account_id = var.account_id
  name       = "${local.owner}-auth"
}

resource "cloudflare_d1_database" "analytics" {
  account_id = var.account_id
  name       = "${local.owner}-analytics"
}

resource "cloudflare_r2_bucket" "artifacts" {
  count      = var.create_artifacts_bucket ? 1 : 0
  account_id = var.account_id
  name       = "${local.owner}-artifacts"
}
