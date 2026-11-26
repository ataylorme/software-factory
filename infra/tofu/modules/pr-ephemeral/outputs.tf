output "owner" {
  description = "Stable resource ownership identifier for this repository and pull request."
  value       = local.owner
}

output "auth_database" {
  value = {
    id   = cloudflare_d1_database.auth.id
    name = cloudflare_d1_database.auth.name
  }
}

output "analytics_database" {
  value = {
    id   = cloudflare_d1_database.analytics.id
    name = cloudflare_d1_database.analytics.name
  }
}

output "artifacts_bucket" {
  value = var.create_artifacts_bucket ? cloudflare_r2_bucket.artifacts[0].name : null
}
