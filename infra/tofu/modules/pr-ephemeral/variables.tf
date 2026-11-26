variable "account_id" {
  type        = string
  description = "Cloudflare staging account ID. Never use a production account."

  validation {
    condition     = can(regex("^[0-9a-f]{32}$", var.account_id))
    error_message = "account_id must be a lowercase Cloudflare account ID."
  }
}

variable "repository_id" {
  type        = number
  description = "Immutable GitHub repository ID that owns these resources."

  validation {
    condition     = var.repository_id > 0 && var.repository_id <= 999999999999 && floor(var.repository_id) == var.repository_id
    error_message = "repository_id must be a positive integer of at most 12 digits."
  }
}

variable "pull_request_number" {
  type        = number
  description = "Pull request number within the owning repository."

  validation {
    condition     = var.pull_request_number > 0 && var.pull_request_number <= 999999999 && floor(var.pull_request_number) == var.pull_request_number
    error_message = "pull_request_number must be a positive integer of at most 9 digits."
  }
}

variable "create_artifacts_bucket" {
  type        = bool
  description = "Create a separate bucket when the preview needs isolated artifacts."
  default     = false
}
